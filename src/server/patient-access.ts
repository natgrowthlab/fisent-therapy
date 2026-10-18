import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { database } from './db';
import { currentMembership, type Membership } from './memberships';

const QR_PREFIX = 'FISENT1.';
const YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;

export type AccessCredential = {
  id: string;
  qr_payload: string;
  expires_at: string;
  membership_status: 'ACTIVA' | 'INACTIVA' | 'VENCIDA';
  membership?: Pick<Membership, 'plan_code' | 'plan_name' | 'color' | 'sessions_per_week' | 'valid_from' | 'valid_until'> | null;
};

type CredentialRow = {
  id: string;
  patient_id: number;
  membership_status: AccessCredential['membership_status'];
  expires_at: string;
  membership_plan_code?: string | null;
  membership_name?: string | null;
  membership_valid_from?: string | null;
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

function credentialMembership(membership: Membership | null) {
  return membership ? {
    plan_code: membership.plan_code, plan_name: membership.plan_name, color: membership.color,
    sessions_per_week: membership.sessions_per_week, valid_from: membership.valid_from, valid_until: membership.valid_until,
  } : null;
}

export async function createCredential(patientId: number): Promise<AccessCredential> {
  const sql = database();
  const [patient] = await sql`SELECT id FROM patients WHERE id = ${patientId} AND estado = true LIMIT 1`;
  if (!patient) throw new Error('Paciente no encontrado o inactivo.');

  const credentialId = randomUUID();
  const payload = payloadFor(credentialId);
  const membership = await currentMembership(patientId);
  const status = membership?.status ?? 'INACTIVA';
  const expiresAt = membership ? membership.valid_until : new Date(Date.now() + YEAR_IN_MS).toISOString();
  await sql`UPDATE patient_access_credentials SET active = false WHERE patient_id = ${patientId} AND active = true`;
  const [credential] = await sql`INSERT INTO patient_access_credentials (id, patient_id, token_hash, expires_at, membership_status, membership_plan_code, membership_name, membership_valid_from)
    VALUES (${credentialId}, ${patientId}, ${credentialHash(payload)}, ${expiresAt}, ${status}, ${membership?.plan_code ?? null}, ${membership?.plan_name ?? null}, ${membership?.valid_from ?? null})
    RETURNING id, membership_status, expires_at`;
  return {
    id: credential.id,
    qr_payload: payload,
    expires_at: new Date(credential.expires_at).toISOString(),
    membership_status: credential.membership_status,
    membership: credentialMembership(membership),
  };
}

export async function currentOrNewCredential(patientId: number): Promise<AccessCredential> {
  const sql = database();
  const [credential] = await sql`SELECT id, membership_status, expires_at, membership_plan_code, membership_name, membership_valid_from
    FROM patient_access_credentials
    WHERE patient_id = ${patientId} AND active = true AND expires_at > NOW()
    ORDER BY issued_at DESC LIMIT 1`;
  if (!credential) return createCredential(patientId);
  const membership = await currentMembership(patientId);
  const effectiveStatus = membership?.status ?? 'INACTIVA';
  if (credential.membership_status !== effectiveStatus || (membership && new Date(credential.expires_at).getTime() !== new Date(membership.valid_until).getTime())) {
    // A pass is immutable once signed; renew it when membership changes.
    return createCredential(patientId);
  }
  return {
    id: credential.id,
    qr_payload: payloadFor(credential.id),
    expires_at: new Date(credential.expires_at).toISOString(),
    membership_status: credential.membership_status,
    membership: credentialMembership(membership),
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
  const membership = await currentMembership(Number(credential.patient_id));
  if (!membership || membership.status !== 'ACTIVA') return { valid: false, membership_status: membership?.status ?? 'INACTIVA', message: 'La membresía no está activa.' };
  if (new Date(membership.valid_from).getTime() > Date.now()) return { valid: false, membership_status: membership.status, message: 'La membresía todavía no inicia su vigencia.' };
  if (new Date(membership.valid_until).getTime() <= Date.now()) return { valid: false, membership_status: 'VENCIDA', message: 'La membresía está vencida.' };

  await sql`UPDATE patient_access_credentials SET last_used_at = NOW() WHERE id = ${credential.id}`;
  await sql`INSERT INTO patient_check_ins (credential_id, patient_id, checked_in_by) VALUES (${credential.id}, ${credential.patient_id}, ${checkedInBy})`;
  return {
    valid: true,
    membership_status: credential.membership_status,
    membership: credentialMembership(membership),
    patient: { id: Number(credential.patient_id), nombre: credential.nombre, apellido: credential.apellido, num_doc: credential.num_doc },
    check_in_at: new Date().toISOString(),
  };
}
