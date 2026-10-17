import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { requireUser } from '../../../../server/auth';
import { database, ensureDatabaseSchema } from '../../../../server/db';
import { response, unauthorized, unavailable } from '../../../../server/http';

const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export async function POST(request: NextRequest) {
  try {
    const actor = await requireUser(request);
    if (actor.rol !== 'ADMIN') return response(null, 'Solo un administrador puede crear cuentas.', 403);

    const body = await request.json() as Record<string, unknown>;
    const username = clean(body.username).toLowerCase();
    const password = clean(body.password);
    const nombre = clean(body.nombre);
    const apellido = clean(body.apellido);
    const especialidad = clean(body.especialidad);
    const telefono = clean(body.telefono);
    const email = clean(body.email).toLowerCase();
    const rol = body.rol === 'RECEPCION' ? 'RECEPCION' : 'TERAPEUTA';

    if (!/^[a-z0-9._-]{3,50}$/.test(username)) return response(null, 'El usuario debe tener entre 3 y 50 caracteres: letras, números, punto, guion o guion bajo.', 400);
    if (password.length < 12) return response(null, 'La contraseña debe tener al menos 12 caracteres.', 400);
    if (!nombre || !apellido || !especialidad || !telefono || !/^\S+@\S+\.\S+$/.test(email)) return response(null, 'Complete los datos profesionales obligatorios con un correo válido.', 400);

    await ensureDatabaseSchema();
    const sql = database();
    const hash = await bcrypt.hash(password, 12);
    let userId: number | undefined;
    try {
      const [user] = await sql`INSERT INTO users (username, nombre, rol, password_hash) VALUES (${username}, ${`${nombre} ${apellido}`}, ${rol}, ${hash}) RETURNING id`;
      userId = Number(user.id);
      const [professional] = await sql`INSERT INTO professionals (user_id, nombre, apellido, especialidad, telefono, email) VALUES (${userId}, ${nombre}, ${apellido}, ${especialidad}, ${telefono}, ${email}) RETURNING id, nombre, apellido, especialidad, telefono, email, estado`;
      return response({ ...professional, username, rol }, 'Cuenta profesional creada', 201);
    } catch (error) {
      if (userId) await sql`DELETE FROM users WHERE id = ${userId}`;
      if (error instanceof Error && /unique|duplicate/i.test(error.message)) return response(null, 'El usuario o correo ya está registrado.', 409);
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && /Token/.test(error.message)) return unauthorized();
    return unavailable(error instanceof Error ? error.message : undefined);
  }
}
