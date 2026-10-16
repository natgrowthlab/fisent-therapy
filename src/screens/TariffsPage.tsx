import { useEffect, useMemo, useState } from 'react';
import { Activity, BadgeDollarSign, ClipboardList, Dumbbell, Filter, HeartPulse, Sparkles } from 'lucide-react';
import { Card, PageHeader, SearchInput } from '../components/ui/Components';
import { formatCop, TARIFF_CATEGORIES, TARIFFS, Tariff, TariffCategory } from '../data/tariffs';

const categoryIcons: Record<TariffCategory, typeof Activity> = {
  Valoración: ClipboardList,
  Terapias: HeartPulse,
  'Tratamientos alternativos': Sparkles,
  Paquetes: BadgeDollarSign,
  Entrenamiento: Dumbbell,
  'Descarga muscular': Activity,
  'Servicios especializados': ClipboardList,
};

export default function TariffsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TariffCategory | 'Todas'>('Todas');
  const [tariffs, setTariffs] = useState<Tariff[]>(TARIFFS);

  useEffect(() => {
    fetch('/api/tariffs')
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error('Tarifas no disponibles')))
      .then((payload: { data?: Tariff[] }) => {
        if (payload.data?.length) setTariffs(payload.data);
      })
      .catch(() => {
        // The visual catalog remains usable before DATABASE_URL is provisioned.
      });
  }, []);

  const visibleTariffs = useMemo(() => tariffs.filter((tariff) => {
    const matchesCategory = category === 'Todas' || tariff.category === category;
    const text = `${tariff.name} ${tariff.description ?? ''}`.toLowerCase();
    return matchesCategory && text.includes(query.trim().toLowerCase());
  }), [category, query, tariffs]);

  const groupedTariffs = TARIFF_CATEGORIES.map((currentCategory) => ({
    category: currentCategory,
    tariffs: visibleTariffs.filter((tariff) => tariff.category === currentCategory),
  })).filter((group) => group.tariffs.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BadgeDollarSign className="h-6 w-6" />}
        title="Tarifas"
        subtitle="Catálogo comercial de Fisen Therapy · valores en pesos colombianos"
      />

      <Card className="overflow-hidden border-teal-100 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 p-5 text-white md:p-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-100">Fisen Therapy</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">Atención que transforma movimiento en bienestar.</h2>
          <p className="mt-2 text-sm leading-relaxed text-teal-50 md:text-base">Consulta servicios, paquetes y planes de entrenamiento. El valor definitivo se confirma antes de registrar un pago.</p>
        </div>
      </Card>

      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="min-w-0 flex-1"><SearchInput value={query} onChange={setQuery} placeholder="Buscar servicio o plan..." /></div>
          <div className="w-full md:w-64">
            <label htmlFor="tariff-category" className="mb-1.5 block text-sm font-semibold text-gray-700"><Filter className="mr-1 inline h-4 w-4" />Categoría</label>
            <select id="tariff-category" value={category} onChange={(event) => setCategory(event.target.value as TariffCategory | 'Todas')} className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-base text-gray-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 md:text-sm">
              <option>Todas</option>
              {TARIFF_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>
      </Card>

      <div aria-live="polite" className="sr-only">{visibleTariffs.length} tarifas encontradas</div>
      {groupedTariffs.length === 0 ? (
        <Card className="p-10 text-center text-sm text-gray-500">No encontramos tarifas para la búsqueda actual.</Card>
      ) : groupedTariffs.map((group) => {
        const Icon = categoryIcons[group.category];
        return (
          <section key={group.category} aria-labelledby={`category-${group.category}`}>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-xl bg-teal-50 p-2 text-teal-700"><Icon className="h-5 w-5" /></span>
              <h2 id={`category-${group.category}`} className="text-lg font-extrabold text-gray-900">{group.category}</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.tariffs.map((tariff) => (
                <Card key={tariff.id} className={`relative p-5 ${tariff.featured ? 'border-2 border-teal-500 shadow-lg shadow-teal-500/10' : ''}`} hover>
                  {tariff.featured && <span className="absolute right-4 top-4 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-800">Destacado</span>}
                  <h3 className="pr-20 text-base font-bold text-gray-900">{tariff.name}</h3>
                  <p className="mt-1 min-h-5 text-sm text-gray-500">{tariff.description ?? 'Servicio Fisen Therapy'}</p>
                  <p className="mt-5 text-2xl font-extrabold tracking-tight text-teal-700">{formatCop(tariff.price)}</p>
                  <p className="mt-1 text-xs text-gray-500">COP · sujeto a confirmación clínica y comercial</p>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
