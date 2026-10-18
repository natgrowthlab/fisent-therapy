type PatientInput = {
  tipo_doc: string | null; num_doc: string | null; nombre: string | null; apellido: string | null;
  fecha_nacimiento: string | null; telefono: string | null; telefono_secundario: string | null;
  email: string | null; direccion: string | null; genero: string | null; zona: string | null; profile: string;
};

export function mapPatient(row: Record<string, unknown>) {
  const rawProfile = row.profile;
  const profile = typeof rawProfile === 'string' ? JSON.parse(rawProfile) : (rawProfile && typeof rawProfile === 'object' ? rawProfile : {});
  return { ...profile, ...row, profile: undefined };
}

const textValue = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim() : null;

export function patientValues(input: Record<string, unknown>): PatientInput {
  const fields = ['tipo_doc', 'num_doc', 'nombre', 'apellido', 'fecha_nacimiento', 'telefono', 'telefono_secundario', 'email', 'direccion', 'genero', 'zona', 'membership'];
  const profile = Object.fromEntries(Object.entries(input).filter(([field]) => !fields.includes(field)));
  return {
    tipo_doc: textValue(input.tipo_doc), num_doc: textValue(input.num_doc), nombre: textValue(input.nombre), apellido: textValue(input.apellido),
    fecha_nacimiento: textValue(input.fecha_nacimiento), telefono: textValue(input.telefono), telefono_secundario: textValue(input.telefono_secundario),
    email: textValue(input.email), direccion: textValue(input.direccion), genero: textValue(input.genero), zona: textValue(input.zona), profile: JSON.stringify(profile),
  };
}
