/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_META_APP_ID: string
  readonly VITE_META_CONFIG_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
