import { NextRequest } from 'next/server';
import { requireUser } from '../../../../server/auth';
import { database, ensureDatabaseSchema } from '../../../../server/db';
import { response, unauthorized, unavailable } from '../../../../server/http';

const validMethods = new Set(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'OTRO']);
export async function GET(request: NextRequest) {
  try { await requireUser(request); await ensureDatabaseSchema(); const sql = database(); const payments = await sql`SELECT a.*, concat_ws(' ', p.nombre, p.apellido) AS patient_name FROM accounting_payments a LEFT JOIN patients p ON p.id=a.patient_id ORDER BY a.paid_at DESC LIMIT 100`; const [summary] = await sql`SELECT COALESCE(SUM(amount),0)::int AS total, COUNT(*)::int AS count FROM accounting_payments`; return response({ payments, summary: { total: Number(summary.total), count: Number(summary.count) } }); } catch (error) { return error instanceof Error && /Token/.test(error.message) ? unauthorized() : unavailable(error instanceof Error ? error.message : undefined); }
}
export async function POST(request: NextRequest) {
  try { const actor = await requireUser(request); await ensureDatabaseSchema(); const body = await request.json() as Record<string, unknown>; const patientId = body.patient_id ? Number(body.patient_id) : null; const membershipId = body.membership_id ? Number(body.membership_id) : null; const amount = Number(body.amount); const method = String(body.method || ''); if (!Number.isFinite(amount) || amount <= 0 || !validMethods.has(method)) return response(null, 'Monto o método de pago inválido.', 400); const sql = database(); const [payment] = await sql`INSERT INTO accounting_payments (patient_id, membership_id, amount, method, paid_at, reference, notes, created_by) VALUES (${patientId}, ${membershipId}, ${Math.round(amount)}, ${method}, ${body.paid_at ? String(body.paid_at) : new Date().toISOString()}, ${typeof body.reference === 'string' ? body.reference : null}, ${typeof body.notes === 'string' ? body.notes : null}, ${actor.id}) RETURNING *`; return response(payment, 'Pago registrado', 201); } catch (error) { return error instanceof Error && /Token/.test(error.message) ? unauthorized() : unavailable(error instanceof Error ? error.message : undefined); }
}
