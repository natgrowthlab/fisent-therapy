import { FormEvent, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, QrCode, ShieldCheck } from 'lucide-react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { patientAccessService } from '../data-access/services';
import { PatientAccessValidation } from '../domain/models';
import { Alert, Button, Card, PageHeader, Textarea } from '../components/ui/Components';

export default function CheckInPage() {
  const [payload, setPayload] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [result, setResult] = useState<PatientAccessValidation | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const scanLockedRef = useRef(false);

  useEffect(() => () => {
    scannerControlsRef.current?.stop();
  }, []);

  const validatePayload = async (qrPayload: string) => {
    setLoading(true);
    try {
      const validation = await patientAccessService.validateAndCheckIn(qrPayload);
      setResult(validation);
      if (validation.valid) toast.success('Ingreso registrado');
      else toast.error(validation.message || 'Credencial no válida');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo validar el ingreso';
      toast.error(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const validate = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!payload.trim()) return;
    await validatePayload(payload.trim());
  };

  const stopCamera = () => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    scanLockedRef.current = false;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const startCamera = async () => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraMessage('La cámara requiere HTTPS y permiso del navegador. Abra la plataforma desde su dominio seguro.');
      return;
    }
    try {
      stopCamera();
      scanLockedRef.current = false;
      if (!videoRef.current) return;
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        videoRef.current,
        (scanResult) => {
          const rawValue = scanResult?.getText();
          if (!rawValue || scanLockedRef.current) return;
          scanLockedRef.current = true;
          setPayload(rawValue);
          setCameraMessage('QR leído. Validando credencial…');
          scannerControlsRef.current?.stop();
          scannerControlsRef.current = null;
          setCameraActive(false);
          void validatePayload(rawValue);
        },
      );
      scannerControlsRef.current = controls;
      setCameraActive(true);
      setCameraMessage('Cámara iniciada. Enfoque el QR de Apple Wallet o el QR genérico.');
    } catch {
      setCameraMessage('No fue posible abrir la cámara. En Safari: toque “Permitir” y use la cámara trasera.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={<QrCode className="h-6 w-6" />} title="Registro de ingreso" subtitle="Validación de membresía e identificación mediante QR firmado." />
      <Card className="p-5 md:p-6">
        <form className="space-y-4" onSubmit={validate}>
          <Textarea label="Contenido del QR" value={payload} onChange={(event) => setPayload(event.target.value)} rows={4} placeholder="Escanee o pegue el token de la credencial" hint="No escriba ni almacene datos clínicos en el QR." />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" isLoading={loading}><ShieldCheck className="mr-2 h-4 w-4" />Validar e ingresar</Button>
            <Button type="button" variant="secondary" onClick={startCamera}><Camera className="mr-2 h-4 w-4" />Abrir cámara</Button>
            {cameraActive && <Button type="button" variant="ghost" onClick={stopCamera}>Detener cámara</Button>}
          </div>
        </form>
        {cameraMessage && <Alert type="info" message={cameraMessage} onClose={() => setCameraMessage(null)} />}
        <video ref={videoRef} className={`mt-4 max-h-72 w-full rounded-xl bg-black object-cover ${cameraActive ? '' : 'hidden'}`} muted playsInline />
      </Card>
      {result && <Alert type={result.valid ? 'success' : 'error'} title={result.valid ? 'Acceso validado' : 'Acceso rechazado'} message={result.valid && result.patient ? `${result.patient.nombre} ${result.patient.apellido} · Membresía ${result.membership_status ?? 'por verificar'}` : result.message || 'La credencial no es válida, expiró o fue revocada.'} />}
    </div>
  );
}
