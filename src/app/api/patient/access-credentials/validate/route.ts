import { NextRequest } from 'next/server';
import { requireUser } from '../../../../../server/auth';
import { ensureDatabaseSchema } from '../../../../../server/db';
import { response, unauthorized, unavailable } from '../../../../../server/http';
import { validateCredential } from '../../../../../server/patient-access';

export async function POST(request: NextRequest) {
  try {
    const actor = await requireUser(request);
    const body = await request.json() as { qr_payload?: unknown };
    await ensureDatabaseSchema();
    const validation = await validateCredential(body.qr_payload, actor.id);
    return response(validation, validation.valid ? 'Ingreso registrado' : validation.message ?? 'Credencial no válida');
  } catch (error) {
    if (error instanceof Error && /Token/.test(error.message)) return unauthorized();
    return unavailable(error instanceof Error ? error.message : undefined);
  }
}
