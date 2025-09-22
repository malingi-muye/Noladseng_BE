export function getApiBaseUrl(): string {
  // Prefer explicit VITE_API_URL, else fall back to current origin
  const envUrl = (import.meta as any).env?.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');
  // If envUrl already includes /api, keep as-is; otherwise ensure it points to /api root
  try {
    const u = new URL(envUrl);
    return u.toString().replace(/\/?$/, '');
  } catch {
    return envUrl.replace(/\/?$/, '');
  }
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  // If base already ends with /api and path starts with /api, avoid double /api/api
  if (/\/api\/?$/.test(base) && p.startsWith('/api/')) {
    return `${base}${p.replace(/^\/api/, '')}`;
  }
  return `${base}${p}`;
}

