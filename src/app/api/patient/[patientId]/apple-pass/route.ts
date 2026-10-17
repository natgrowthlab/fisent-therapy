import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../../server/auth';
import { database, ensureDatabaseSchema } from '../../../../../server/db';
import { unauthorized, unavailable } from '../../../../../server/http';
import { createAppleWalletPass } from '../../../../../server/apple-wallet';
import { currentOrNewCredential } from '../../../../../server/patient-access';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, context: { params: Promise<{ patientId: string }> }) {
  try {
    await requireUser(request);
    const patientId = Number((await context.params).patientId);
    if (!Number.isInteger(patientId) || patientId < 1) return NextResponse.json({ status: 400, message: 'Paciente inválido.' }, { status: 400 });
    await ensureDatabaseSchema();
    const sql = database();
    const [patient] = await sql`SELECT id, nombre, apellido, num_doc FROM patients WHERE id = ${patientId} AND estado = true LIMIT 1` as Array<{ id: number; nombre: string; apellido: string; num_doc: string }>;
    if (!patient) return NextResponse.json({ status: 404, message: 'Paciente no encontrado o inactivo.' }, { status: 404 });
    const credential = await currentOrNewCredential(patientId);
    const pass = await createAppleWalletPass({ ...patient, id: Number(patient.id) }, credential);
    return new NextResponse(new Uint8Array(pass), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="fisent-${patientId}.pkpass"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof Error && /Token/.test(error.message)) return unauthorized();
    return unavailable(error instanceof Error ? error.message : undefined);
  }
}
