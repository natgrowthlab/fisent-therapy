# Base de datos en Vercel: Neon Postgres

Vercel Postgres ya no acepta bases nuevas. Para este proyecto se usa **Neon Postgres** desde Vercel Marketplace. Al conectar Neon a este proyecto, Vercel inyecta `DATABASE_URL`; no se debe crear una variable pública para ella.

## Activación

1. En el proyecto de Vercel abre **Storage** y añade la integración **Neon**.
2. Crea una base en la región más próxima a las funciones de Vercel.
3. Conéctala a los entornos Production, Preview y Development.
4. Ejecuta el contenido de `migrations/001_tariffs.sql` en el editor SQL de Neon o en el panel Database de Vercel.
5. Despliega de nuevo. `GET /api/tariffs` leerá el catálogo desde Postgres; mientras tanto la interfaz muestra el catálogo de respaldo incluido en el código.

## Alcance actual

La base Neon gestiona inicialmente el catálogo de tarifas. Los pacientes, historias clínicas, pagos y usuarios continúan en la API clínica existente (`NEXT_PUBLIC_API_URL`) hasta que se diseñe y ejecute una migración de datos con copia de seguridad, validación y control de acceso.
