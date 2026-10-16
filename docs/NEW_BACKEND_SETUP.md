# Backend nuevo de Fisen Therapy

La plataforma usa ahora API Routes de Next.js y Neon Postgres. No consume ni migra usuarios desde el backend previo.

## Activación inicial

1. En Vercel configura los secretos `DATABASE_URL`, `AUTH_SECRET` (32+ caracteres) y `BOOTSTRAP_TOKEN` (un secreto aleatorio de un solo uso).
2. Ejecuta, en orden, `migrations/001_tariffs.sql` y `migrations/002_core_platform.sql` en Neon.
3. Despliega el proyecto.
4. Crea el primer administrador con una petición `POST /api/auth/bootstrap`, enviando `x-bootstrap-token` y un usuario/contraseña de mínimo 12 caracteres.
5. Elimina `BOOTSTRAP_TOKEN` de Vercel después de recibir `201`.

Ejemplo de cuerpo (no incluya secretos en Git):

```json
{ "username": "admin", "nombre": "Administrador Fisen", "password": "una-contraseña-larga-y-única" }
```

## Endpoints incluidos

- `POST /api/auth/bootstrap`: crea el único administrador inicial.
- `POST /api/auth/login`: entrega un JWT de dos horas.
- `GET /api/patient/get-patients`: lista de pacientes protegida.
- `POST /api/patient/create-patient`: alta de pacientes protegida.
- `GET /api/tariffs`: catálogo de tarifas desde Neon.

Los módulos clínicos restantes se deben migrar como fases independientes para preservar reglas de agenda, pagos e historias clínicas.
