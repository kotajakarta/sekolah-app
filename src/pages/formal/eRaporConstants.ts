export function calculatePredikat(score: number | null | undefined): string {
  if (score === null || score === undefined || isNaN(score)) return '';
  if (score >= 90) return 'A';
  if (score >= 81) return 'B+';
  if (score >= 76) return 'B';
  return 'C+';
}

export const PREDIKAT_SIKAP_OPTIONS = ['A', 'B+', 'B', 'C+', 'C'];

export const SIKAP_FIELDS: { key: string; label: string }[] = [
  { key: 'ketakwaan', label: 'Ketakwaan' },
  { key: 'ketaatan', label: 'Ketaatan' },
  { key: 'kemampuanRepresentasi', label: 'Kemampuan Representasi' },
  { key: 'kerapihan', label: 'Kerapihan' },
  { key: 'kepercayaanDiri', label: 'Kepercayaan Diri' },
  { key: 'hubunganSosial', label: 'Hubungan Sosial' },
  { key: 'semangatBelajar', label: 'Semangat Belajar' },
  { key: 'disiplin', label: 'Disiplin' },
  { key: 'tanggungJawab', label: 'Tanggung Jawab' },
];

export const STATUS_HAFIDZ_LABELS: Record<string, string> = {
  BELUM_MULAI: 'Belum Mulai',
  SEDANG_BERLANGSUNG: 'Sedang Berlangsung',
  SUDAH_SETOR_30_JUZ: 'Sudah Setor 30 Juz',
  SUDAH_KHATAMAN_KUBRO: 'Sudah Khataman Kubro',
};
