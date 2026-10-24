/**
 * Utilidad institucional para resolver URLs de avatar de manera segura.
 * Si la imagen proviene de Google User Content (lh3.googleusercontent.com),
 * se enruta a través de /api/avatar para evitar bloqueos por 429 Too Many Requests
 * o restricciones de cookies cross-origin en el navegador del cliente.
 */
export function getSafeAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('data:') || url.startsWith('/')) return url;
  if (url.includes('googleusercontent.com')) {
    return `/api/avatar?url=${encodeURIComponent(url)}`;
  }
  return url;
}
