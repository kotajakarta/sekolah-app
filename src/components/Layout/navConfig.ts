import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import {
  Home, School, Building2, User, Users, UserCheck, FileText,
  HeartHandshake, Activity, CheckCircle, BookOpen, Mail,
} from 'lucide-react';

export interface NavSubItem {
  to: string;
  label: string;
  badge?: number;
  disabled?: boolean;
}

export type NavEntry =
  | { type: 'link'; key: string; label: string; icon: any; to: string; highlight?: boolean }
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

  const { data: moduleSettings } = useQuery({
    queryKey: ['module-settings'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/pengaturan/modules');
        return res.data;
      } catch (e) {
        return { portalWalsanEnabled: true, raporMuadalahEnabled: true };
      }
    },
    staleTime: 60000,
  });

  return useMemo(() => {
    const showKelembagaan =
      user?.scope === 'CABANG' ||
      user?.divisi === 'FORMAL' ||
      user?.divisi === 'ALL' ||
      user?.scope === 'GLOBAL' ||
      user?.scope === 'WILAYAH';

    const showRombonganBelajar = user?.divisi === 'FORMAL' || user?.divisi === 'ALL';
    const isRaporEnabled = moduleSettings?.raporMuadalahEnabled !== false;
    const isPortalEnabled = moduleSettings?.portalWalsanEnabled !== false;

    const kelembagaanItems = [
      { to: '/dashboard/profile', label: t('sidebar.profil_saya') || 'Profil Saya', show: user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH' },
      { to: '/dashboard/profile-cabang', label: t('sidebar.profil_cabang') || 'Profil Cabang', show: user?.scope === 'CABANG' },
      { to: '/dashboard/formal/muadalah', label: t('sidebar.lembaga_muadalah') || 'Lembaga Muadalah', show: user?.divisi === 'FORMAL' || user?.divisi === 'ALL' },
      { to: '/dashboard/core/cabang', label: t('sidebar.cabang') || 'Data Cabang', show: user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH' },
      { to: '/dashboard/core/wilayah', label: t('sidebar.wilayah') || 'Data Wilayah', show: user?.scope === 'GLOBAL' },
      { to: '/dashboard/formal/mapel', label: t('sidebar.mapel') || 'Mata Pelajaran', show: user?.divisi === 'FORMAL' || user?.divisi === 'ALL' },
    ].filter(i => i.show).map(({ show, ...rest }) => rest);

    const sarprasItems = [
      { to: '/dashboard/sarpras/ruang', label: t('sidebar.ruang') || 'Ruang & Bangunan' },
      { to: '/dashboard/sarpras/fasilitas', label: t('sidebar.fasilitas') || 'Fasilitas Utama' },
    ];

    const santriItems = [
      { to: '/dashboard/core/siswa', label: t('sidebar.data_santri') || 'Data Semua Santri', show: true },
      { to: '/dashboard/core/siswa-residu', label: 'Data Residu', show: true },
      { to: '/dashboard/core/daftar-ulang', label: t('sidebar.daftar_ulang') || 'Daftar Ulang', show: user?.scope === 'GLOBAL' },
      { to: '/dashboard/formal/siswa', label: t('sidebar.santri_muadalah') || 'Santri Muadalah', show: user?.divisi === 'FORMAL' || user?.divisi === 'ALL' },
      { to: '/dashboard/core/pool', label: t('sidebar.pool_santri') || 'Pool Santri', show: user?.scope === 'GLOBAL' },
      { to: '/dashboard/absensi/siswa', label: t('sidebar.absensi_siswa') || 'Absensi Siswa', show: true },
      { to: '/dashboard/absensi/programs', label: t('sidebar.setting_absensi') || 'Setting Absensi Santri', show: user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH' },
    ].filter(i => i.show).map(({ show, ...rest }) => rest);

    const ustadzItems = [
      { to: '/dashboard/core/guru', label: t('sidebar.data_guru') || 'Data Guru', show: true },
      { to: '/dashboard/formal/penugasan-guru', label: t('sidebar.penugasan_guru') || 'Penugasan Guru', show: user?.divisi === 'FORMAL' || user?.divisi === 'ALL' },
      { to: '/dashboard/core/pool-guru', label: t('sidebar.pool_guru') || 'Pool Guru', show: user?.scope === 'GLOBAL' },
      { to: '/dashboard/absensi/guru', label: t('sidebar.absensi_guru') || 'Absensi Guru', show: true },
    ].filter(i => i.show).map(({ show, ...rest }) => rest);

    const layananItems = [
      { to: '/dashboard/umum/pengumuman', label: t('sidebar.pengumuman') || 'Pengumuman' },
      { to: '/dashboard/umum/kalender', label: t('sidebar.kalender') || 'Kalender Pendidikan' },
    ];

    const bapItems = [
      { to: '/dashboard/kegiatan/dashboard', label: 'Dashboard Infografik BAP', show: user?.scope === 'GLOBAL' },
      { to: '/dashboard/kegiatan', label: t('sidebar.bap_list') || 'Daftar BAP Laporan', show: true },
      { to: '/dashboard/kegiatan/buat', label: t('sidebar.bap_create') || 'Buat Laporan BAP', show: user?.scope === 'CABANG' },
      { to: '/dashboard/kegiatan/templates', label: t('sidebar.bap_templates') || 'Kelola Template Kegiatan', show: user?.scope === 'GLOBAL' },
      { to: '/dashboard/kegiatan/jenis', label: t('sidebar.bap_types') || 'Kelola Jenis Kegiatan', show: user?.scope === 'GLOBAL' },
    ].filter(i => i.show).map(({ show, ...rest }) => rest);

    const monitoringItems = [
      { to: '/dashboard/dashboard/ketersediaan-guru', label: t('sidebar.ketersediaan_guru') || 'Rekap Ketersediaan Guru Mapel', show: user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH' },
      { to: '/dashboard/laporan/absensi', label: t('sidebar.rekap_absensi') || 'Rekapitulasi Absensi', show: true },
      { to: '/dashboard/laporan/kelengkapan-data', label: t('sidebar.rekap_kelengkapan_santri') || 'Rekap Kelengkapan Data Santri', show: true },
      { to: '/dashboard/laporan/kelengkapan-guru', label: t('sidebar.rekap_kelengkapan_guru') || 'Rekap Kelengkapan Data Guru', show: true },
      { to: '/dashboard/core/riwayat-perubahan', label: t('sidebar.riwayat_perubahan') || 'Riwayat Perubahan Data', show: true },
    ].filter(i => i.show).map(({ show, ...rest }) => rest);

    const konfirmasiItems: NavSubItem[] = [
      { to: '/dashboard/core/permintaan-tarik', label: t('sidebar.status_mutasi') || 'Status Mutasi & Tarik Data', badge: pendingCount },
      { to: '/dashboard/core/permohonan-izin', label: t('portal.nav_konfirmasi_izin') || 'Konfirmasi Izin Santri' },
    ];

    const entries: NavEntry[] = [
      { type: 'link', key: 'dashboard', label: t('sidebar.dashboard') || 'Dashboard', icon: Home, to: '/dashboard' },
    ];

    if (showKelembagaan) {
      entries.push({ type: 'group', key: 'kelembagaan', label: t('sidebar.kelembagaan') || 'Kelembagaan', icon: School, items: kelembagaanItems });
    }

    entries.push({ type: 'group', key: 'sarpras', label: t('sidebar.sarpras') || 'Sarana Prasarana', icon: Building2, items: sarprasItems });
    entries.push({ type: 'group', key: 'santri', label: t('sidebar.santri') || 'Santri', icon: User, items: santriItems });
    entries.push({ type: 'group', key: 'ustadz', label: t('sidebar.ustadz') || 'Ustadz', icon: Users, items: ustadzItems });

    if (showRombonganBelajar) {
      entries.push({ type: 'link', key: 'rombel', label: t('sidebar.rombel') || 'Rombongan Belajar', icon: UserCheck, to: '/dashboard/formal/kelas' });
      entries.push({ type: 'link', key: 'pembelajaran', label: t('sidebar.pembelajaran') || 'Kontrol Pembelajaran', icon: BookOpen, to: '/dashboard/pembelajaran', highlight: true });
    }

    entries.push({ type: 'group', key: 'layanan', label: t('sidebar.layanan') || 'Layanan dan Bantuan', icon: HeartHandshake, items: layananItems });
    entries.push({ type: 'group', key: 'bap', label: t('sidebar.bap') || 'Berita Acara (BAP)', icon: FileText, items: bapItems });
    entries.push({ type: 'group', key: 'monitoring', label: t('sidebar.monitoring') || 'Monitoring', icon: Activity, items: monitoringItems });
    entries.push({ type: 'group', key: 'konfirmasi', label: t('sidebar.konfirmasi') || 'Konfirmasi', icon: CheckCircle, items: konfirmasiItems });

    if (showRombonganBelajar && isRaporEnabled) {
      entries.push({ type: 'link', key: 'rapor', label: t('sidebar.rapor') || 'Rapor Muadalah', icon: FileText, to: '/dashboard/formal/rapor', highlight: true });
    }
    entries.push({ type: 'link', key: 'surat', label: t('sidebar.surat') || 'Layanan Surat', icon: Mail, to: '/dashboard/surat' });

    if (isPortalEnabled) {
      entries.push({ type: 'link', key: 'portal-walsan', label: 'Portal Walsan', icon: HeartHandshake, to: '/dashboard/portal-walsan', highlight: true });
    }

    return entries;
  }, [user, t, pendingCount, moduleSettings]);
}
