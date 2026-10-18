


// ============================================================
// patients/components/PatientDeleteDialog.tsx
// ============================================================

import { ConfirmDialog } from '../../../components/ui/Components';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PatientDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
}: Props) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Eliminar Paciente"
      message="¿Está seguro de eliminar este paciente? Se ocultará del listado y se revocarán sus pases y acceso. El historial clínico y contable se conserva de forma segura."
      confirmText="Eliminar"
      confirmVariant="danger"
    />
  );
}
