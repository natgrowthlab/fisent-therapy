import { NextRequest } from 'next/server';
import { requireUser } from '../../../../../server/auth';
import { database, ensureDatabaseSchema } from '../../../../../server/db';
import { response, unauthorized, unavailable } from '../../../../../server/http';

export async function DELETE(request: NextRequest, context: { params: Promise<{ patientId: string }> }) {
  try { await requireUser(request); await ensureDatabaseSchema(); const id = Number((await context.params).patientId); const sql = database(); const rows = await sql`UPDATE patients SET estado=false, updated_at=NOW() WHERE id=${id} RETURNING id`; return rows.length ? response(null, 'Paciente desactivado') : response(null, 'Paciente no encontrado.', 404); } catch (error) { return error instanceof Error && /Token/.test(error.message) ? unauthorized() : unavailable(error instanceof Error ? error.message : undefined); }
}
