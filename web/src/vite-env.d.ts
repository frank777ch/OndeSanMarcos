/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_MAPBOX_TOKEN?: string
  readonly VITE_USE_MOCK_CHAT?: string
  readonly VITE_ENABLE_DEV_LOGS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
