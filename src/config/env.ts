// ============================================================
// FISENT - CONFIGURACION DE ENTORNO CENTRALIZADA
// ============================================================
// Este archivo es la UNICA fuente de verdad para variables de entorno.
// Todas las paginas/servicios importan desde aqui, NUNCA de process.env directamente.

/**
 * Validacion estricta de variables de entorno en tiempo de ejecucion.
 * Si falta una variable requerida, la app falla al iniciar (fail-fast).
 */

const publicEnvironment: Record<string, string | undefined> = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_FEATURE_PAYMENTS: process.env.NEXT_PUBLIC_FEATURE_PAYMENTS,
  NEXT_PUBLIC_FEATURE_HISTORY: process.env.NEXT_PUBLIC_FEATURE_HISTORY,
  NEXT_PUBLIC_FEATURE_CIE10: process.env.NEXT_PUBLIC_FEATURE_CIE10,
  NEXT_PUBLIC_DEBUG: process.env.NEXT_PUBLIC_DEBUG,
  NEXT_PUBLIC_API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT,
};

function getEnvVar(key: keyof typeof publicEnvironment, defaultValue?: string): string {
  const value = publicEnvironment[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) return defaultValue;
    console.warn(`[ENV] Variable ${key} no definida, usando valor por defecto`);
    return defaultValue ?? '';
  }
  return value;
}

function getBoolEnvVar(key: keyof typeof publicEnvironment, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

// --- Configuracion exportada ---
export const env = {
  // API
  API_URL: getEnvVar('NEXT_PUBLIC_API_URL', 'https://back-fisent.onrender.com/api'),

  // App
  APP_NAME: getEnvVar('NEXT_PUBLIC_APP_NAME', 'FisenT'),
  APP_VERSION: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),

  // Feature Flags
  FEATURE_PAYMENTS: getBoolEnvVar('NEXT_PUBLIC_FEATURE_PAYMENTS', true),
  FEATURE_HISTORY: getBoolEnvVar('NEXT_PUBLIC_FEATURE_HISTORY', true),
  FEATURE_CIE10: getBoolEnvVar('NEXT_PUBLIC_FEATURE_CIE10', true),

  // Debug
  DEBUG: getBoolEnvVar('NEXT_PUBLIC_DEBUG', false),

  // API Timeouts
  API_TIMEOUT: Number(getEnvVar('NEXT_PUBLIC_API_TIMEOUT', '15000')),

  // Token
  TOKEN_STORAGE_KEY: 'fisent_token',
  USER_STORAGE_KEY: 'fisent_user',
} as const;

// --- Validacion al inicio (solo en desarrollo) ---
if (process.env.NODE_ENV === 'development') {
  console.log(`[FisenT v${env.APP_VERSION}] Entorno cargado:`, {
    API_URL: env.API_URL,
    FEATURES: {
      payments: env.FEATURE_PAYMENTS,
      history: env.FEATURE_HISTORY,
      cie10: env.FEATURE_CIE10,
    },
    DEBUG: env.DEBUG,
  });
}

// --- Helper para feature flags ---
export function isFeatureEnabled(feature: 'payments' | 'history' | 'cie10'): boolean {
  const flags: Record<string, boolean> = {
    payments: env.FEATURE_PAYMENTS,
    history: env.FEATURE_HISTORY,
    cie10: env.FEATURE_CIE10,
  };
  return flags[feature] ?? false;
}

// --- Helper para construir URLs de API ---
export function apiEndpoint(path: string): string {
  const base = env.API_URL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${base}/${cleanPath}`;
}
