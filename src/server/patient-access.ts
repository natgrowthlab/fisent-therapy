import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { database } from './db';

const QR_PREFIX = 'FISENT1.';
const YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;

export type AccessCredential = {
  id: string;
  qr_payload: string;
  expires_at: string;
  membership_status: 'ACTIVA' | 'INACTIVA' | 'VENCIDA';
};

type CredentialRow = {
  id: string;
  patient_id: number;
  membership_status: AccessCredential['membership_status'];
  expires_at: string;
};

export function credentialHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function signingSecret() {
  const secret = process.env.PATIENT_PASS_SECRET;
  if (!secret || secret.length < 32) throw new Error('PATIENT_PASS_SECRET no está configurada correctamente.');
  return secret;
}

function payloadFor(credentialId: string) {
  const signature = createHmac('sha256', signingSecret()).update(credentialId).digest('base64url');
  return `${QR_PREFIX}${credentialId}.${signature}`;
}

export async function createCredential(patientId: number): Promise<AccessCredential> {
  const sql = database();
  const [patient] = await sql`SELECT id FROM patients WHERE id = ${patientId} AND estado = true LIMIT 1`;
  if (!patient) throw new Error('Paciente no encontrado o inactivo.');

  const credentialId = randomUUID();
  const payload = payloadFor(credentialId);
  const expiresAt = new Date(Date.now() + YEAR_IN_MS).toISOString();
  await sql`UPDATE patient_access_credentials SET active = false WHERE patient_id = ${patientId} AND active = true`;
  const [credential] = await sql`INSERT INTO patient_access_credentials (id, patient_id, token_hash, expires_at)
    VALUES (${credentialId}, ${patientId}, ${credentialHash(payload)}, ${expiresAt})
    RETURNING id, membership_status, expires_at`;
  return {
    id: credential.id,
    qr_payload: payload,
    expires_at: new Date(credential.expires_at).toISOString(),
    membership_status: credential.membership_status,
  };
}

export async function currentOrNewCredential(patientId: number): Promise<AccessCredential> {
  const sql = database();
  const [credential] = await sql`SELECT id, membership_status, expires_at
    FROM patient_access_credentials
    WHERE patient_id = ${patientId} AND active = true AND expires_at > NOW()
    ORDER BY issued_at DESC LIMIT 1`;
  if (!credential) return createCredential(patientId);
  return {
    id: credential.id,
    qr_payload: payloadFor(credential.id),
    expires_at: new Date(credential.expires_at).toISOString(),
    membership_status: credential.membership_status,
  };
}

export function credentialIdFromPayload(payload: unknown) {
  if (typeof payload !== 'string' || !payload.startsWith(QR_PREFIX)) return null;
  const [credentialId, signature, ...rest] = payload.slice(QR_PREFIX.length).split('.');
  if (rest.length || !credentialId || !signature || !/^[0-9a-f-]{36}$/i.test(credentialId)) return null;
  const expected = createHmac('sha256', signingSecret()).update(credentialId).digest('base64url');
  const received = Buffer.from(signature);
  const signed = Buffer.from(expected);
  return received.length === signed.length && timingSafeEqual(received, signed) ? credentialId : null;
}

export async function validateCredential(payload: unknown, checkedInBy: number) {
  const credentialId = credentialIdFromPayload(payload);
  if (!credentialId) return { valid: false, message: 'Este QR no pertenece a una credencial FisenT válida.' };

  const sql = database();
  const [credential] = await sql`SELECT c.id, c.patient_id, c.membership_status, c.expires_at,
    p.nombre, p.apellido, p.num_doc
    FROM patient_access_credentials c
    INNER JOIN patients p ON p.id = c.patient_id
    WHERE c.id = ${credentialId} AND c.active = true AND p.estado = true
    LIMIT 1` as CredentialRow[] & Array<{ nombre: string; apellido: string; num_doc: string }>;
  if (!credential) return { valid: false, message: 'La credencial no existe, fue revocada o el paciente está inactivo.' };
  if (new Date(credential.expires_at).getTime() <= Date.now()) return { valid: false, message: 'La credencial está vencida.' };
  if (credential.membership_status !== 'ACTIVA') return { valid: false, membership_status: credential.membership_status, message: 'La membresía no está activa.' };

  await sql`UPDATE patient_access_credentials SET last_used_at = NOW() WHERE id = ${credential.id}`;
  await sql`INSERT INTO patient_check_ins (credential_id, patient_id, checked_in_by) VALUES (${credential.id}, ${credential.patient_id}, ${checkedInBy})`;
  return {
    valid: true,
    membership_status: credential.membership_status,
    patient: { id: Number(credential.patient_id), nombre: credential.nombre, apellido: credential.apellido, num_doc: credential.num_doc },
    check_in_at: new Date().toISOString(),
  };
}
