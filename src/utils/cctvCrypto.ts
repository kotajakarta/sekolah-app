const SECRET_KEY = 'esantri-cctv-secure-cipher-2026-key!';

// Generate AES-CBC key using Web Crypto API
async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyData = enc.encode(SECRET_KEY);
  const hash = await window.crypto.subtle.digest('SHA-256', keyData);
  return window.crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt']
  );
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Decrypts cctv_enc_ formatted stream URLs asynchronously in browser memory.
 */
export async function decryptStreamUrlAsync(encryptedUrl: string): Promise<string> {
  if (!encryptedUrl) return '';
  if (!encryptedUrl.startsWith('cctv_enc_')) return encryptedUrl;

  try {
    const parts = encryptedUrl.replace('cctv_enc_', '').split(':');
    if (parts.length !== 2) return encryptedUrl;

    const iv = hexToBuf(parts[0]);
    const ciphertext = hexToBuf(parts[1]);
    const key = await getCryptoKey();

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv.buffer as ArrayBuffer },
      key,
      ciphertext.buffer as ArrayBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    console.warn('Decryption error, fallbacking to url:', err);
    return encryptedUrl;
  }
}

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
