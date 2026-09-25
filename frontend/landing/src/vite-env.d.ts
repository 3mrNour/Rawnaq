/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin the tenant and admin SPAs are served from, when they are not on
   *  the same origin as this landing page. Empty in local dev. */
  readonly VITE_APP_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
