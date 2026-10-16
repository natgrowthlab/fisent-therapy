import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'Fisen Therapy',
  description: 'Gestión clínica y terapéutica de Fisen Therapy.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
