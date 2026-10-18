import { NextRequest } from 'next/server';
import { requireUser } from '../../../../server/auth';
import { database, ensureDatabaseSchema } from '../../../../server/db';
import { response, unauthorized, unavailable } from '../../../../server/http';
import { mapPatient, patientValues } from '../../../../server/patients';
import { assignMembership } from '../../../../server/memberships';

export async function POST(request: NextRequest) {
  try {
    const actor = await requireUser(request);
    await ensureDatabaseSchema();
    const input = await request.json() as Record<string, unknown>;
    const patient = patientValues(input);
    if (!patient.tipo_doc || !patient.num_doc || !patient.nombre || !patient.apellido || !patient.fecha_nacimiento || !patient.telefono) {
      return response(null, 'Faltan campos obligatorios.', 400);
    }
    const sql = database();
    const [created] = await sql`INSERT INTO patients (tipo_doc, num_doc, nombre, apellido, fecha_nacimiento, telefono, telefono_secundario, email, direccion, genero, zona, profile) VALUES (${patient.tipo_doc}, ${patient.num_doc}, ${patient.nombre}, ${patient.apellido}, ${patient.fecha_nacimiento}, ${patient.telefono}, ${patient.telefono_secundario}, ${patient.email}, ${patient.direccion}, ${patient.genero}, ${patient.zona}, ${patient.profile}::jsonb) RETURNING *`;
    const membership = input.membership as Record<string, unknown> | undefined;
    if (membership?.plan_code && membership?.valid_from && membership?.valid_until) {
      await assignMembership({ patientId: Number(created.id), planCode: String(membership.plan_code), validFrom: String(membership.valid_from), validUntil: String(membership.valid_until), notes: typeof membership.notes === 'string' ? membership.notes : undefined, actorId: actor.id });
    }
    return response(mapPatient(created), 'Paciente creado', 201);
  } catch (error) {
    if (error instanceof Error && /Token/.test(error.message)) return unauthorized();
    return unavailable(error instanceof Error ? error.message : undefined);
  }
}
