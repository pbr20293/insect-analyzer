/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MINIO_ENDPOINT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global variables injected by Vite
declare const __MINIO_ENDPOINT__: string;