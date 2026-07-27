import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import {
  Home, School, Building2, User, Users, UserCheck, FileText,
  CalendarCheck, HeartHandshake, Activity, CheckCircle,
} from 'lucide-react';

export interface NavSubItem {
  to: string;
  label: string;
  badge?: number;
  disabled?: boolean;
}

export type NavEntry =
  | { type: 'link'; key: string; label: string; icon: any; to: string }
  | { type: 'group'; key: string; label: string; icon: any; items: NavSubItem[] };

// Sumber tunggal daftar menu navigasi (dipakai oleh Sidebar desktop & bottom nav mobile)
// supaya keduanya selalu sinkron tanpa perlu diubah dua tempat.
export function useNavEntries(): NavEntry[] {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['permintaan-tarik-pending-count'],
    queryFn: async () => {
      const res = await apiClient.get('/students/permintaan-tarik/pending-count');
      return res.data;
    },
    enabled: user?.scope === 'GLOBAL',
    refetchInterval: 30000,
  });

  return useMemo(() => {
    const showKelembagaan =
      user?.scope === 'CABANG' ||
      user?.divisi === 'FORMAL' ||
      user?.divisi === 'ALL' ||
      user?.scope === 'GLOBAL' ||
      user?.scope === 'WILAYAH';

    const showRombonganBelajar = user?.divisi === 'FORMAL' || user?.divisi === 'ALL';

    const kelembagaanItems = [
      { to: '/dashboard/profile-cabang', label: 'Profil Cabang', show: user?.scope === 'CABANG' },
      { to: '/dashboard/formal/muadalah', label: 'Lembaga Muadalah', show: user?.divisi === 'FORMAL' || user?.divisi === 'ALL' },
      { to: '/dashboard/core/cabang', label: t('sidebar.cabang'), show: user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH' },
      { to: '/dashboard/core/wilayah', label: t('sidebar.wilayah'), show: user?.scope === 'GLOBAL' },
      { to: '/dashboard/formal/mapel', label: 'Mata Pelajaran', show: user?.divisi === 'FORMAL' || user?.divisi === 'ALL' },
    ].filter(i => i.show).map(({ show, ...rest }) => rest);

    const sarprasItems = [
      { to: '/dashboard/sarpras/ruang', label: 'Ruang & Bangunan' },
      { to: '/dashboard/sarpras/fasilitas', label: 'Fasilitas Utama' },
    ];

    const santriItems = [
      { to: '/dashboard/core/siswa', label: 'Data Semua Santri', show: true },
      { to: '/dashboard/formal/siswa', label: 'Santri Muadalah', show: user?.divisi === 'FORMAL' || user?.divisi === 'ALL' },
      { to: '/dashboard/core/pool', label: 'Pool Santri', show: user?.scope === 'GLOBAL' },
      { to: '/dashboard/absensi/siswa', label: 'Absensi Siswa', show: true },
    ].filter(i => i.show).map(({ show, ...rest }) => rest);

    const ustadzItems = [
      { to: '/dashboard/core/guru', label: 'Data Guru', show: true },
      { to: '/dashboard/formal/penugasan-guru', label: 'Penugasan Guru', show: user?.divisi === 'FORMAL' || user?.divisi === 'ALL' },
      { to: '/dashboard/core/pool-guru', label: 'Pool Guru', show: user?.scope === 'GLOBAL' },
      { to: '/dashboard/absensi/guru', label: 'Absensi Guru', show: true },
    ].filter(i => i.show).map(({ show, ...rest }) => rest);

    const showKontrolMapel = user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH';

    const layananItems = [
      { to: '/dashboard/umum/pengumuman', label: 'Pengumuman' },
      { to: '/dashboard/umum/kalender', label: 'Kalender Pendidikan' },
    ];

    const bapItems = [
      { to: '/dashboard/kegiatan', label: 'Daftar BAP Laporan', show: true },
      { to: '/dashboard/kegiatan/buat', label: 'Buat Laporan BAP', show: user?.scope === 'CABANG' },
      { to: '/dashboard/kegiatan/templates', label: 'Kelola Template Kegiatan', show: user?.scope === 'GLOBAL' },
      { to: '/dashboard/kegiatan/jenis', label: 'Kelola Jenis Kegiatan', show: user?.scope === 'GLOBAL' },
    ].filter(i => i.show).map(({ show, ...rest }) => rest);

    const monitoringItems = [
      { to: '/dashboard/dashboard/ketersediaan-guru', label: 'Rekap Ketersediaan Guru Mapel', show: user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH' },
      { to: '/dashboard/laporan/absensi', label: 'Rekapitulasi Absensi', show: true },
      { to: '/dashboard/laporan/kelengkapan-data', label: 'Rekap Kelengkapan Data Santri', show: true },
      { to: '/dashboard/laporan/kelengkapan-guru', label: 'Rekap Kelengkapan Data Guru', show: true },
      { to: '/dashboard/core/riwayat-perubahan', label: 'Riwayat Perubahan Data', show: true },
    ].filter(i => i.show).map(({ show, ...rest }) => rest);

    const konfirmasiItems: NavSubItem[] = [
      { to: '/dashboard/core/permintaan-tarik', label: 'Status Mutasi & Tarik Data', badge: pendingCount },
    ];

    const entries: NavEntry[] = [
      { type: 'link', key: 'dashboard', label: 'Dashboard', icon: Home, to: '/dashboard' },
    ];

    if (showKelembagaan) {
      entries.push({ type: 'group', key: 'kelembagaan', label: 'Kelembagaan', icon: School, items: kelembagaanItems });
    }

    entries.push({ type: 'group', key: 'sarpras', label: 'Sarana Prasarana', icon: Building2, items: sarprasItems });
    entries.push({ type: 'group', key: 'santri', label: 'Santri', icon: User, items: santriItems });
    entries.push({ type: 'group', key: 'ustadz', label: 'Ustadz', icon: Users, items: ustadzItems });

    if (showRombonganBelajar) {
      entries.push({ type: 'link', key: 'rombel', label: 'Rombongan Belajar', icon: UserCheck, to: '/dashboard/formal/kelas' });
      entries.push({ type: 'link', key: 'rapor', label: 'Rapor Muadalah', icon: FileText, to: '/dashboard/formal/rapor' });
    }

    if (showKontrolMapel) {
      entries.push({ type: 'link', key: 'absensi', label: 'Kontrol Mapel', icon: CalendarCheck, to: '/dashboard/absensi/programs' });
    }
    entries.push({ type: 'group', key: 'layanan', label: 'Layanan dan Bantuan', icon: HeartHandshake, items: layananItems });
    entries.push({ type: 'group', key: 'bap', label: 'Berita Acara (BAP)', icon: FileText, items: bapItems });
    entries.push({ type: 'group', key: 'monitoring', label: 'Monitoring', icon: Activity, items: monitoringItems });
    entries.push({ type: 'group', key: 'konfirmasi', label: 'Konfirmasi', icon: CheckCircle, items: konfirmasiItems });

    return entries;
  }, [user, t, pendingCount]);
}
