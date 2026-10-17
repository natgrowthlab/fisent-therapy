import { NextRequest } from 'next/server';
import { requireUser } from '../../../../server/auth';
import { database, ensureDatabaseSchema } from '../../../../server/db';
import { response, unauthorized, unavailable } from '../../../../server/http';

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    await ensureDatabaseSchema();
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 20));
    const search = request.nextUrl.searchParams.get('search')?.trim() ?? '';
    const offset = (page - 1) * limit;
    const sql = database();
    const rows = await sql`SELECT id, nombre, apellido, especialidad, telefono, email, estado, count(*) OVER()::int AS total
      FROM professionals
      WHERE (${search} = '' OR nombre ILIKE ${`%${search}%`} OR apellido ILIKE ${`%${search}%`} OR especialidad ILIKE ${`%${search}%`})
      ORDER BY nombre, apellido LIMIT ${limit} OFFSET ${offset}`;
    return response(rows.map((professional) => ({
      id: professional.id, nombre: professional.nombre, apellido: professional.apellido,
      especialidad: professional.especialidad, telefono: professional.telefono,
      email: professional.email, estado: professional.estado,
    })), 'Profesionales consultados', 200);
  } catch (error) {
    if (error instanceof Error && /Token/.test(error.message)) return unauthorized();
    return unavailable(error instanceof Error ? error.message : undefined);
  }
}
