export const Config = {
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
    timeout: 15000,
  },
  mapbox: {
    token: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
  },
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
  dev: {
    enableLogs: process.env.EXPO_PUBLIC_ENABLE_DEV_LOGS === 'true',
  },
} as const;