import { NextRequest } from 'next/server';
import { requireUser } from '../../../../server/auth';
import { database } from '../../../../server/db';
import { response, unauthorized, unavailable } from '../../../../server/http';
import { mapPatient, patientValues } from '../../../../server/patients';

export async function POST(request: NextRequest) {
  try {
    await requireUser(request);
    const input = await request.json() as Record<string, unknown>;
    const patient = patientValues(input);
    if (!patient.tipo_doc || !patient.num_doc || !patient.nombre || !patient.apellido || !patient.fecha_nacimiento || !patient.telefono) {
      return response(null, 'Faltan campos obligatorios.', 400);
    }
    const sql = database();
    const [created] = await sql`INSERT INTO patients (tipo_doc, num_doc, nombre, apellido, fecha_nacimiento, telefono, telefono_secundario, email, direccion, genero, zona, profile) VALUES (${patient.tipo_doc}, ${patient.num_doc}, ${patient.nombre}, ${patient.apellido}, ${patient.fecha_nacimiento}, ${patient.telefono}, ${patient.telefono_secundario}, ${patient.email}, ${patient.direccion}, ${patient.genero}, ${patient.zona}, ${patient.profile}::jsonb) RETURNING *`;
    return response(mapPatient(created), 'Paciente creado', 201);
  } catch (error) {
    if (error instanceof Error && /Token/.test(error.message)) return unauthorized();
    return unavailable(error instanceof Error ? error.message : undefined);
  }
}
