import { database } from './db';

export type MembershipStatus = 'ACTIVA' | 'INACTIVA' | 'VENCIDA';

export type Membership = {
  id: number;
  patient_id: number;
  plan_code: string;
  plan_name: string;
  plan_description: string;
  price: number;
  sessions_per_week: number | null;
  color: string;
  status: MembershipStatus;
  valid_from: string;
  valid_until: string;
  notes: string | null;
};

function toMembership(row: Record<string, unknown>): Membership {
  return {
    id: Number(row.id), patient_id: Number(row.patient_id), plan_code: String(row.plan_code),
    plan_name: String(row.plan_name), plan_description: String(row.plan_description), price: Number(row.price),
    sessions_per_week: row.sessions_per_week === null ? null : Number(row.sessions_per_week), color: String(row.color),
    status: String(row.status) as MembershipStatus, valid_from: new Date(String(row.valid_from)).toISOString(),
    valid_until: new Date(String(row.valid_until)).toISOString(), notes: row.notes ? String(row.notes) : null,
  };
}

const currentMembershipQuery = async (patientId: number) => {
  const sql = database();
  return sql`SELECT m.id, m.patient_id, m.plan_code, m.status, m.valid_from, m.valid_until, m.notes,
    p.name AS plan_name, p.description AS plan_description, p.price, p.sessions_per_week, p.color
    FROM patient_memberships m INNER JOIN membership_plans p ON p.code = m.plan_code
    WHERE m.patient_id = ${patientId} AND m.removed_at IS NULL
    ORDER BY (m.status = 'ACTIVA') DESC, m.valid_until DESC LIMIT 1`;
};

export async function currentMembership(patientId: number): Promise<Membership | null> {
  const [row] = await currentMembershipQuery(patientId);
  if (!row) return null;
  const membership = toMembership(row);
  if (membership.status === 'ACTIVA' && new Date(membership.valid_until).getTime() <= Date.now()) {
    const sql = database();
    await sql`UPDATE patient_memberships SET status = 'VENCIDA', updated_at = NOW() WHERE id = ${membership.id}`;
    return { ...membership, status: 'VENCIDA' };
  }
  return membership;
}

export async function membershipsForPatients(patientIds: number[]) {
  if (!patientIds.length) return new Map<number, Membership>();
  const results = await Promise.all(patientIds.map(async (id) => [id, await currentMembership(id)] as const));
  return new Map(results.filter((entry): entry is [number, Membership] => Boolean(entry[1])));
}

export async function assignMembership(input: { patientId: number; planCode: string; validFrom: string; validUntil: string; notes?: string; actorId: number }) {
  const sql = database();
  const [patient] = await sql`SELECT id FROM patients WHERE id = ${input.patientId} AND estado = true LIMIT 1`;
  if (!patient) throw new Error('Paciente no encontrado o inactivo.');
  const [plan] = await sql`SELECT code FROM membership_plans WHERE code = ${input.planCode} AND active = true LIMIT 1`;
  if (!plan) throw new Error('El plan de membresía no existe o está inactivo.');
  // A date selected in the Colombian UI represents the complete local day.
  const validFrom = /^\d{4}-\d{2}-\d{2}$/.test(input.validFrom) ? `${input.validFrom}T00:00:00-05:00` : input.validFrom;
  const validUntil = /^\d{4}-\d{2}-\d{2}$/.test(input.validUntil) ? `${input.validUntil}T23:59:59.999-05:00` : input.validUntil;
  if (new Date(validUntil).getTime() <= new Date(validFrom).getTime()) throw new Error('La vigencia final debe ser posterior a la fecha inicial.');
  await sql`UPDATE patient_memberships SET status = 'INACTIVA', removed_at = NOW(), updated_at = NOW()
    WHERE patient_id = ${input.patientId} AND status = 'ACTIVA' AND removed_at IS NULL`;
  const [created] = await sql`INSERT INTO patient_memberships (patient_id, plan_code, valid_from, valid_until, notes, created_by)
    VALUES (${input.patientId}, ${input.planCode}, ${validFrom}, ${validUntil}, ${input.notes ?? null}, ${input.actorId}) RETURNING id`;
  return currentMembership(Number(created.patient_id ?? input.patientId));
}

export async function removeMembership(patientId: number) {
  const sql = database();
  const rows = await sql`UPDATE patient_memberships SET status = 'INACTIVA', removed_at = NOW(), updated_at = NOW()
    WHERE patient_id = ${patientId} AND status = 'ACTIVA' AND removed_at IS NULL RETURNING id`;
  return rows.length > 0;
}
