import { jwtVerify, SignJWT } from 'jose';
import { NextRequest } from 'next/server';

type SessionUser = { id: number; username: string; nombre: string; rol: string };

function secretKey() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error('AUTH_SECRET debe tener al menos 32 caracteres.');
  return new TextEncoder().encode(value);
}

export async function signAccessToken(user: SessionUser) {
  return new SignJWT({ username: user.username, nombre: user.nombre, rol: user.rol })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secretKey());
}

export async function requireUser(request: NextRequest): Promise<SessionUser> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Token no proporcionado');
  const { payload } = await jwtVerify(token, secretKey());
  const id = Number(payload.sub);
  if (!id || typeof payload.username !== 'string' || typeof payload.nombre !== 'string' || typeof payload.rol !== 'string') {
    throw new Error('Token inválido');
  }
  return { id, username: payload.username, nombre: payload.nombre, rol: payload.rol };
}
