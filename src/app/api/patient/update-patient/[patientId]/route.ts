import { NextRequest } from 'next/server';
import { requireUser } from '../../../../../server/auth';
import { database, ensureDatabaseSchema } from '../../../../../server/db';
import { response, unauthorized, unavailable } from '../../../../../server/http';
import { mapPatient, patientValues } from '../../../../../server/patients';

export async function PUT(request: NextRequest, context: { params: Promise<{ patientId: string }> }) {
  try {
    await requireUser(request); await ensureDatabaseSchema();
    const id = Number((await context.params).patientId);
    if (!Number.isInteger(id) || id < 1) return response(null, 'Paciente inválido.', 400);
    const input = await request.json() as Record<string, unknown>;
    const patient = patientValues(input);
    if (!patient.tipo_doc || !patient.num_doc || !patient.nombre || !patient.apellido || !patient.fecha_nacimiento || !patient.telefono) return response(null, 'Faltan campos obligatorios.', 400);
    const sql = database();
    const [updated] = await sql`UPDATE patients SET tipo_doc=${patient.tipo_doc}, num_doc=${patient.num_doc}, nombre=${patient.nombre}, apellido=${patient.apellido}, fecha_nacimiento=${patient.fecha_nacimiento}, telefono=${patient.telefono}, telefono_secundario=${patient.telefono_secundario}, email=${patient.email}, direccion=${patient.direccion}, genero=${patient.genero}, zona=${patient.zona}, profile=${patient.profile}::jsonb, updated_at=NOW() WHERE id=${id} RETURNING *`;
    if (!updated) return response(null, 'Paciente no encontrado.', 404);
    return response(mapPatient(updated), 'Paciente actualizado');
  } catch (error) { return error instanceof Error && /Token/.test(error.message) ? unauthorized() : unavailable(error instanceof Error ? error.message : undefined); }
}
