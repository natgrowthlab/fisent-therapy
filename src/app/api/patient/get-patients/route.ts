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
    const rows = await sql`SELECT p.*, count(*) OVER()::int AS total,
      COALESCE(checkins.ingresos_este_mes, 0)::int AS ingresos_este_mes,
      checkins.ultimo_ingreso
      FROM patients p
      LEFT JOIN LATERAL (
        SELECT COUNT(*) FILTER (WHERE (c.created_at AT TIME ZONE 'America/Bogota') >= date_trunc('month', NOW() AT TIME ZONE 'America/Bogota'))::int AS ingresos_este_mes,
          MAX(c.created_at) AS ultimo_ingreso
        FROM patient_check_ins c WHERE c.patient_id = p.id
      ) checkins ON true
      WHERE p.estado = true AND (${search} = '' OR p.nombre ILIKE ${`%${search}%`} OR p.apellido ILIKE ${`%${search}%`} OR p.num_doc ILIKE ${`%${search}%`})
      ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const total = Number(rows[0]?.total ?? 0);
    const memberships = await membershipsForPatients(rows.map((row) => Number(row.id)));
    return NextResponse.json({ status: 200, message: 'Pacientes consultados', response: rows.map((row) => ({ ...mapPatient(row), membership: memberships.get(Number(row.id)) ?? null })), pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)), hasNextPage: page * limit < total, hasPreviousPage: page > 1 } });
  } catch (error) {
    return error instanceof Error && /Token/.test(error.message) ? unauthorized() : unavailable(error instanceof Error ? error.message : undefined);
  }
}
