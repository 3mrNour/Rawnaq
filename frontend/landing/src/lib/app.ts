const origin = import.meta.env.VITE_APP_ORIGIN ?? '';

export const APP_URLS = {
  tenantLogin: `${origin}/login`,
  adminLogin: `${origin}/admin/login`,
} as const;
