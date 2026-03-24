/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FRONTEND_ONLY_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
