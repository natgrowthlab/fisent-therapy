import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { database, ensureDatabaseSchema } from '../../../../server/db';
import { unavailable } from '../../../../server/http';

// One-time setup endpoint. It refuses to run when a user already exists.
export async function POST(request: NextRequest) {
  try {
    const bootstrapToken = request.headers.get('x-bootstrap-token');
    if (!process.env.BOOTSTRAP_TOKEN || bootstrapToken !== process.env.BOOTSTRAP_TOKEN) {
      return NextResponse.json({ message: 'Bootstrap no autorizado.' }, { status: 403 });
    }
    const { username, password, nombre = 'Administrador Fisen' } = await request.json();
    if (typeof username !== 'string' || username.length < 3 || typeof password !== 'string' || password.length < 12) {
      return NextResponse.json({ message: 'Usuario mínimo 3 caracteres y contraseña mínimo 12 caracteres.' }, { status: 400 });
    }
    await ensureDatabaseSchema();
    const sql = database();
    const [existing] = await sql`SELECT id FROM users LIMIT 1`;
    if (existing) return NextResponse.json({ message: 'La plataforma ya tiene un usuario. Use administración de usuarios.' }, { status: 409 });
    const hash = await bcrypt.hash(password, 12);
    await sql`INSERT INTO users (username, nombre, rol, password_hash) VALUES (${username.trim()}, ${nombre.trim()}, 'ADMIN', ${hash})`;
    return NextResponse.json({ message: 'Administrador creado. Elimine BOOTSTRAP_TOKEN de Vercel ahora.' }, { status: 201 });
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : undefined);
  }
}
