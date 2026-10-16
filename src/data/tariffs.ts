export type TariffCategory = 'Valoración' | 'Terapias' | 'Tratamientos alternativos' | 'Paquetes' | 'Entrenamiento' | 'Descarga muscular' | 'Servicios especializados';

export interface Tariff {
  id: string;
  category: TariffCategory;
  name: string;
  description?: string;
  price: number;
  featured?: boolean;
}

// Tarifas transcritas del material entregado por Fisen Therapy.
// No se utilizan como fuente de cobro: el backend debe conservar el valor final de cada pago.
export const TARIFFS: Tariff[] = [
  { id: 'initial-assessment', category: 'Valoración', name: 'Valoración inicial', description: 'Valoración + 1 terapia', price: 70000, featured: true },
  { id: 'individual-therapy', category: 'Terapias', name: 'Terapia individual', description: '1 terapia', price: 55000 },
  { id: 'cryotherapy', category: 'Tratamientos alternativos', name: 'Crioterapia', price: 90000 },
  { id: 'sauna', category: 'Tratamientos alternativos', name: 'Sauna', price: 30000 },
  { id: 'thermal-shock', category: 'Tratamientos alternativos', name: 'Choque térmico', description: 'Crioterapia + sauna', price: 100000 },
  { id: 'package-5', category: 'Paquetes', name: 'Paquete de 5 terapias', price: 250000 },
  { id: 'package-10', category: 'Paquetes', name: 'Paquete de 10 terapias', price: 470000, featured: true },
  { id: 'package-15', category: 'Paquetes', name: 'Paquete de 15 terapias', price: 700000 },
  { id: 'amateur-training', category: 'Entrenamiento', name: 'Plan deportista amateur', description: 'Presencial y virtual', price: 100000 },
  { id: 'conditioning-training', category: 'Entrenamiento', name: 'Plan en preparación', description: 'Presencial y virtual', price: 250000 },
  { id: 'professional-training', category: 'Entrenamiento', name: 'Plan deportista profesional', description: 'Presencial y virtual', price: 400000 },
  { id: 'relaxing-release', category: 'Descarga muscular', name: 'Descarga relajante', price: 120000 },
  { id: 'sports-release', category: 'Descarga muscular', name: 'Descarga deportiva', price: 200000 },
  { id: 'postural-analysis', category: 'Servicios especializados', name: 'Análisis postural', price: 100000 },
  { id: 'sports-tests', category: 'Servicios especializados', name: 'Pruebas específicas deportivas', price: 180000 },
  { id: 'functional-bandages', category: 'Servicios especializados', name: 'Vendajes funcionales', price: 50000 },
];

export const TARIFF_CATEGORIES: TariffCategory[] = [
  'Valoración',
  'Terapias',
  'Tratamientos alternativos',
  'Paquetes',
  'Entrenamiento',
  'Descarga muscular',
  'Servicios especializados',
];

export const formatCop = (amount: number) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
}).format(amount);
