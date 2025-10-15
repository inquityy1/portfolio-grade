/**
 * Creates a full API URL by combining the base API URL with a path
 * @param path - The API endpoint path (e.g., '/auth/me', '/users')
 * @param baseUrl - Optional base URL, defaults to environment variables or localhost
 * @returns The complete API URL
 */
export function createApiUrl(path: string, baseUrl?: string): string {
  let apiUrl = baseUrl;

  if (!apiUrl) {
    // Try to get API URL from environment variables
    if (typeof window !== 'undefined' && (window as any).__API_URL__) {
      apiUrl = (window as any).__API_URL__;
    } else {
      // Try to access import.meta.env safely
      try {
        const metaEnv = (globalThis as any).import?.meta?.env;
        if (metaEnv) {
          apiUrl = metaEnv.VITE_API_URL || metaEnv.E2E_API_URL;
        }
      } catch {
        // Ignore errors accessing import.meta.env
      }

      // Fallback to localhost if no environment variable found
      if (!apiUrl) {
        apiUrl = 'http://localhost:3000';
      }
    }
  }

  const cleanBaseUrl = String(apiUrl).replace(/\/$/, '');
  return /\/api$/.test(cleanBaseUrl) ? `${cleanBaseUrl}${path}` : `${cleanBaseUrl}/api${path}`;
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use createApiUrl instead
 */
export function api(path: string, baseUrl?: string): string {
  return createApiUrl(path, baseUrl);
}
