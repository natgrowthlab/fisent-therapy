import { NextRequest, NextResponse } from 'next/server';
import { database, ensureDatabaseSchema } from '../../../server/db';
import { requireUser } from '../../../server/auth';
import { response, unauthorized, unavailable } from '../../../server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ message: 'DATABASE_URL no está configurada.' }, { status: 503 });
  }

  try {
    await ensureDatabaseSchema();
    const sql = database();
    const tariffs = await sql`
      SELECT id, category, name, description, price, featured
      FROM tariffs
      WHERE active = true
      ORDER BY category, position, name
    `;
    return NextResponse.json({ data: tariffs });
  } catch {
    return NextResponse.json({ message: 'No se pudieron consultar las tarifas.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireUser(request); await ensureDatabaseSchema();
    const body = await request.json() as Record<string, unknown>;
    const id = String(body.id || '').trim(); const category = String(body.category || '').trim(); const name = String(body.name || '').trim(); const price = Number(body.price);
    if (!id || !category || !name || !Number.isFinite(price) || price < 0) return response(null, 'Datos de tarifa inválidos.', 400);
    const sql = database();
    const [tariff] = await sql`INSERT INTO tariffs (id, category, name, description, price, featured, active, position) VALUES (${id}, ${category}, ${name}, ${typeof body.description === 'string' ? body.description : null}, ${Math.round(price)}, ${Boolean(body.featured)}, true, 99) RETURNING *`;
    return response(tariff, 'Servicio creado', 201);
  } catch (error) { return error instanceof Error && /Token/.test(error.message) ? unauthorized() : unavailable(error instanceof Error ? error.message : undefined); }
}
export async function PATCH(request: NextRequest) {
  try { await requireUser(request); await ensureDatabaseSchema(); const body = await request.json() as Record<string, unknown>; const id = String(body.id || ''); const price = Number(body.price); if (!id || !String(body.category || '').trim() || !String(body.name || '').trim() || !Number.isFinite(price) || price < 0) return response(null, 'Datos de tarifa inválidos.', 400); const sql = database(); const [tariff] = await sql`UPDATE tariffs SET category=${String(body.category)}, name=${String(body.name)}, description=${typeof body.description === 'string' ? body.description : null}, price=${Math.round(price)}, featured=${Boolean(body.featured)}, active=${body.active !== false}, updated_at=NOW() WHERE id=${id} RETURNING *`; return tariff ? response(tariff, 'Servicio actualizado') : response(null, 'Servicio no encontrado.', 404); } catch (error) { return error instanceof Error && /Token/.test(error.message) ? unauthorized() : unavailable(error instanceof Error ? error.message : undefined); } }
