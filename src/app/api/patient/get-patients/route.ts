import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../server/auth';
import { database } from '../../../../server/db';
import { unauthorized, unavailable } from '../../../../server/http';
import { mapPatient } from '../../../../server/patients';
import { membershipsForPatients } from '../../../../server/memberships';
import { ensureDatabaseSchema } from '../../../../server/db';

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    await ensureDatabaseSchema();
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 20));
    const search = request.nextUrl.searchParams.get('search')?.trim() ?? '';
    const offset = (page - 1) * limit;
    const sql = database();
    const rows = await sql`SELECT *, count(*) OVER()::int AS total FROM patients WHERE estado = true AND (${search} = '' OR nombre ILIKE ${`%${search}%`} OR apellido ILIKE ${`%${search}%`} OR num_doc ILIKE ${`%${search}%`}) ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const total = Number(rows[0]?.total ?? 0);
    const memberships = await membershipsForPatients(rows.map((row) => Number(row.id)));
    return NextResponse.json({ status: 200, message: 'Pacientes consultados', response: rows.map((row) => ({ ...mapPatient(row), membership: memberships.get(Number(row.id)) ?? null })), pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)), hasNextPage: page * limit < total, hasPreviousPage: page > 1 } });
  } catch (error) {
    return error instanceof Error && /Token/.test(error.message) ? unauthorized() : unavailable(error instanceof Error ? error.message : undefined);
  }
}
