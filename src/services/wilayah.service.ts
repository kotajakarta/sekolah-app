/**
 * Service Wilayah Indonesia
 * Terintegrasi dengan API Wilindo (https://wil.nri.my.id)
 * Mendukung Backward Compatibility data lama (Emsifa) dan Smart Matcher
 */

export interface WilayahItem {
  kode: string;
  nama: string;
  // Aliases untuk kompatibilitas kode lama yang menggunakan id & name
  id: string;
  name: string;
}

export interface WilayahSearchResult {
  kode: string;
  nama: string;
  path: Array<{ kode: string; nama: string }>;
}

const BASE_URL = 'https://wil.nri.my.id/api/wilayah';

// In-memory cache untuk performa dropdown instan
const cache = new Map<string, WilayahItem[]>();

/**
 * Normalisasi kode wilayah dari format lama (tanpa titik) ke format bertitik resmi Kemendagri
 */
export function normalizeWilayahCode(code: string | undefined | null, level: 1 | 2 | 3 | 4): string {
  if (!code) return '';
  const clean = String(code).trim();
  if (clean.includes('.')) return clean;

  if (level === 1) {
    return clean.slice(0, 2); // 32 -> 32
  }
  if (level === 2 && clean.length >= 4) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 4)}`; // 3201 -> 32.01
  }
  if (level === 3 && clean.length >= 6) {
    const prov = clean.slice(0, 2);
    const kab = clean.slice(2, 4);
    const kec = clean.slice(4, 6);
    return `${prov}.${kab}.${kec}`; // 3201010 -> 32.01.01
  }
  if (level === 4 && clean.length >= 8) {
    const prov = clean.slice(0, 2);
    const kab = clean.slice(2, 4);
    const kec = clean.slice(4, 6);
    const kel = clean.slice(clean.length - 4);
    return `${prov}.${kab}.${kec}.${kel}`; // 3201010001 -> 32.01.01.2001
  }
  return clean;
}

function cleanNameForMatch(name: string): string {
  return String(name || '')
    .toLowerCase()
    .replace(/^(kabupaten|kab\.|kota|kecamatan|kec\.|desa|kelurahan|kel\.)\s+/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Smart Matcher: Mencari item wilayah yang cocok berdasarkan kode eksak,
 * nama eksak, nama yang dibersihkan, kode level 1/2, suffix kode level 4, atau teks jalan.
 */
export function findMatchingWilayah(
  list: WilayahItem[],
  targetCode?: string | null,
  targetName?: string | null,
  level?: 1 | 2 | 3 | 4,
  extraJalan?: string | null
): WilayahItem | undefined {
  if (!list || list.length === 0) return undefined;

  const cleanTargetName = targetName ? String(targetName).trim().toLowerCase() : '';
  const cleanTargetCode = targetCode ? String(targetCode).trim() : '';

  // 1. Jika kode target sudah bertitik (format Kemendagri), cocokkan kode persis
  if (cleanTargetCode && cleanTargetCode.includes('.')) {
    const exact = list.find(item => item.kode === cleanTargetCode || item.id === cleanTargetCode);
    if (exact) return exact;
  }

  // 2. Pencocokan NAMA (Paling akurat)
  if (cleanTargetName) {
    // 2a. Nama persis sama (misal "kabupaten tangerang" === "kabupaten tangerang" atau "tugurejo" === "tugurejo")
    const exactName = list.find(item => {
      const itemNama = (item.nama || item.name || '').trim().toLowerCase();
      return itemNama === cleanTargetName;
    });
    if (exactName) return exactName;

    // 2b. Nama tanpa prefix kabupaten/kota/kecamatan/kelurahan/desa
    const strippedTarget = cleanNameForMatch(cleanTargetName);
    if (strippedTarget) {
      const strippedMatch = list.find(item => {
        const itemStripped = cleanNameForMatch(item.nama || item.name || '');
        return itemStripped === strippedTarget;
      });
      if (strippedMatch) return strippedMatch;
    }
  }

  // 3. Fallback: Cocokkan kode yang dinormalisasi untuk Level 1 (Prov) dan Level 2 (Kab)
  if (cleanTargetCode && (level === 1 || level === 2)) {
    const normTarget = normalizeWilayahCode(cleanTargetCode, level);
    const normMatch = list.find(item => item.kode === normTarget || item.id === normTarget);
    if (normMatch) return normMatch;
  }

  // 4. Fallback: Suffix 3-digit matcher untuk Level 4 (Kelurahan/Desa dari kode Emsifa 10-digit)
  // Emsifa format: 3374160002 -> suffix "002"
  // Kemendagri:    33.74.16.1002 -> suffix "002"
  if (level === 4 && cleanTargetCode && cleanTargetCode.length >= 8) {
    const rawSuffix = cleanTargetCode.slice(cleanTargetCode.length - 3);
    if (rawSuffix && !isNaN(Number(rawSuffix))) {
      const suffixMatch = list.find(item => {
        const itemKode = item.kode || item.id || '';
        return itemKode.endsWith(rawSuffix);
      });
      if (suffixMatch) return suffixMatch;
    }
  }

  // 5. Fallback: Periksa apakah ada nama desa/kelurahan yang tertulis di teks alamat jalan
  if (level === 4 && extraJalan) {
    const cleanJalan = cleanNameForMatch(extraJalan);
    if (cleanJalan) {
      const jalanMatch = list.find(item => {
        const itemClean = cleanNameForMatch(item.nama || item.name || '');
        return itemClean.length >= 4 && cleanJalan.includes(itemClean);
      });
      if (jalanMatch) return jalanMatch;
    }
  }

  // 6. Fallback: Substring nama
  if (cleanTargetName) {
    const strippedTarget = cleanNameForMatch(cleanTargetName);
    if (strippedTarget) {
      const subMatch = list.find(item => {
        const itemStripped = cleanNameForMatch(item.nama || item.name || '');
        return itemStripped.includes(strippedTarget) || strippedTarget.includes(itemStripped);
      });
      if (subMatch) return subMatch;
    }
  }

  return undefined;
}

export interface HierarchyResult {
  provinces: WilayahItem[];
  regencies: WilayahItem[];
  districts: WilayahItem[];
  villages: WilayahItem[];
  selectedProv: WilayahItem | null;
  selectedKab: WilayahItem | null;
  selectedKec: WilayahItem | null;
  selectedKel: WilayahItem | null;
}

export const wilayahService = {
  /**
   * Mengambil semua provinsi
   */
  async getProvinces(): Promise<WilayahItem[]> {
    const cacheKey = 'provinces';
    if (cache.has(cacheKey)) return cache.get(cacheKey)!;

    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error('Gagal mengambil data provinsi');
    const data: { kode: string; nama: string }[] = await res.json();
    const mapped = data.map(d => ({ ...d, id: d.kode, name: d.nama }));
    cache.set(cacheKey, mapped);
    return mapped;
  },

  /**
   * Mengambil semua kabupaten/kota di provinsi tertentu
   */
  async getRegencies(provCode: string): Promise<WilayahItem[]> {
    if (!provCode) return [];
    const normProv = normalizeWilayahCode(provCode, 1);
    const cacheKey = `reg_${normProv}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey)!;

    const res = await fetch(`${BASE_URL}?parent=${normProv}`);
    if (!res.ok) return [];
    const data: { kode: string; nama: string }[] = await res.json();
    const mapped = data.map(d => ({ ...d, id: d.kode, name: d.nama }));
    cache.set(cacheKey, mapped);
    return mapped;
  },

  /**
   * Mengambil semua kecamatan di kabupaten/kota tertentu
   */
  async getDistricts(kabCode: string): Promise<WilayahItem[]> {
    if (!kabCode) return [];
    const normKab = normalizeWilayahCode(kabCode, 2);
    const cacheKey = `dist_${normKab}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey)!;

    const res = await fetch(`${BASE_URL}?parent=${normKab}`);
    if (!res.ok) return [];
    const data: { kode: string; nama: string }[] = await res.json();
    const mapped = data.map(d => ({ ...d, id: d.kode, name: d.nama }));
    cache.set(cacheKey, mapped);
    return mapped;
  },

  /**
   * Mengambil semua desa/kelurahan di kecamatan tertentu
   */
  async getVillages(kecCode: string): Promise<WilayahItem[]> {
    if (!kecCode) return [];
    const normKec = normalizeWilayahCode(kecCode, 3);
    const cacheKey = `vil_${normKec}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey)!;

    const res = await fetch(`${BASE_URL}?parent=${normKec}`);
    if (!res.ok) return [];
    const data: { kode: string; nama: string }[] = await res.json();
    const mapped = data.map(d => ({ ...d, id: d.kode, name: d.nama }));
    cache.set(cacheKey, mapped);
    return mapped;
  },

  /**
   * Resolves the entire 4-level address hierarchy in one call with smart matching
   */
  async resolveHierarchy(params: {
    provId?: string | null;
    provName?: string | null;
    kabId?: string | null;
    kabName?: string | null;
    kecId?: string | null;
    kecName?: string | null;
    kelId?: string | null;
    kelName?: string | null;
    jalan?: string | null;
  }): Promise<HierarchyResult> {
    const result: HierarchyResult = {
      provinces: [],
      regencies: [],
      districts: [],
      villages: [],
      selectedProv: null,
      selectedKab: null,
      selectedKec: null,
      selectedKel: null,
    };

    try {
      result.provinces = await this.getProvinces();
      result.selectedProv = findMatchingWilayah(result.provinces, params.provId, params.provName, 1) || null;

      const provCode = result.selectedProv?.kode || normalizeWilayahCode(params.provId, 1);
      if (provCode) {
        result.regencies = await this.getRegencies(provCode);
        result.selectedKab = findMatchingWilayah(result.regencies, params.kabId, params.kabName, 2) || null;

        const kabCode = result.selectedKab?.kode || normalizeWilayahCode(params.kabId, 2);
        if (kabCode) {
          result.districts = await this.getDistricts(kabCode);
          result.selectedKec = findMatchingWilayah(result.districts, params.kecId, params.kecName, 3) || null;

          const kecCode = result.selectedKec?.kode || normalizeWilayahCode(params.kecId, 3);
          if (kecCode) {
            result.villages = await this.getVillages(kecCode);
            result.selectedKel = findMatchingWilayah(result.villages, params.kelId, params.kelName, 4, params.jalan) || null;
          }
        }
      }
    } catch (e) {
      console.error('Error resolving address hierarchy:', e);
    }

    return result;
  },

  /**
   * Pencarian wilayah (Typeahead / Search global)
   */
  async search(level: 1 | 2 | 3 | 4, query: string, limit: number = 20): Promise<WilayahSearchResult[]> {
    if (!query || query.trim().length === 0) return [];
    const res = await fetch(`${BASE_URL}/search?level=${level}&q=${encodeURIComponent(query.trim())}&limit=${limit}`);
    if (!res.ok) return [];
    return res.json();
  }
};
