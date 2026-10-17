import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Apple, QrCode } from 'lucide-react';
import { Patient, PatientAccessCredential } from '../domain/models';
import { patientAccessService } from '../data-access/services';
import { Button } from './ui/Components';

export function PatientAccessCard({ patient }: { patient: Patient }) {
  const [credential, setCredential] = useState<PatientAccessCredential | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const issueCredential = async () => {
    setLoading(true);
    try {
      setCredential(await patientAccessService.issueCredential(patient.id, Boolean(credential)));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo generar la credencial';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const downloadApplePass = async () => {
    setDownloading(true);
    try {
      const pass = await patientAccessService.downloadApplePass(patient.id);
      const url = URL.createObjectURL(pass);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `fisent-${patient.id}.pkpass`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Apple Wallet aún no está disponible';
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4" aria-labelledby="patient-access-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 id="patient-access-title" className="font-bold text-teal-950">Credencial de acceso</h4>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-teal-800">El QR contiene un token firmado, sin nombre, documento ni historia clínica. El personal lo valida al registrar el ingreso.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={issueCredential} isLoading={loading}>
            <QrCode className="mr-1.5 h-4 w-4" />{credential ? 'Renovar QR' : 'Generar QR'}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={downloadApplePass} isLoading={downloading}>
            <Apple className="mr-1.5 h-4 w-4" />Apple Wallet
          </Button>
        </div>
      </div>
      {credential && (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-white p-4 sm:flex-row">
          <QRCodeSVG value={credential.qr_payload} size={160} level="M" includeMargin title={`Credencial de ${patient.nombre} ${patient.apellido}`} />
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-gray-900">{patient.nombre} {patient.apellido}</p>
            <p className="mt-1 text-xs text-gray-500">Estado de membresía: {credential.membership_status ?? 'Por verificar'}</p>
            {credential.expires_at && <p className="mt-1 text-xs text-gray-500">Vence: {new Date(credential.expires_at).toLocaleString()}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
