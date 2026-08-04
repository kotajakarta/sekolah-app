/**
 * Resolves the student photo URL to ensure relative paths are prefixed
 * with the correct API endpoint (/api/v1).
 */
export function getStudentFotoUrl(fotoUrl?: string | null): string | null {
  if (!fotoUrl) return null;
  if (fotoUrl.startsWith('http://') || fotoUrl.startsWith('https://') || fotoUrl.startsWith('data:')) {
    return fotoUrl;
  }
  const cleanPath = fotoUrl.startsWith('/') ? fotoUrl : `/${fotoUrl}`;
  return `/api/v1${cleanPath}`;
}
