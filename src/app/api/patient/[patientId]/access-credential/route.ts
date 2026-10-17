import { NextRequest } from 'next/server';
import { requireUser } from '../../../../../server/auth';
import { ensureDatabaseSchema } from '../../../../../server/db';
import { response, unauthorized, unavailable } from '../../../../../server/http';
import { createCredential } from '../../../../../server/patient-access';

export async function POST(request: NextRequest, context: { params: Promise<{ patientId: string }> }) {
  try {
    await requireUser(request);
    const patientId = Number((await context.params).patientId);
    if (!Number.isInteger(patientId) || patientId < 1) return response(null, 'Paciente inválido.', 400);
    await ensureDatabaseSchema();
    return response(await createCredential(patientId), 'Credencial QR generada', 201);
  } catch (error) {
    if (error instanceof Error && /Token/.test(error.message)) return unauthorized();
    return unavailable(error instanceof Error ? error.message : undefined);
  }
}
