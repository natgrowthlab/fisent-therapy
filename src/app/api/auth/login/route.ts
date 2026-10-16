import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../server/db';
import { signAccessToken } from '../../../../server/auth';
import { unavailable } from '../../../../server/http';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (typeof username !== 'string' || typeof password !== 'string') return NextResponse.json({ message: 'Usuario y contraseña son obligatorios.' }, { status: 400 });
    const sql = database();
    const [user] = await sql`SELECT id, username, nombre, rol, password_hash FROM users WHERE username = ${username.trim()} AND active = true LIMIT 1`;
    if (!user || !await bcrypt.compare(password, user.password_hash)) return NextResponse.json({ message: 'Usuario o contraseña incorrectos.' }, { status: 401 });
    const session = { id: Number(user.id), username: user.username, nombre: user.nombre, rol: user.rol };
    return NextResponse.json({ token: await signAccessToken(session), user: session });
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : undefined);
  }
}
