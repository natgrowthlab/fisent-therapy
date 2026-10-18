import { neon } from '@neondatabase/serverless';

export function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL no está configurada.');
  return neon(url);
}

// Neon integration secrets are only available inside Vercel deployments.  The
// first protected bootstrap request therefore creates the application schema;
// this removes the need to expose DATABASE_URL to a developer machine.
let schemaPromise: Promise<void> | undefined;

export function ensureDatabaseSchema() {
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    const sql = database();
    await sql`CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'ADMIN' CHECK (rol IN ('ADMIN', 'TERAPEUTA', 'RECEPCION')),
      password_hash TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS professionals (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      especialidad TEXT NOT NULL,
      telefono TEXT NOT NULL,
      email TEXT NOT NULL,
      estado BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS professionals_search_idx ON professionals (nombre, apellido, especialidad)`;
    await sql`CREATE TABLE IF NOT EXISTS patients (
      id BIGSERIAL PRIMARY KEY,
      tipo_doc TEXT NOT NULL,
      num_doc TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      fecha_nacimiento DATE NOT NULL,
      telefono TEXT NOT NULL,
      telefono_secundario TEXT,
      email TEXT,
      direccion TEXT,
      genero TEXT,
      zona TEXT,
      estado BOOLEAN NOT NULL DEFAULT TRUE,
      profile JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS patients_search_idx ON patients (nombre, apellido, num_doc)`;
    await sql`CREATE TABLE IF NOT EXISTS patient_access_credentials (
      id TEXT PRIMARY KEY,
      patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      membership_status TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (membership_status IN ('ACTIVA', 'INACTIVA', 'VENCIDA')),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      expires_at TIMESTAMPTZ NOT NULL,
      issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_used_at TIMESTAMPTZ
    )`;
    await sql`ALTER TABLE patient_access_credentials ADD COLUMN IF NOT EXISTS membership_plan_code TEXT`;
    await sql`ALTER TABLE patient_access_credentials ADD COLUMN IF NOT EXISTS membership_name TEXT`;
    await sql`ALTER TABLE patient_access_credentials ADD COLUMN IF NOT EXISTS membership_valid_from TIMESTAMPTZ`;
    await sql`CREATE INDEX IF NOT EXISTS patient_access_credentials_patient_idx ON patient_access_credentials (patient_id, active, expires_at)`;
    await sql`CREATE TABLE IF NOT EXISTS patient_check_ins (
      id BIGSERIAL PRIMARY KEY,
      credential_id TEXT NOT NULL REFERENCES patient_access_credentials(id),
      patient_id BIGINT NOT NULL REFERENCES patients(id),
      checked_in_by BIGINT REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS patient_check_ins_patient_time_idx ON patient_check_ins (patient_id, created_at DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS membership_plans (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price >= 0),
      sessions_per_week INTEGER,
      color TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`INSERT INTO membership_plans (code, name, description, price, sessions_per_week, color, position) VALUES
      ('AMATEUR', 'Amateur', 'Plan básico · 3 sesiones por semana', 150000, 3, '#0D9488', 1),
      ('PREPARACION', 'Preparación', 'Plan inicial · 4 sesiones por semana', 250000, 4, '#0891B2', 2),
      ('PROFESIONAL', 'Profesional', 'Plan premium · entrenamiento full personalizado', 500000, NULL, '#7C3AED', 3)
      ON CONFLICT (code) DO NOTHING`;
    await sql`CREATE TABLE IF NOT EXISTS patient_memberships (
      id BIGSERIAL PRIMARY KEY,
      patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      plan_code TEXT NOT NULL REFERENCES membership_plans(code),
      status TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (status IN ('ACTIVA', 'INACTIVA', 'VENCIDA')),
      valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      valid_until TIMESTAMPTZ NOT NULL,
      notes TEXT,
      removed_at TIMESTAMPTZ,
      created_by BIGINT REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS patient_memberships_one_current_idx ON patient_memberships (patient_id) WHERE status = 'ACTIVA' AND removed_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS patient_memberships_current_idx ON patient_memberships (patient_id, status, valid_until DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS accounting_payments (
      id BIGSERIAL PRIMARY KEY,
      patient_id BIGINT REFERENCES patients(id) ON DELETE SET NULL,
      membership_id BIGINT REFERENCES patient_memberships(id) ON DELETE SET NULL,
      amount INTEGER NOT NULL CHECK (amount > 0),
      method TEXT NOT NULL CHECK (method IN ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'OTRO')),
      paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reference TEXT,
      notes TEXT,
      created_by BIGINT REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS accounting_payments_paid_at_idx ON accounting_payments (paid_at DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS tariffs (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL CHECK (price >= 0),
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`INSERT INTO tariffs (id, category, name, description, price, featured, position) VALUES
      ('initial-assessment', 'Valoración', 'Valoración inicial', 'Valoración + 1 terapia', 70000, TRUE, 1),
      ('individual-therapy', 'Terapias', 'Terapia individual', '1 terapia', 55000, FALSE, 1),
      ('cryotherapy', 'Tratamientos alternativos', 'Crioterapia', NULL, 90000, FALSE, 1),
      ('sauna', 'Tratamientos alternativos', 'Sauna', NULL, 30000, FALSE, 2),
      ('thermal-shock', 'Tratamientos alternativos', 'Choque térmico', 'Crioterapia + sauna', 100000, FALSE, 3),
      ('package-5', 'Paquetes', 'Paquete de 5 terapias', NULL, 250000, FALSE, 1),
      ('package-10', 'Paquetes', 'Paquete de 10 terapias', NULL, 470000, TRUE, 2),
      ('package-15', 'Paquetes', 'Paquete de 15 terapias', NULL, 700000, FALSE, 3),
      ('amateur-training', 'Entrenamiento', 'Plan deportista amateur', 'Presencial y virtual', 100000, FALSE, 1),
      ('conditioning-training', 'Entrenamiento', 'Plan en preparación', 'Presencial y virtual', 250000, FALSE, 2),
      ('professional-training', 'Entrenamiento', 'Plan deportista profesional', 'Presencial y virtual', 400000, FALSE, 3),
      ('relaxing-release', 'Descarga muscular', 'Descarga relajante', NULL, 120000, FALSE, 1),
      ('sports-release', 'Descarga muscular', 'Descarga deportiva', NULL, 200000, FALSE, 2),
      ('postural-analysis', 'Servicios especializados', 'Análisis postural', NULL, 100000, FALSE, 1),
      ('sports-tests', 'Servicios especializados', 'Pruebas específicas deportivas', NULL, 180000, FALSE, 2),
      ('functional-bandages', 'Servicios especializados', 'Vendajes funcionales', NULL, 50000, FALSE, 3)
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category, name = EXCLUDED.name, description = EXCLUDED.description,
        price = EXCLUDED.price, featured = EXCLUDED.featured, position = EXCLUDED.position,
        updated_at = NOW()`;
  })();

  return schemaPromise;
}
