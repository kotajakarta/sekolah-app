/**
 * Masks raw or encrypted CCTV stream URLs for display in UI cards to prevent F12 inspection.
 */
export function maskStreamUrl(url?: string): string {
  if (!url) return '🔒 Stream URL Terenkripsi';
  if (url.startsWith('cctv_enc_')) {
    return `cctv_enc_${url.substring(9, 25)}... (Protected)`;
  }
  return `cctv_enc_${btoa(url).substring(0, 16)}... (Protected)`;
}
