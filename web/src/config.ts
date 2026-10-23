/** Configuración leída de las variables de entorno de Vite (VITE_*). */
const rawMapboxToken = import.meta.env.VITE_MAPBOX_TOKEN ?? ''
const rawApiUrl = import.meta.env.VITE_API_URL?.trim() ?? ''

const DEFAULT_API_URL = 'http://localhost:8000'

export const Config = {
  mapbox: {
    token: rawMapboxToken,
    /** `false` si falta el token o sigue siendo el valor de ejemplo. */
    hasToken: rawMapboxToken.startsWith('pk.') && !rawMapboxToken.includes('REEMPLAZAR'),
  },
  api: {
    /** Dirección del backend, sin barras al final. */
    baseUrl: (rawApiUrl || DEFAULT_API_URL).replace(/\/+$/, ''),
    /** Tiempo máximo de espera de una petición. */
    timeoutMs: 30_000,
    /** Respuestas simuladas del chat, sin backend. */
    useMockChat: import.meta.env.VITE_USE_MOCK_CHAT === 'true',
  },
  dev: {
    /** Logs de red en consola: solo en desarrollo y con la variable en `true`. */
    enableLogs: import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_LOGS === 'true',
  },
} as const
