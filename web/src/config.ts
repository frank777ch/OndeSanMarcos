/** Configuración leída de las variables de entorno de Vite (VITE_*). */
const rawMapboxToken = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

export const Config = {
  mapbox: {
    token: rawMapboxToken,
    /** `false` si falta el token o sigue siendo el valor de ejemplo. */
    hasToken: rawMapboxToken.startsWith('pk.') && !rawMapboxToken.includes('REEMPLAZAR'),
  },
} as const
