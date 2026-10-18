// ============================================================
// patients/components/PatientDetailModal.tsx
// ============================================================

import {
  Modal,
  Avatar,
  Badge,
} from '../../../components/ui/Components';

import { Patient } from '../../../domain/models';
import { PatientAccessCard } from '../../../components/PatientAccessCard';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { membershipService } from '../../../data-access/services';
import { Button, Input, Select } from '../../../components/ui/Components';
import { Membership } from '../../../domain/models';

interface Props {
  patient: Patient | null;
  onClose: () => void;
}

export function PatientDetailModal({
  patient,
  onClose,
}: Props) {
  const [membership, setMembership] = useState<Membership | null>(patient?.membership ?? null);
  const [planCode, setPlanCode] = useState('AMATEUR');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState('');
  const [savingMembership, setSavingMembership] = useState(false);
  useEffect(() => { setMembership(patient?.membership ?? null); }, [patient]);
  const saveMembership = async () => {
    if (!patient || !validUntil) return toast.error('Indique la fecha de vigencia final.');
    setSavingMembership(true);
    try { setMembership(await membershipService.assign(patient.id, { plan_code: planCode, valid_from: validFrom, valid_until: validUntil })); toast.success('Membresía asignada. Genere un nuevo pase para actualizarlo.'); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'No se pudo asignar la membresía.'); }
    finally { setSavingMembership(false); }
  };
  const removeMembership = async () => {
    if (!patient) return; setSavingMembership(true);
    try { await membershipService.remove(patient.id); setMembership(null); toast.success('Membresía eliminada y acceso inactivado.'); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la membresía.'); }
    finally { setSavingMembership(false); }
  };
  return (
    <Modal
      isOpen={!!patient}
      onClose={onClose}
      title="Detalle del Paciente"
      size="md"
    >
      {patient && (
        <div className="space-y-5">
             <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
               <Avatar name={`${patient.nombre} ${patient.apellido}`} size="lg" color="teal" />
               <div>
                 <h3 className="text-lg font-bold text-gray-900">{patient.nombre} {patient.apellido}</h3>
                 <p className="text-sm text-gray-400">{patient.tipo_doc} {patient.num_doc}</p>
               </div>
               <div className="ml-auto"><Badge variant={patient.estado ? 'success' : 'danger'}>{patient.estado ? 'Activo' : 'Inactivo'}</Badge></div>
             </div>
             <div className="grid grid-cols-2 gap-4 text-sm">
               {[
                { label: 'Telefono', value: patient.telefono },
                { label: 'Email', value: patient.email || '—' },
                { label: 'Direccion', value: patient.direccion || '—' },
                { label: 'Nacimiento', value: patient.fecha_nacimiento?.split('T')[0] },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-teal-50/30 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Antecedentes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{patient.antecedentes || 'Sin antecedentes'}</p>
            </div>
            <section className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4" aria-label="Membresía">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Membresía</p>{membership ? <><p className="mt-1 font-bold text-gray-900">{membership.plan_name}</p><p className="text-xs text-gray-600">{membership.status} · hasta {new Date(membership.valid_until).toLocaleDateString('es-CO')}</p></> : <p className="mt-1 text-sm text-gray-600">Sin membresía asignada</p>}</div>
                {membership && <Button type="button" size="sm" variant="danger" onClick={removeMembership} isLoading={savingMembership}>Eliminar</Button>}
              </div>
              {!membership && <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"><Select label="Plan" value={planCode} onChange={(e) => setPlanCode(e.target.value)} options={[{ value: 'AMATEUR', label: 'Amateur · 3/semana' }, { value: 'PREPARACION', label: 'Preparación · 4/semana' }, { value: 'PROFESIONAL', label: 'Profesional · personalizado' }]} /><Input label="Desde" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} /><Input label="Hasta" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /><div className="sm:col-span-3"><Button type="button" onClick={saveMembership} isLoading={savingMembership}>Asignar membresía</Button></div></div>}
            </section>
            <PatientAccessCard patient={patient} />
          </div>
      )}
    </Modal>
  );
}
