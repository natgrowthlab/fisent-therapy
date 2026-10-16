import { NextResponse } from 'next/server';
import { database, ensureDatabaseSchema } from '../../../server/db';

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
