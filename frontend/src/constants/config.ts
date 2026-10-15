export const Config = {
  api: {
    // Los builds de EAS reciben EXPO_PUBLIC_API_URL (backend del VPS) desde las
    // variables de entorno de Expo. El respaldo es el backend antiguo de Render,
    // útil mientras se migra; para desarrollo local define la variable en `.env`.
    baseUrl:
      process.env.EXPO_PUBLIC_API_URL ??
      'https://ondesanmarcos-backend.onrender.com',
    // 25s: el VPS no se duerme, así que basta con cubrir la respuesta de
    // Gemini (unos segundos). Al vencer, la UI muestra el error con "Reintentar".
    timeout: 25000,
  },
  mapbox: {
    token: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
  },
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
  chat: {
    /**
     * Usa respuestas mock del asistente en lugar del backend.
     * Por defecto consume el backend; se fuerza el mock con
     * EXPO_PUBLIC_USE_MOCK_CHAT=true.
     */
    useMock: process.env.EXPO_PUBLIC_USE_MOCK_CHAT === 'true',
  },
  dev: {
    enableLogs: process.env.EXPO_PUBLIC_ENABLE_DEV_LOGS === 'true',
  },
} as const;