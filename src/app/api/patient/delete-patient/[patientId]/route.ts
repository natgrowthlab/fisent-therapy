import { NextRequest } from 'next/server';
import { requireUser } from '../../../../../server/auth';
import { database, ensureDatabaseSchema } from '../../../../../server/db';
import { response, unauthorized, unavailable } from '../../../../../server/http';

export async function DELETE(request: NextRequest, context: { params: Promise<{ patientId: string }> }) {
  try {
    await requireUser(request); await ensureDatabaseSchema();
    const id = Number((await context.params).patientId);
    if (!Number.isInteger(id) || id < 1) return response(null, 'Paciente inválido.', 400);
    const sql = database();
    const rows = await sql`UPDATE patients SET estado=false, updated_at=NOW() WHERE id=${id} AND estado=true RETURNING id`;
    if (!rows.length) return response(null, 'Paciente no encontrado o ya eliminado.', 404);
    await sql`UPDATE patient_access_credentials SET active=false, membership_status='INACTIVA' WHERE patient_id=${id} AND active=true`;
    await sql`UPDATE patient_memberships SET status='INACTIVA', removed_at=NOW(), updated_at=NOW() WHERE patient_id=${id} AND status='ACTIVA' AND removed_at IS NULL`;
    return response(null, 'Paciente eliminado y credenciales revocadas');
  } catch (error) { return error instanceof Error && /Token/.test(error.message) ? unauthorized() : unavailable(error instanceof Error ? error.message : undefined); }
}
