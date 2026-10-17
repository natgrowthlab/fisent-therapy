// ============================================================
// FISENT - PROFESIONALES PAGE (UI Mejorada)
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { professionalService } from '../data-access/services';
import { Professional } from '../domain/models';
import { Card, Badge, TableSkeleton, EmptyState, PageHeader, SearchInput, Avatar, Button, Input, Modal, Select } from '../components/ui/Components';
import { Stethoscope, Mail, Phone, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const avatarColors = ['teal', 'blue', 'purple', 'amber', 'emerald', 'rose'] as const;

const initialForm: {
  nombre: string; apellido: string; especialidad: string; telefono: string; email: string;
  username: string; password: string; rol: 'TERAPEUTA' | 'RECEPCION';
} = {
  nombre: '', apellido: '', especialidad: 'Fisioterapia', telefono: '', email: '',
  username: '', password: '', rol: 'TERAPEUTA',
};

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const { state } = useAuth();
  const isAdmin = state.user?.rol === 'ADMIN';

  const loadProfessionals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await professionalService.getAll();
      setProfessionals(data || []);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar profesionales');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProfessionals(); }, [loadProfessionals]);

  const createProfessional = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const created = await professionalService.create(form);
      setProfessionals((current) => [...current, created]);
      setForm(initialForm);
      setModalOpen(false);
      toast.success(`Cuenta de ${created.nombre} creada correctamente`);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo crear la cuenta');
    } finally {
      setSaving(false);
    }
  };

  const filtered = professionals.filter((p) =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.apellido.toLowerCase().includes(search.toLowerCase()) ||
    p.especialidad.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Stethoscope className="w-6 h-6" />}
        title="Profesionales"
        subtitle={`${professionals.length} profesionales registrados`}
        action={isAdmin ? (
          <Button onClick={() => setModalOpen(true)}><UserPlus className="w-4 h-4 mr-2" />Crear cuenta</Button>
        ) : undefined}
      />

      <Card>
        <div className="p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o especialidad..." />
        </div>
      </Card>

      {loading ? (
        <Card className="p-6"><TableSkeleton rows={5} /></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Stethoscope className="w-12 h-12" />}
            title="No hay profesionales"
            description="No se encontraron profesionales registrados"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((pro, i) => (
            <Card key={pro.id} className="p-0 overflow-hidden" hover>
              <div className={`h-1.5 bg-gradient-to-r ${
                i % 4 === 0 ? 'from-teal-500 to-emerald-500' :
                i % 4 === 1 ? 'from-blue-500 to-sky-500' :
                i % 4 === 2 ? 'from-purple-500 to-violet-500' :
                'from-amber-500 to-orange-500'
              }`} />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar name={`${pro.nombre} ${pro.apellido}`} size="lg" color={avatarColors[i % avatarColors.length]} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{pro.nombre} {pro.apellido}</h3>
                    <Badge variant="info">{pro.especialidad}</Badge>
                  </div>
                  <Badge variant={pro.estado ? 'success' : 'danger'}>{pro.estado ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{pro.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{pro.email}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => !saving && setModalOpen(false)} title="Crear cuenta profesional" size="lg">
        <form onSubmit={createProfessional} className="space-y-5">
          <p className="text-sm text-gray-600 leading-relaxed">Crea el perfil profesional y sus credenciales de acceso. La contraseña se guarda cifrada y solo se mostrará aquí al escribirla.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombres" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required autoComplete="given-name" />
            <Input label="Apellidos" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} required autoComplete="family-name" />
            <Input label="Especialidad" value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })} required />
            <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} required inputMode="tel" autoComplete="tel" />
            <div className="sm:col-span-2"><Input label="Correo electrónico" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" /></div>
            <Input label="Usuario" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} required minLength={3} maxLength={50} autoComplete="username" hint="Usa letras, números, punto, guion o guion bajo." />
            <Input label="Contraseña inicial" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={12} autoComplete="new-password" hint="Mínimo 12 caracteres." />
            <Select label="Rol de acceso" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as 'TERAPEUTA' | 'RECEPCION' })} options={[{ value: 'TERAPEUTA', label: 'Terapeuta' }, { value: 'RECEPCION', label: 'Recepción' }]} />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" isLoading={saving}><UserPlus className="w-4 h-4 mr-2" />Crear cuenta</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
