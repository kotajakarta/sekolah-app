import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Plus, UserMinus, UserPlus, Edit2, Trash2, Search, User, AlertCircle, FileSpreadsheet, LayoutDashboard, BarChart3, Lock, Building, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useGetStudents, Student } from '../../features/core_data/hooks/useGetStudents';
import LepasSiswaModal from '../../features/core_data/components/LepasSiswaModal';
import LepasSiswaMassalModal from '../../features/core_data/components/LepasSiswaMassalModal';
import TarikSiswaMassalModal from '../../features/core_data/components/TarikSiswaMassalModal';
import StudentModal from '../../features/core_data/components/StudentModal';
import StudentProfileModal from '../../features/core_data/components/StudentProfileModal';
import KelengkapanSiswaModal from '../../features/core_data/components/KelengkapanSiswaModal';
import CustomFilterExportModal from '../../features/core_data/components/CustomFilterExportModal';
import SiswaDashboardTab from '../../features/core_data/components/SiswaDashboardTab';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import NotificationModal from '../../components/NotificationModal';
import AdvancedFilterBar, { FilterState } from '../../components/AdvancedFilterBar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { getStudentThumbnailUrl } from '../../utils/photo';
import { normalizeTurkish } from '../../utils/text';

const calculateProgress = (student: any) => {
  if (!student || !student.biodata) return 0;
  const biodata = student.biodata;
  const fields = [
    biodata.fullName,
    biodata.nik,
    biodata.nisn,
    biodata.tempatLahir,
    biodata.tanggalLahir,
    biodata.jenisKelamin,
    biodata.namaIbu,
    biodata.namaAyah,
    biodata.phone,
    biodata.address || biodata.alamatJalan,
    biodata.fotoUrl,
    biodata.ijazahUrl,
    biodata.kkUrl
  ];
  const filled = fields.filter(val => val !== null && val !== undefined && val !== '').length;
  return Math.round((filled / fields.length) * 100);
};

