# Credenciales de acceso de pacientes

El frontend ya incluye el registro de paciente, la visualización de un QR y el módulo de ingreso. La firma, revocación y auditoría son responsabilidad exclusiva del backend: el navegador nunca debe construir QR a partir de un ID o de información personal.

## Requisitos de seguridad

- El QR debe contener un token opaco, firmado y con expiración; no nombres, documentos, teléfonos ni IDs secuenciales.
- Los tres endpoints requieren un JWT de personal válido y autorización por rol.
- La validación debe registrar `usuario`, `fecha`, `terminal` y resultado; el backend debe rechazar tokens revocados, vencidos o con membresía inactiva.
- Los tokens se deben rotar al renovar la credencial y deben poder revocarse al desactivar al paciente.

## Contrato de endpoints

### Emitir o renovar QR

`POST /api/patient/:patientId/access-credential`

```json
{
  "status": 200,
  "response": {
    "qr_payload": "eyJhbGciOiJFZERTQSIs...",
    "expires_at": "2027-10-16T00:00:00.000Z",
    "membership_status": "ACTIVA"
  }
}
```

### Validar QR y registrar ingreso

`POST /api/patient/access-credentials/validate`

```json
{ "qr_payload": "token-opaco", "purpose": "CHECK_IN" }
```

La respuesta solo debe devolver los campos mínimos para la recepción: `valid`, nombre del paciente, estado de membresía, fecha del ingreso y mensaje.

### Descargar Apple Wallet

`POST /api/patient/:patientId/apple-pass`

La respuesta debe ser `200`, con `Content-Type: application/vnd.apple.pkpass` y un archivo firmado. Para activarlo se requiere, en el entorno seguro del backend:

- Apple Developer Program activo.
- Pass Type ID y Team ID.
- Certificado de Pass Type y su clave privada.
- Certificado WWDR de Apple.

Los certificados y claves no se deben incluir en Git, variables `VITE_*`, ni en el cliente. El pase debe mostrar el QR opaco y usar `webServiceURL`/`authenticationToken` si se quiere actualizar o revocar desde Wallet.
