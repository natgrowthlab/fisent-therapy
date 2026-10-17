import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PKPass } from '@jericommerce/passkit-generator';
import type { AccessCredential } from './patient-access';

function decodedSecret(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} no está configurada.`);
  return Buffer.from(value, 'base64');
}

export async function createAppleWalletPass(patient: { id: number; nombre: string; apellido: string; num_doc: string }, credential: AccessCredential) {
  const passTypeIdentifier = process.env.APPLE_PASS_TYPE_IDENTIFIER;
  const teamIdentifier = process.env.APPLE_TEAM_IDENTIFIER;
  const signerKeyPassphrase = process.env.APPLE_PASS_SIGNER_KEY_PASSPHRASE;
  if (!passTypeIdentifier || !teamIdentifier || !signerKeyPassphrase) throw new Error('La firma de Apple Wallet no está completamente configurada.');

  const pass = new PKPass({}, {
    wwdr: decodedSecret('APPLE_WWDR_CERTIFICATE_PEM_BASE64'),
    signerCert: decodedSecret('APPLE_PASS_SIGNER_CERTIFICATE_PEM_BASE64'),
    signerKey: decodedSecret('APPLE_PASS_SIGNER_KEY_PEM_BASE64'),
    signerKeyPassphrase,
  }, {
    formatVersion: 1,
    passTypeIdentifier,
    serialNumber: credential.id,
    teamIdentifier,
    organizationName: 'Fisen Therapy',
    description: 'Credencial de membresía FisenT',
    logoText: 'FisenT',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(13, 148, 136)',
    labelColor: 'rgb(236, 253, 245)',
  });

  pass.type = 'storeCard';
  pass.headerFields.push({ key: 'membership', label: 'MEMBRESÍA', value: credential.membership_status });
  pass.primaryFields.push({ key: 'patient', label: 'PACIENTE', value: `${patient.nombre} ${patient.apellido}` });
  pass.secondaryFields.push({ key: 'document', label: 'DOCUMENTO', value: `•••• ${patient.num_doc.slice(-4)}` });
  pass.auxiliaryFields.push({ key: 'expires', label: 'VÁLIDA HASTA', value: new Date(credential.expires_at).toLocaleDateString('es-CO') });
  pass.backFields.push({ key: 'privacy', label: 'Privacidad', value: 'El código QR contiene una credencial segura y no información clínica.' });
  pass.setBarcodes({ format: 'PKBarcodeFormatQR', message: credential.qr_payload, messageEncoding: 'utf-8', altText: 'Credencial FisenT' });

  const logo = await readFile(path.join(process.cwd(), 'public', 'logo.png'));
  pass.addBuffer('icon.png', logo);
  pass.addBuffer('icon@2x.png', logo);
  pass.addBuffer('icon@3x.png', logo);
  pass.addBuffer('logo.png', logo);
  pass.addBuffer('logo@2x.png', logo);
  return pass.getAsBuffer();
}
