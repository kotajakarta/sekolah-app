import apiClient from '../lib/apiClient';

/**
 * Resolves any uploaded file / document / photo URL, ensuring proper
 * API prefix and authentication token query parameter for <img>, <iframe>, and <a> tags.
 */
export function getFileUrl(filePath?: string | null): string {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:') || filePath.startsWith('blob:')) {
    return filePath;
  }
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const tokenParam = token ? `token=${encodeURIComponent(token)}` : '';

  const baseURL = apiClient.defaults.baseURL || '/api/v1';
  let fullUrl: string;

  if (cleanPath.startsWith('/api/v1/')) {
    fullUrl = cleanPath;
  } else {
    // Hindari duplikasi /api/v1 jika baseURL sudah berakhiran /api/v1
    const base = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    fullUrl = `${base}${cleanPath}`;
  }

  if (tokenParam) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    return `${fullUrl}${separator}${tokenParam}`;
  }
  return fullUrl;
}

/**
 * Resolves the student photo URL to ensure relative paths are prefixed
 * with the correct API endpoint (/api/v1) and authentication credentials.
 */
export function getStudentFotoUrl(fotoUrl?: string | null): string | null {
  if (!fotoUrl) return null;
  if (fotoUrl.startsWith('http://') || fotoUrl.startsWith('https://') || fotoUrl.startsWith('data:') || fotoUrl.startsWith('blob:')) {
    return fotoUrl;
  }
  return getFileUrl(fotoUrl);
}

export function getStudentThumbnailUrl(fotoUrl?: string | null): string | null {
  if (!fotoUrl) return null;
  if (fotoUrl.startsWith('data:') || fotoUrl.startsWith('blob:')) return fotoUrl;
  const cleanPath = fotoUrl.startsWith('/') ? fotoUrl : `/${fotoUrl}`;
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
  return `/api/v1/students/photo-thumbnail?url=${encodeURIComponent(cleanPath)}${tokenParam}`;
}
