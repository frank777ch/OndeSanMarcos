export const Config = {
  api: {
    // Por defecto, el backend desplegado en Render. Para desarrollo local
    // contra el backend en tu máquina, define EXPO_PUBLIC_API_URL.
    baseUrl:
      process.env.EXPO_PUBLIC_API_URL ??
      'https://ondesanmarcos-backend.onrender.com',
    timeout: 15000,
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