export default function DataSiswa() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'data'>('dashboard');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const { user } = useAuth();

  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    wilayahId: user?.scope === 'WILAYAH' || user?.scope === 'CABANG' ? user?.wilayahId || '' : '',
    cabangId: user?.scope === 'CABANG' ? user?.cabangId || '' : '',
    kelasId: '',
    lembagaMuadalahId: '',
    jenisDaimi: '',
    tingkat: ''
  });

  const isAdmin = user?.scope === 'GLOBAL';
  const queryClient = useQueryClient();

  const targetCabangId = user?.scope === 'CABANG' ? user?.cabangId : (advancedFilters.cabangId || null);

  const { data: currentCabangProfile, isLoading: isCabangProfileLoading } = useQuery({
    queryKey: ['cabang-profile-check', targetCabangId],
    queryFn: async () => {
      if (!targetCabangId) return null;
      const res = await apiClient.get(`/master-data/cabang/${targetCabangId}/profile`);
      return res.data;
    },
    enabled: !!targetCabangId
  });

  const isProfileComplete = useMemo(() => {
    if (!targetCabangId) return true;
    if (!currentCabangProfile) return false;
    return Boolean(
      currentCabangProfile.nameResmi &&
      (currentCabangProfile.kapasitasSantri ?? 0) > 0 &&
      currentCabangProfile.alamatProvId &&
      currentCabangProfile.alamatKabId &&
      currentCabangProfile.alamatKecId &&
      currentCabangProfile.alamatKelId &&
      currentCabangProfile.alamatJalan &&
      currentCabangProfile.urlGoogleMaps
    );
  }, [targetCabangId, currentCabangProfile]);

  // Lock hanya berlaku untuk user dengan scope CABANG.
  // Role Admin (GLOBAL) dan Koordinator (WILAYAH) dapat melihat seluruh santri di cabang manapun meski profil belum lengkap.
  const isBranchLocked = user?.scope === 'CABANG' && !isProfileComplete;

  const { data: students, isLoading, isError } = useGetStudents();

  const availableTingkats = useMemo(() => {
    const set = new Set<string>();
    (students || []).forEach((s: any) => {
      const tingkat = s.siswaFormal?.kelas?.tingkat || s.siswaFormal?.tingkat;
      if (tingkat) set.add(String(tingkat));
    });
    const order = ['Non Muadalah', '7', '8', '9', '10', '11', '12'];
    return order.filter(t => set.has(t));
  }, [students]);
  const [studentToLepas, setStudentToLepas] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToView, setStudentToView] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [selectedStudentForKelengkapan, setSelectedStudentForKelengkapan] = useState<Student | null>(null);
  const [isTarikModalOpen, setIsTarikModalOpen] = useState(false);
  const [isLepasMassalOpen, setIsLepasMassalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
  const [isCustomExportOpen, setIsCustomExportOpen] = useState(false);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (students && students.length > 0) {
      const searchParams = new URLSearchParams(location.search);
      const viewId = searchParams.get('viewId');
      if (viewId) {
        const student = students.find((s: Student) => s.id === viewId);
        if (student) {
          setActiveTab('data');
          setStudentToView(student);
          // Remove viewId from URL without reloading
          searchParams.delete('viewId');
          navigate({ search: searchParams.toString() }, { replace: true });
        }
      }
    }
  }, [students, location.search, navigate]);

  const filteredStudents = (Array.isArray(students) ? students : []).filter((s: Student) => {
    // RBAC Divisi scoping
    if (user?.divisi === 'FORMAL' && !s.siswaFormal) return false;
    if (user?.divisi === 'PESANTREN' && !s.dataDaimi && !s.grupDaimi) return false;

    // Advanced filters
    if (advancedFilters.wilayahId && s.wilayahId !== advancedFilters.wilayahId) return false;
    if (advancedFilters.cabangId && s.cabangId !== advancedFilters.cabangId) return false;
    if (advancedFilters.kelasId && s.siswaFormal?.kelasId !== advancedFilters.kelasId) return false;
    if (advancedFilters.lembagaMuadalahId && s.siswaFormal?.kelas?.lembagaMuadalah?.id !== advancedFilters.lembagaMuadalahId) return false;
    if (advancedFilters.jenisDaimi) {
      const d = s.dataDaimi?.grup?.jenis || s.grupDaimi;
      if (!d || d.trim().toLowerCase() !== advancedFilters.jenisDaimi.trim().toLowerCase()) return false;
    }
    if (advancedFilters.tingkat) {
      const studentTingkat = s.siswaFormal?.kelas?.tingkat || s.siswaFormal?.tingkat;
      if (studentTingkat !== advancedFilters.tingkat) return false;
    }

    // Search query
    const q = normalizeTurkish(searchQuery).toLowerCase();
    if (q) {
      return normalizeTurkish(s.biodata?.fullName || '').toLowerCase().includes(q) ||
        (s.biodata?.nik || '').toLowerCase().includes(q) ||
        (s.biodata?.nisn || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleExportXLSX = () => {
    if (!filteredStudents || filteredStudents.length === 0) return;

    const exportData = filteredStudents.map((student: Student, index: number) => {
      const progress = calculateProgress(student);
      const kelasInfo = student.siswaFormal?.kelas?.name || '-';
      const tingkatInfo = student.siswaFormal?.kelas?.tingkat || student.siswaFormal?.tingkat || '-';
      const daimiInfo = student.dataDaimi?.grup?.jenis || student.grupDaimi || '-';

      return {
        'No': index + 1,
        'Nama Lengkap': student.biodata?.fullName || '-',
        'NIK': student.biodata?.nik || '-',
        'NISN': student.biodata?.nisn || student.siswaFormal?.nisn || '-',
        'NIS Lokal': student.biodata?.nisLokal || student.siswaFormal?.nis || '-',
        'No Glodemy': student.biodata?.noGlodemy || '-',
        'Jenis Kelamin': student.biodata?.jenisKelamin || '-',
        'Tempat Lahir': student.biodata?.tempatLahir || '-',
        'Tanggal Lahir': student.biodata?.tanggalLahir ? new Date(student.biodata.tanggalLahir).toLocaleDateString('id-ID') : '-',
        'Wilayah': student.wilayah?.name || '-',
        'Cabang': student.cabang?.name || '-',
        'Tingkat': tingkatInfo,
        'Kelas Formal': kelasInfo,
        'Grup Daimi': daimiInfo,
        'Status Pool': student.statusPool ? student.statusPool.replace('_', ' ') : '-',
        'Status Aktif': student.isActive ? 'Aktif' : 'Tidak Aktif',
        'Kelengkapan Data (%)': `${progress}%`,
        'Nama Ayah': student.biodata?.namaAyah || '-',
        'NIK Ayah': student.biodata?.nikAyah || '-',
        'Pekerjaan Ayah': student.biodata?.pekerjaanAyah || '-',
        'Nama Ibu': student.biodata?.namaIbu || '-',
        'NIK Ibu': student.biodata?.nikIbu || '-',
        'Pekerjaan Ibu': student.biodata?.pekerjaanIbu || '-',
        'No Telepon': student.biodata?.phone || '-',
        'Alamat': student.biodata?.alamatJalan || student.biodata?.address || '-',
        'Kel': student.biodata?.alamatKelName || '-',
        'Kec': student.biodata?.alamatKecName || '-',
        'Kab/Kota': student.biodata?.alamatKabName || '-',
        'Provinsi': student.biodata?.alamatProvName || '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Format identity and phone columns as text so Excel doesn't turn numbers into scientific notation
    Object.keys(worksheet).forEach((cellRef) => {
      if (cellRef.startsWith('!')) return;
      const cell = worksheet[cellRef];
      if (cell && cell.v !== undefined && cell.v !== null) {
        if (!cellRef.startsWith('A')) {
          cell.t = 's';
          cell.v = String(cell.v);
          cell.z = '@';
        }
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Santri');

    const colWidths = [
      { wch: 6 },  // No
      { wch: 25 }, // Nama
      { wch: 20 }, // NIK
      { wch: 16 }, // NISN
      { wch: 16 }, // NIS Lokal
      { wch: 16 }, // No Glodemy
      { wch: 14 }, // JK
      { wch: 16 }, // Tempat Lahir
      { wch: 14 }, // Tanggal Lahir
      { wch: 20 }, // Wilayah
      { wch: 20 }, // Cabang
      { wch: 12 }, // Tingkat
      { wch: 16 }, // Kelas
      { wch: 16 }, // Daimi
      { wch: 15 }, // Status Pool
      { wch: 12 }, // Status Aktif
      { wch: 16 }, // Progress
      { wch: 22 }, // Nama Ayah
      { wch: 20 }, // NIK Ayah
      { wch: 18 }, // Pekerjaan Ayah
      { wch: 22 }, // Nama Ibu
      { wch: 20 }, // NIK Ibu
      { wch: 18 }, // Pekerjaan Ibu
      { wch: 18 }, // Phone
      { wch: 30 }, // Alamat
      { wch: 20 }, // Kel
      { wch: 20 }, // Kec
      { wch: 20 }, // Kab/Kota
      { wch: 20 }, // Provinsi
    ];
    worksheet['!cols'] = colWidths;

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Data_Siswa_${dateStr}.xlsx`);
  };

  const handleExportEmis = () => {
    if (!filteredStudents || filteredStudents.length === 0) return;

    const formatDate = (dateStr?: string | Date | null): string => {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      } catch {
        return '';
      }
    };

    const formatPhone = (phone?: string | null): string => {
      if (!phone) return '';
      let cleaned = phone.replace(/\D/g, '');
      if (!cleaned) return '';
      if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
      if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
      return cleaned;
    };

    const emisData = filteredStudents.map((student: Student) => {
      // 1. Tanggal Masuk: Earliest valid riwayatPendidikan, fallback to daftarUlangAt
      const validRiwayat = (student.riwayatPendidikan || [])
        .filter(r => r && r.tanggalMasuk && !isNaN(new Date(r.tanggalMasuk).getTime()))
        .sort((a, b) => new Date(a.tanggalMasuk).getTime() - new Date(b.tanggalMasuk).getTime());
      
      const tanggalMasuk = validRiwayat.length > 0 
        ? formatDate(validRiwayat[0].tanggalMasuk) 
        : (student.daftarUlangAt ? formatDate(student.daftarUlangAt) : '');

      // 2. Jenis Kelamin: Normalisasi format standar EMIS
      const jkRaw = (student.biodata?.jenisKelamin || '').trim().toUpperCase();
      let jkFormatted = '';
      if (jkRaw === 'L' || jkRaw === 'LAKI-LAKI' || jkRaw === 'LAKI_LAKI' || jkRaw === 'LAKI - LAKI' || jkRaw === 'LAKI') {
        jkFormatted = 'Laki-laki';
      } else if (jkRaw === 'P' || jkRaw === 'PEREMPUAN' || jkRaw === 'PR') {
        jkFormatted = 'Perempuan';
      } else {
        jkFormatted = student.biodata?.jenisKelamin || '';
      }

      // 3. NISN & NIK: Pastikan sinkron dan tidak kosong jika ada di siswaFormal
      const nisnVal = student.biodata?.nisn || student.siswaFormal?.nisn || '';
      const nikVal = student.biodata?.nik || '';

      // 4. Kewarganegaraan & Asal Negara
      const kwRaw = (student.biodata?.kewarganegaraan || '').trim();
      let kewarganegaraan = 'WNI';
      let asalNegara = '';
      if (kwRaw && kwRaw !== 'WNI' && kwRaw !== 'Indonesia') {
        kewarganegaraan = 'WNA';
        asalNegara = kwRaw === 'WNA' ? '' : kwRaw;
      } else {
        kewarganegaraan = 'WNI';
        asalNegara = 'Indonesia';
      }

      // 5. Tingkat & Jenjang
      const tingkatRaw = student.siswaFormal?.kelas?.tingkat || student.siswaFormal?.tingkat || '';
      let jenjang = '';
      let tingkatLabel = '';
      if (tingkatRaw) {
        const match = String(tingkatRaw).match(/\d+/);
        const t = match ? parseInt(match[0], 10) : null;
        if (t) {
          tingkatLabel = `Kelas ${t}`;
          if (t >= 1 && t <= 6) jenjang = 'Ula';
          else if (t >= 7 && t <= 9) jenjang = 'Wustha';
          else if (t >= 10 && t <= 12) jenjang = 'Ulya';
        } else if (String(tingkatRaw).toLowerCase().includes('wustha')) {
          jenjang = 'Wustha';
          tingkatLabel = String(tingkatRaw);
        } else if (String(tingkatRaw).toLowerCase().includes('ulya')) {
          jenjang = 'Ulya';
          tingkatLabel = String(tingkatRaw);
        } else if (String(tingkatRaw).toLowerCase().includes('ula')) {
          jenjang = 'Ula';
          tingkatLabel = String(tingkatRaw);
        } else if (tingkatRaw === 'Non Muadalah') {
          jenjang = 'Non Muadalah';
          tingkatLabel = 'Non Muadalah';
        } else {
          tingkatLabel = String(tingkatRaw);
        }
      }

      // 6. Data Orang Tua & Status Hidup
      const formatStatusHidup = (status?: string | null, nama?: string | null) => {
        const s = (status || '').trim();
        if (!s) return nama ? 'Masih Hidup' : '';
        const lower = s.toLowerCase();
        if (lower === 'wafat' || lower === 'sudah meninggal' || lower === 'deceased' || lower === 'meninggal') {
          return 'Sudah Meninggal';
        }
        if (lower === 'masih hidup' || lower === 'hidup') {
          return 'Masih Hidup';
        }
        if (lower === 'tidak diketahui' || lower === 'unknown') {
          return 'Tidak Diketahui';
        }
        return s;
      };

      const namaAyah = student.biodata?.namaAyah || '';
      const statusAyah = formatStatusHidup(student.biodata?.statusHidupAyah, namaAyah);
      const nikAyah = student.biodata?.nikAyah || '';

      const namaIbu = student.biodata?.namaIbu || '';
      const statusIbu = formatStatusHidup(student.biodata?.statusHidupIbu, namaIbu);
      const nikIbu = student.biodata?.nikIbu || '';

      // 7. Status Wali & Nama Wali
      const kontakDaruratNama = student.biodata?.kontakDaruratNama || '';
      const kontakDaruratHubungan = student.biodata?.kontakDaruratHubungan || '';
      const hasSeparateWali = !!kontakDaruratNama && kontakDaruratNama !== namaAyah;

      let statusWali = '';
      let namaWali = '';
      if (hasSeparateWali) {
        statusWali = kontakDaruratHubungan || 'Wali';
        namaWali = kontakDaruratNama;
      } else if (namaAyah) {
        statusWali = 'Sama Dengan Ayah Kandung';
        namaWali = namaAyah;
      } else if (namaIbu) {
        statusWali = 'Sama Dengan Ibu Kandung';
        namaWali = namaIbu;
      }

      return {
        'Tanggal Masuk': tanggalMasuk,
        'Nama Lengkap': student.biodata?.fullName || '',
        'Kewarganegaraan': kewarganegaraan,
        'NIK': nikVal,
        'NISN': nisnVal,
        'Jenis Kelamin': jkFormatted,
        'Tempat Lahir': student.biodata?.tempatLahir || '',
        'Tanggal Lahir': formatDate(student.biodata?.tanggalLahir),
        'Agama': 'Islam',
        'No Handphone': formatPhone(student.biodata?.phone),
        'Nama Ayah Kandung': namaAyah,
        'Status Ayah Kandung': statusAyah,
        'NIK Ayah': nikAyah,
        'Nama Ibu Kandung': namaIbu,
        'Status Ibu Kandung': statusIbu,
        'NIK Ibu': nikIbu,
        'Status Wali': statusWali,
        'Nama Wali': namaWali,
        'Jenjang': jenjang,
        'Tingkat Kelas': tingkatLabel,
        'KITAS': '',
        'Asal Negara': asalNegara,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(emisData);

    // Kunci seluruh sel teks agar Excel tidak mengubah NIK/NISN menjadi notasi ilmiah atau memotong leading 0
    Object.keys(worksheet).forEach((cellRef) => {
      if (cellRef.startsWith('!')) return;
      const cell = worksheet[cellRef];
      if (cell && cell.v !== undefined && cell.v !== null) {
        cell.t = 's';
        cell.v = String(cell.v);
        cell.z = '@';
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data EMIS');

    const colWidths = [
      { wch: 14 }, // Tanggal Masuk
      { wch: 28 }, // Nama Lengkap
      { wch: 16 }, // Kewarganegaraan
      { wch: 20 }, // NIK
      { wch: 16 }, // NISN
      { wch: 14 }, // JK
      { wch: 18 }, // Tempat Lahir
      { wch: 14 }, // Tanggal Lahir
      { wch: 10 }, // Agama
      { wch: 18 }, // No HP
      { wch: 28 }, // Nama Ayah
      { wch: 18 }, // Status Ayah
      { wch: 20 }, // NIK Ayah
      { wch: 28 }, // Nama Ibu
      { wch: 18 }, // Status Ibu
      { wch: 20 }, // NIK Ibu
      { wch: 24 }, // Status Wali
      { wch: 24 }, // Nama Wali
      { wch: 14 }, // Jenjang
      { wch: 16 }, // Tingkat Kelas
      { wch: 12 }, // KITAS
      { wch: 16 }, // Asal Negara
    ];
    worksheet['!cols'] = colWidths;

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Data_EMIS_${dateStr}.xlsx`);
  };

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete('/students/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Berhasil menghapus semua data siswa',
      });
      setIsConfirmDeleteAllOpen(false);
    },
    onError: (error: any) => {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menghapus semua data siswa',
      });
      setIsConfirmDeleteAllOpen(false);
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Berhasil menghapus data siswa',
      });
      setStudentToDelete(null);
    },
    onError: (error: any) => {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menghapus data siswa',
      });
      setStudentToDelete(null);
    }
  });

  const handleAdd = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 tracking-tight">{t('siswa.title')}</h1>
          <p className="text-sm text-slate-500 mt-1.5">{t('siswa.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportXLSX}
            disabled={!filteredStudents || filteredStudents.length === 0}
            className="inline-flex items-center justify-center px-4 py-2 border border-emerald-200 shadow-sm text-sm font-medium rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            {t('siswa.export_xlsx') || 'Export XLSX'}
          </button>
          <button
            onClick={handleExportEmis}
            disabled={!filteredStudents || filteredStudents.length === 0}
            className="inline-flex items-center justify-center px-4 py-2 border border-sky-200 shadow-sm text-sm font-medium rounded-xl text-sky-700 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export XLSX EMIS
          </button>
          {user?.scope !== 'AUDITOR' && (
            <>
              {isAdmin && students && students.length > 0 && (
                <button
                  onClick={() => setIsConfirmDeleteAllOpen(true)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-red-200 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('common.delete_all') || 'Hapus Semua'}
                </button>
              )}
              {(user?.scope === 'CABANG' || user?.scope === 'WILAYAH' || user?.scope === 'GLOBAL') && (
                <button
                  onClick={() => setIsTarikModalOpen(true)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-indigo-200 shadow-sm text-sm font-medium rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('siswa.tarik_data') || 'Tarik Data Santri'}
                </button>
              )}
              <button
                onClick={() => setIsLepasMassalOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-amber-200 shadow-sm text-sm font-medium rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <UserMinus className="w-4 h-4 mr-2" />
                {t('siswa.lepas_massal') || 'Lepas Massal'}
              </button>
              <button onClick={handleAdd} className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                {t('siswa.add_button')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'dashboard'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard Analisis
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'data'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <Users className="w-4 h-4" />
          Data Semua Santri
          {isBranchLocked && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 ml-1">
              <Lock className="w-2.5 h-2.5" /> Terkunci
            </span>
          )}
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <SiswaDashboardTab
          students={students || []}
          isLoading={isLoading}
          userScope={user?.scope}
          userWilayahId={user?.wilayahId}
          userCabangId={user?.cabangId}
        />
      ) : isBranchLocked ? (
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 rounded-2xl border border-amber-200 p-8 text-center max-w-2xl mx-auto my-8 shadow-sm space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-100/50 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800">
              Akses Data Santri Terkunci
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Untuk membuka <strong>Data Santri</strong> wajib mengisi data <strong>Profil Cabang</strong> secara lengkap (termasuk Nama Resmi, Kapasitas, Alamat Kelurahan s/d Provinsi, dan URL Google Maps).
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/profile-cabang')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Building className="w-4 h-4" />
              <span>Isi Profil Cabang Sekarang</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Info notice for Admin/Wilayah if selected branch profile is incomplete */}
          {user?.scope !== 'CABANG' && targetCabangId && !isProfileComplete && !isCabangProfileLoading && (
            <div className="mb-4 p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Perhatian:</strong> Profil cabang ini belum lengkap di Master Data (Kapasitas/Alamat/URL Maps). Anda dapat melihat data santri karena memiliki hak akses <strong>{user?.scope === 'GLOBAL' ? 'Admin Pusat' : 'Koordinator Wilayah'}</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/dashboard/profile-cabang?cabangId=${targetCabangId}`)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all inline-flex items-center gap-1 shrink-0 text-[11px] cursor-pointer"
              >
                <span>Edit Profil Cabang</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
          <AdvancedFilterBar
            onFilterChange={setAdvancedFilters}
            userScope={user?.scope || ''}
            userWilayahId={user?.wilayahId}
            userCabangId={user?.cabangId}
            showDaimiFilter={true}
            showTingkatFilter={true}
            availableTingkats={availableTingkats}
            onOpenCustomExportModal={() => setIsCustomExportOpen(true)}
          />

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200/70 bg-slate-50/50">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('siswa.search_placeholder') || 'Cari nama, NIK, atau NISN...'}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">{t('common.failed')}</div>
            ) : filteredStudents && filteredStudents.length > 0 ? (<>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest w-16">No</th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest w-16">{t('siswa.table.photo') || 'Foto'}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('siswa.name')} & NIK</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('wilayah.region_name')}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('cabang.branch_name')}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('siswa.table.academic') || 'Akademik'}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('siswa.table.completeness') || 'Kelengkapan'}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('siswa.table.status') || 'Status'}</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('common.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredStudents
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((student, idx) => {
                        const progress = calculateProgress(student);
                        return (
                          <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-slate-400">
                              {(currentPage - 1) * itemsPerPage + idx + 1}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center">
                              {student.biodata?.fotoUrl ? (
                                <div className="relative inline-block">
                                  <img
                                    src={getStudentThumbnailUrl(student.biodata.fotoUrl)!}
                                    alt="Foto Siswa"
                                    loading="lazy"
                                    className={`w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 ${student.biodata?.jenisKelamin === 'PEREMPUAN' ? 'blur-sm' : ''
                                      }`}
                                  />
                                  {student.biodata?.jenisKelamin === 'PEREMPUAN' && (
                                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-sm pointer-events-none">🔒</span>
                                  )}
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                                  <User className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-800">{student.biodata?.fullName}</div>
                              <div className="text-xs text-slate-500">
                                NIK: {student.biodata?.nik || '-'}
                                {student.biodata?.nisn ? ` | NISN: ${student.biodata.nisn}` : ''}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              {student.wilayah?.name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              {student.cabang?.name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-700">
                              <div className="flex flex-wrap gap-1 items-center">
                                {student.siswaFormal?.kelas ? (
                                  <>
                                    {student.siswaFormal.kelas.tingkat && student.siswaFormal.kelas.tingkat !== 'Non Muadalah' && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                                        {student.siswaFormal.kelas.tingkat}
                                      </span>
                                    )}
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                      {student.siswaFormal.kelas.name}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-slate-400 font-normal">Belum ada kelas</span>
                                )}
                              </div>
                              {student.dataDaimi?.grup?.jenis ? (
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    Daimi: {student.dataDaimi.grup.jenis}
                                  </span>
                                </div>
                              ) : student.grupDaimi ? (
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    Daimi: {student.grupDaimi}
                                  </span>
                                </div>
                              ) : null}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${progress === 100 ? 'bg-green-500' :
                                        progress >= 75 ? 'bg-emerald-500' :
                                          progress >= 50 ? 'bg-amber-500' :
                                            'bg-rose-500'
                                      }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-slate-600">{progress}%</span>
                                {progress < 100 && (
                                  <button
                                    onClick={() => setSelectedStudentForKelengkapan(student)}
                                    className="text-amber-500 hover:text-amber-600 transition-colors p-0.5 rounded hover:bg-amber-50 focus:outline-none"
                                    title="Lihat data yang kurang"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 w-fit ${student.statusPool === 'AKTIF_CABANG' ? 'bg-green-100 text-green-800' :
                                    student.statusPool === 'TERSEDIA' ? 'bg-blue-100 text-blue-800' :
                                      student.statusPool === 'MUTASI' ? 'bg-amber-100 text-amber-800' :
                                        'bg-slate-100 text-slate-800'
                                  }`}>
                                  {student.statusPool.replace('_', ' ')}
                                </span>
                                {!student.isActive && (
                                  <span className="inline-flex rounded-full px-2 text-[10px] font-semibold leading-4 bg-red-100 text-red-700 w-fit">
                                    Tidak Aktif
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1.5">
                              <button
                                onClick={() => setStudentToView(student)}
                                className="inline-flex items-center justify-center p-1.5 border border-slate-200 shadow-sm rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                                title="Profil Siswa"
                              >
                                <User className="h-3.5 w-3.5" />
                              </button>
                              {user?.scope !== ('AUDITOR' as any) && (
                                <>
                                  <button
                                    onClick={() => handleEdit(student)}
                                    className="inline-flex items-center justify-center p-1.5 border border-indigo-200 shadow-sm rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                    title={t('common.edit') || "Edit"}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  {student.statusPool === 'AKTIF_CABANG' && (
                                    <button
                                      onClick={() => setStudentToLepas(student)}
                                      className="inline-flex items-center justify-center p-1.5 border border-amber-200 shadow-sm rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                      title="Lepas Siswa"
                                    >
                                      <UserMinus className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {isAdmin && (
                                    <button
                                      onClick={() => setStudentToDelete(student)}
                                      className="inline-flex items-center justify-center p-1.5 border border-red-200 shadow-sm rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                      title="Hapus Siswa"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredStudents.length / itemsPerPage)}
                onPageChange={setCurrentPage}
                totalItems={filteredStudents.length}
                itemsPerPage={itemsPerPage}
              />
            </>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-slate-100">
                  <Users className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-800">{t('siswa.no_data_title')}</h3>
                <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
                  {t('siswa.no_data_desc')}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {studentToLepas && (
        <LepasSiswaModal
          student={studentToLepas}
          onClose={() => setStudentToLepas(null)}
        />
      )}

      {isLepasMassalOpen && (
        <LepasSiswaMassalModal
          students={filteredStudents}
          onClose={() => setIsLepasMassalOpen(false)}
        />
      )}

      {studentToView && (
        <StudentProfileModal
          student={studentToView}
          onClose={() => setStudentToView(null)}
          onEdit={() => {
            handleEdit(studentToView);
            setStudentToView(null);
          }}
        />
      )}

      {isTarikModalOpen && (
        <TarikSiswaMassalModal
          onClose={() => setIsTarikModalOpen(false)}
        />
      )}

      {isStudentModalOpen && (
        <StudentModal
          student={studentToEdit}
          onClose={() => setIsStudentModalOpen(false)}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={() => deleteAllMutation.mutate()}
        title="Konfirmasi Hapus Semua Siswa"
        message="PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data siswa? Aksi ini akan menghapus data siswa secara permanen beserta data riwayat dan kehadirannya."
        requireInput="HAPUS"
      />

      <ConfirmModal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => {
          if (studentToDelete) {
            deleteStudentMutation.mutate(studentToDelete.id);
          }
        }}
        title="Konfirmasi Hapus Siswa"
        message={`Apakah Anda yakin ingin menghapus data siswa "${studentToDelete?.biodata?.fullName}" secara permanen? Aksi ini tidak dapat dibatalkan.`}
      />

      {selectedStudentForKelengkapan && (
        <KelengkapanSiswaModal
          student={selectedStudentForKelengkapan}
          onClose={() => setSelectedStudentForKelengkapan(null)}
        />
      )}

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />

      <CustomFilterExportModal
        isOpen={isCustomExportOpen}
        onClose={() => setIsCustomExportOpen(false)}
        students={students || []}
      />
    </div>
  );
}
