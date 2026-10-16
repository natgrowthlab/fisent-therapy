import { FormEvent, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, QrCode, ShieldCheck } from 'lucide-react';
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

  useEffect(() => () => {
    const stream = videoRef.current?.srcObject;
    if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
  }, []);

  const validate = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!payload.trim()) return;
    setLoading(true);
    try {
      const validation = await patientAccessService.validateAndCheckIn(payload.trim());
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

  const startCamera = async () => {
    if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
      setCameraMessage('Este navegador no permite usar la cámara. Pegue el contenido del QR manualmente.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      const Detector = (window as typeof window & {
        BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> };
      }).BarcodeDetector;
      if (!Detector || !videoRef.current) {
        setCameraMessage('Cámara iniciada. Este navegador no expone detector QR; pegue el contenido del QR manualmente.');
        return;
      }
      const detector = new Detector({ formats: ['qr_code'] });
      const scanFrame = async () => {
        if (!videoRef.current?.srcObject) return;
        const [code] = await detector.detect(videoRef.current);
        if (code?.rawValue) {
          setPayload(code.rawValue);
          setCameraMessage('QR leído. Validando credencial…');
          return;
        }
        window.setTimeout(scanFrame, 250);
      };
      void scanFrame();
      setCameraMessage('Cámara iniciada. Enfoque el código QR para leerlo.');
    } catch {
      setCameraMessage('No fue posible abrir la cámara. Revise los permisos del navegador.');
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
          </div>
        </form>
        {cameraMessage && <Alert type="info" message={cameraMessage} onClose={() => setCameraMessage(null)} />}
        <video ref={videoRef} className={`mt-4 max-h-64 w-full rounded-xl bg-black ${cameraActive ? '' : 'hidden'}`} muted playsInline />
      </Card>
      {result && <Alert type={result.valid ? 'success' : 'error'} title={result.valid ? 'Acceso validado' : 'Acceso rechazado'} message={result.valid && result.patient ? `${result.patient.nombre} ${result.patient.apellido} · Membresía ${result.membership_status ?? 'por verificar'}` : result.message || 'La credencial no es válida, expiró o fue revocada.'} />}
    </div>
  );
}
