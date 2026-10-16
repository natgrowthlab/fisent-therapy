CREATE TABLE IF NOT EXISTS tariffs (
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
);

INSERT INTO tariffs (id, category, name, description, price, featured, position) VALUES
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
  updated_at = NOW();
