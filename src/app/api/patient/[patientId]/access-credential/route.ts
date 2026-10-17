import { NextRequest } from 'next/server';
import { requireUser } from '../../../../../server/auth';
import { ensureDatabaseSchema } from '../../../../../server/db';
import { response, unauthorized, unavailable } from '../../../../../server/http';
import { createCredential, currentOrNewCredential } from '../../../../../server/patient-access';

export async function POST(request: NextRequest, context: { params: Promise<{ patientId: string }> }) {
  try {
    await requireUser(request);
    const patientId = Number((await context.params).patientId);
    if (!Number.isInteger(patientId) || patientId < 1) return response(null, 'Paciente inválido.', 400);
    await ensureDatabaseSchema();
    const renew = request.nextUrl.searchParams.get('renew') === '1';
    const credential = renew ? await createCredential(patientId) : await currentOrNewCredential(patientId);
    return response(credential, renew ? 'Credencial QR renovada' : 'Credencial QR lista', renew ? 201 : 200);
  } catch (error) {
    if (error instanceof Error && /Token/.test(error.message)) return unauthorized();
    if (error instanceof Error && /Paciente no encontrado/.test(error.message)) return response(null, error.message, 404);
    return unavailable(error instanceof Error ? error.message : undefined);
  }
}
