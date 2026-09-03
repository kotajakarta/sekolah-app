import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  ShieldAlert,
  Search,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Building2,
  Users,
  Database,
  Terminal,
  UploadCloud,
  FileText,
  Key,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

interface CabangStat {
  cabangId: string;
  cabangName: string;
  wilayahName: string;
  totalSantri: number;
  terdaftarEmis: number;
  belumEmis: number;
  vervalOk: number;
  residuVerval: number;
  butuhTindakan: number;
}

interface ReconciledStudent {
  id: string;
  nama: string;
  cabangId?: string;
  cabangName: string;
  wilayahName: string;
  lembagaMuadalahName?: string;
  tingkat?: string;
  kelasName?: string;
  nisnEsantri: string;
  nikEsantri: string;
  tempatLahirEsantri: string;
  tanggalLahirEsantri: string;
  jenisKelaminEsantri: string;
  statusEmis: 'TERDAFTAR' | 'BELUM_TERDAFTAR' | 'DISKREPANSI';
  emisId?: string;
  nisnEmis?: string;
  rombelEmis?: string;
  statusVerval: 'VERVAL_OK' | 'RESIDU_VERVAL' | 'BELUM_TERDAFTAR';
  vervalPdId?: string;
  nisnVerval?: string;
  residuDetail?: Record<string, string>;
  butuhTindakan: boolean;
  discrepancies: string[];
  rekomendasiTindakan: string;
}

interface ReconciliationSummary {
  totalSantriEsantri: number;
  totalTerdaftarEmis: number;
  totalBelumEmis: number;
  totalVervalOk: number;
  totalResiduVerval: number;
  totalBelumVerval: number;
  totalDiskrepansi: number;
  totalButuhTindakan: number;
  cabangBreakdown: CabangStat[];
  students: ReconciledStudent[];
}

export default function EmisVervalSync() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'komparasi' | 'fetch-emis' | 'fetch-verval' | 'upload-csv'>('komparasi');

  // State untuk Live Fetch EMIS
  const [emisToken, setEmisToken] = useState<string>(() => localStorage.getItem('esantri_emis_token') || '');
  const [emisStudents, setEmisStudents] = useState<any[]>([]);
  const [emisLoading, setEmisLoading] = useState<boolean>(false);
  const [emisLog, setEmisLog] = useState<string[]>([]);
  const [emisProgress, setEmisProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // State untuk Live Fetch Verval
  const [vervalCookie, setVervalCookie] = useState<string>('');
  const [vervalStudents, setVervalStudents] = useState<any[]>([]);
  const [vervalLoading, setVervalLoading] = useState<boolean>(false);
  const [vervalLog, setVervalLog] = useState<string[]>([]);

  // State Rekonsiliasi & Filter
  const [reconData, setReconData] = useState<ReconciliationSummary | null>(null);
  const [reconLoading, setReconLoading] = useState<boolean>(false);
  const [selectedCabang, setSelectedCabang] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BELUM_EMIS' | 'RESIDU_VERVAL' | 'DISKREPANSI' | 'BUTUH_TINDAKAN'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  // Proteksi Khusus Admin Global
  if (user?.scope !== 'GLOBAL') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Akses Terbatas: Administrator Pusat</h2>
          <p className="text-red-700 text-sm max-w-lg mx-auto">
            Halaman integrasi, komparasi, dan validasi EMIS-Verval hanya diperuntukkan bagi Administrator Pusat (Scope GLOBAL).
            Akun Anda tidak memiliki izin untuk mengakses modul ini.
          </p>
        </div>
      </div>
    );
  }

  const addEmisLog = (msg: string) => {
    setEmisLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const addVervalLog = (msg: string) => {
    setVervalLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // --- Handlers Live Fetch EMIS ---
  const handleFetchEmisList = async () => {
    if (!emisToken.trim()) {
      showToast('error', 'Masukkan Bearer Token EMIS terlebih dahulu!');
      return;
    }
    localStorage.setItem('esantri_emis_token', emisToken.trim());
    setEmisLoading(true);
    setEmisLog([]);
    addEmisLog('Memulai pengambilan daftar santri dari API EMIS...');

    try {
      const res = await apiClient.post('/formal/emis/fetch-list', { token: emisToken.trim() });
      const items = res.data?.data || [];
      setEmisStudents(items);
      setEmisProgress({ current: items.length, total: items.length });
      addEmisLog(`Berhasil mengambil ${items.length} santri dari EMIS Kemenag.`);
      showToast('success', `Berhasil menarik ${items.length} data santri dari EMIS.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal menghubungi server EMIS';
      addEmisLog(`Error: ${msg}`);
      showToast('error', msg);
    } finally {
      setEmisLoading(false);
    }
  };

  // --- Handlers Live Fetch Verval ---
  const handleFetchVervalDaftar = async () => {
    if (!vervalCookie.trim()) {
      showToast('error', 'Masukkan Browser Cookie VervalPD terlebih dahulu!');
      return;
    }
    setVervalLoading(true);
    setVervalLog([]);
    addVervalLog('Memulai penarikan data siswa dari VervalPD Kemendikbud...');

    try {
      const res = await apiClient.post('/formal/emis/verval/fetch-daftar', { cookie: vervalCookie.trim() });
      const items = res.data?.data || [];
      setVervalStudents(items);
      addVervalLog(`Berhasil mengambil ${items.length} santri dari VervalPD.`);
      showToast('success', `Berhasil menarik ${items.length} data siswa VervalPD.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal menghubungi VervalPD';
      addVervalLog(`Error: ${msg}`);
      showToast('error', msg);
    } finally {
      setVervalLoading(false);
    }
  };

  const handleFetchVervalResidu = async () => {
    if (!vervalCookie.trim()) {
      showToast('error', 'Masukkan Browser Cookie VervalPD terlebih dahulu!');
      return;
    }
    setVervalLoading(true);
    addVervalLog('Memulai penarikan data residu dari VervalPD Kemendikbud...');

    try {
      const res = await apiClient.post('/formal/emis/verval/fetch-residu', { cookie: vervalCookie.trim() });
      const items = res.data?.data || [];
      // Merge residu info into verval students
      setVervalStudents((prev) => {
        const map = new Map(prev.map((s) => [s.pesertaDidikId, s]));
        for (const r of items) {
          map.set(r.pesertaDidikId, { ...r, isResidu: true });
        }
        return Array.from(map.values());
      });
      addVervalLog(`Berhasil mengambil ${items.length} santri residu dari VervalPD.`);
      showToast('success', `Berhasil menarik ${items.length} data residu VervalPD.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal menghubungi VervalPD';
      addVervalLog(`Error: ${msg}`);
      showToast('error', msg);
    } finally {
      setVervalLoading(false);
    }
  };

  // --- Handlers Upload CSV Offline ---
  const handleUploadEmisCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setEmisStudents(results.data);
          showToast('success', `Berhasil memuat ${results.data.length} santri dari file CSV EMIS.`);
        },
      });
    };
    reader.readAsText(file);
  };

  const handleUploadVervalCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const mapped = (results.data as any[]).map((r) => ({
            pesertaDidikId: r.peserta_didik_id || r.id || '',
            nik: r.nik || '',
            nisn: r.nisn || '',
            nama: r.nama || '',
            tempatLahir: r.tempat_lahir || '',
            tanggalLahir: r.tanggal_lahir || '',
            namaIbuKandung: r.nama_ibu_kandung || '',
            jenisKelamin: r.jenis_kelamin || '',
            isResidu: false,
          }));
          setVervalStudents(mapped);
          showToast('success', `Berhasil memuat ${mapped.length} siswa dari file CSV Verval.`);
        },
      });
    };
    reader.readAsText(file);
  };

  // --- Jalankan Komparasi dengan Database eSantri ---
  const handleRunReconcile = async () => {
    setReconLoading(true);
    try {
      const res = await apiClient.post('/formal/emis/reconcile', {
        emisStudents,
        vervalStudents,
      });
      setReconData(res.data?.data);
      setActiveTab('komparasi');
      showToast('success', 'Komparasi data dengan database eSantri selesai!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal menjalankan komparasi';
      showToast('error', msg);
    } finally {
      setReconLoading(false);
    }
  };

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    if (!reconData?.students) return [];
    return reconData.students.filter((s) => {
      if (selectedCabang !== 'ALL' && s.cabangId !== selectedCabang && s.cabangName !== selectedCabang) {
        return false;
      }
      if (statusFilter === 'BELUM_EMIS' && s.statusEmis !== 'BELUM_TERDAFTAR') return false;
      if (statusFilter === 'RESIDU_VERVAL' && s.statusVerval !== 'RESIDU_VERVAL') return false;
      if (statusFilter === 'DISKREPANSI' && s.statusEmis !== 'DISKREPANSI' && s.discrepancies.length === 0) return false;
      if (statusFilter === 'BUTUH_TINDAKAN' && !s.butuhTindakan) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.nama.toLowerCase().includes(q);
        const matchNisn = s.nisnEsantri.toLowerCase().includes(q) || (s.nisnEmis && s.nisnEmis.toLowerCase().includes(q));
        const matchCabang = s.cabangName.toLowerCase().includes(q);
        if (!matchName && !matchNisn && !matchCabang) return false;
      }
      return true;
    });
  }, [reconData, selectedCabang, statusFilter, searchQuery]);

  // Ekspor Laporan Excel untuk Cabang
  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      showToast('warning', 'Tidak ada data untuk diekspor!');
      return;
    }

    const exportRows = filteredStudents.map((s, idx) => ({
      'No': idx + 1,
      'Nama Santri': s.nama,
      'Cabang': s.cabangName,
      'Wilayah': s.wilayahName,
      'Lembaga Muadalah': s.lembagaMuadalahName,
      'Tingkat eSantri': s.tingkat || '-',
      'Kelas / Rombel eSantri': s.kelasName,
      'NISN eSantri': s.nisnEsantri,
      'NIK eSantri': s.nikEsantri,
      'Tempat Lahir': s.tempatLahirEsantri,
      'Tanggal Lahir': s.tanggalLahirEsantri,
      'Status EMIS Kemenag': s.statusEmis === 'TERDAFTAR' ? 'Terdaftar' : s.statusEmis === 'DISKREPANSI' ? 'Ada Selisih' : 'BELUM TERDAFTAR',
      'NISN di EMIS': s.nisnEmis || '-',
      'Rombel di EMIS': s.rombelEmis || '-',
      'Status Verval Kemendikbud': s.statusVerval === 'VERVAL_OK' ? 'Valid' : s.statusVerval === 'RESIDU_VERVAL' ? 'RESIDU' : 'Belum Terdaftar',
      'NISN di Verval': s.nisnVerval || '-',
      'Detail Selisih / Residu': s.discrepancies.join('; ') || (s.residuDetail ? JSON.stringify(s.residuDetail) : '-'),
      'Rekomendasi Tindakan Cabang': s.rekomendasiTindakan,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tindak_Lanjut_Cabang');

    const cabangLabel = selectedCabang !== 'ALL' ? `_${selectedCabang}` : '_SemuaCabang';
    XLSX.writeFile(workbook, `Laporan_Validasi_EMIS_Verval${cabangLabel}_${Date.now()}.xlsx`);
    showToast('success', 'File Excel laporan tindak lanjut cabang berhasil diunduh.');
  };

  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header Utama */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">Validasi & Komparasi EMIS - Verval</h1>
              <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-300">
                Audit Mode (Non-Destruktif)
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Audit pemadanan data santri eSantri dengan EMIS Kemenag & Verval Kemendikbud untuk tindak lanjut cabang.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunReconcile}
              disabled={reconLoading}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${reconLoading ? 'animate-spin' : ''}`} />
              {reconLoading ? 'Memproses Audit...' : 'Jalankan Komparasi Database'}
            </button>
          </div>
        </div>

        {/* Banner Keamanan Data */}
        <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 leading-relaxed">
            <strong>Keamanan Data Terjamin:</strong> Modul ini bekerja murni secara <em>read-only</em>.
            Penarikan data kementerian dan pencocokan dengan database eSantri tidak akan mengubah, menimpa, atau menghapus data santri yang ada di database.
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mt-6 -mb-6">
          <button
            onClick={() => setActiveTab('komparasi')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'komparasi'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            📊 Hasil Komparasi & Audit Cabang
          </button>
          <button
            onClick={() => setActiveTab('fetch-emis')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'fetch-emis'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            ⚡ Tarik Data EMIS (Live API)
            {emisStudents.length > 0 && (
              <span className="ml-2 bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {emisStudents.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('fetch-verval')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'fetch-verval'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            🌐 Tarik Data VervalPD
            {vervalStudents.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {vervalStudents.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('upload-csv')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upload-csv'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            📁 Upload File CSV/Excel (Offline)
          </button>
        </div>
      </div>

      {/* TAB 1: HASIL KOMPARASI & AUDIT CABANG */}
      {activeTab === 'komparasi' && (
        <div className="space-y-6">
          {!reconData ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-1">Belum Ada Hasil Komparasi</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                Klik tombol di bawah ini untuk memulai pencocokan data santri eSantri dengan data EMIS/Verval yang tersedia.
              </p>
              <button
                onClick={handleRunReconcile}
                disabled={reconLoading}
                className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${reconLoading ? 'animate-spin' : ''}`} />
                Jalankan Komparasi Sekarang
              </button>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500">Total Santri eSantri</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{reconData.totalSantriEsantri}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Database aktif</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
                  <div className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terdaftar EMIS
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">{reconData.totalTerdaftarEmis}</div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">
                    {Math.round((reconData.totalTerdaftarEmis / (reconData.totalSantriEsantri || 1)) * 100)}% tercakup
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm">
                  <div className="text-xs font-medium text-rose-700 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" /> Belum Masuk EMIS
                  </div>
                  <div className="text-2xl font-bold text-rose-700 mt-1">{reconData.totalBelumEmis}</div>
                  <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Tindak lanjut cabang!</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-sm">
                  <div className="text-xs font-medium text-blue-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Verval Valid
                  </div>
                  <div className="text-2xl font-bold text-blue-700 mt-1">{reconData.totalVervalOk}</div>
                  <div className="text-[11px] text-blue-600 mt-0.5">Kemendikbud valid</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
                  <div className="text-xs font-medium text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Residu Verval
                  </div>
                  <div className="text-2xl font-bold text-amber-700 mt-1">{reconData.totalResiduVerval}</div>
                  <div className="text-[11px] text-amber-600 mt-0.5">Perlu koreksi NIK/data</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-sm">
                  <div className="text-xs font-medium text-purple-700 flex items-center gap-1">
                    <Search className="w-3.5 h-3.5 text-purple-600" /> Selisih Data
                  </div>
                  <div className="text-2xl font-bold text-purple-700 mt-1">{reconData.totalDiskrepansi}</div>
                  <div className="text-[11px] text-purple-600 mt-0.5">Beda NISN / Lahir</div>
                </div>
              </div>

              {/* Rekapitulasi per Cabang */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-semibold text-slate-800 text-sm">Rekapitulasi Santri Butuh Tindak Lanjut per Cabang</h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    Menampilkan {reconData.cabangBreakdown.length} Cabang
                  </span>
                </div>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5">Nama Cabang</th>
                        <th className="px-4 py-2.5">Wilayah</th>
                        <th className="px-4 py-2.5 text-center">Total Santri</th>
                        <th className="px-4 py-2.5 text-center text-emerald-700">Masuk EMIS</th>
                        <th className="px-4 py-2.5 text-center text-rose-700">Belum EMIS</th>
                        <th className="px-4 py-2.5 text-center text-blue-700">Verval Valid</th>
                        <th className="px-4 py-2.5 text-center text-amber-700">Residu Verval</th>
                        <th className="px-4 py-2.5 text-center text-rose-800 font-bold">Butuh Tindakan</th>
                        <th className="px-4 py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reconData.cabangBreakdown.map((c) => (
                        <tr key={c.cabangId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2 font-medium text-slate-800">{c.cabangName}</td>
                          <td className="px-4 py-2 text-slate-500">{c.wilayahName}</td>
                          <td className="px-4 py-2 text-center font-medium">{c.totalSantri}</td>
                          <td className="px-4 py-2 text-center text-emerald-600 font-medium">{c.terdaftarEmis}</td>
                          <td className="px-4 py-2 text-center text-rose-600 font-medium">{c.belumEmis}</td>
                          <td className="px-4 py-2 text-center text-blue-600 font-medium">{c.vervalOk}</td>
                          <td className="px-4 py-2 text-center text-amber-600 font-medium">{c.residuVerval}</td>
                          <td className="px-4 py-2 text-center">
                            {c.butuhTindakan > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                {c.butuhTindakan} Santri
                              </span>
                            ) : (
                              <span className="text-emerald-600 text-xs">✓ Lengkap</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => {
                                setSelectedCabang(c.cabangName);
                                setPage(1);
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                            >
                              Filter Cabang →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Filter Bar & Action Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    {/* Filter Cabang */}
                    <select
                      value={selectedCabang}
                      onChange={(e) => {
                        setSelectedCabang(e.target.value);
                        setPage(1);
                      }}
                      className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-700"
                    >
                      <option value="ALL">Semua Cabang ({reconData.totalSantriEsantri})</option>
                      {reconData.cabangBreakdown.map((c) => (
                        <option key={c.cabangId} value={c.cabangName}>
                          {c.cabangName} ({c.totalSantri})
                        </option>
                      ))}
                    </select>

                    {/* Filter Status */}
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value as any);
                        setPage(1);
                      }}
                      className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-700"
                    >
                      <option value="ALL">Semua Status Santri</option>
                      <option value="BUTUH_TINDAKAN">⚠️ Butuh Tindak Lanjut Cabang ({reconData.totalButuhTindakan})</option>
                      <option value="BELUM_EMIS">❌ Belum Terdaftar di EMIS ({reconData.totalBelumEmis})</option>
                      <option value="RESIDU_VERVAL">⚠️ Residu Verval ({reconData.totalResiduVerval})</option>
                      <option value="DISKREPANSI">🔍 Selisih Data ({reconData.totalDiskrepansi})</option>
                    </select>

                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Cari nama santri, NISN, atau cabang..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setPage(1);
                        }}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Tombol Ekspor */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleExportExcel}
                      className="inline-flex items-center px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                      title="Unduh file Excel untuk dibagikan ke cabang"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                      Ekspor Laporan Cabang (Excel)
                    </button>
                  </div>
                </div>

                {/* Tabel Detail Santri */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2.5">No</th>
                        <th className="px-3.5 py-2.5">Nama Santri</th>
                        <th className="px-3.5 py-2.5">Cabang & Muadalah</th>
                        <th className="px-3.5 py-2.5">NISN eSantri</th>
                        <th className="px-3.5 py-2.5">Status EMIS</th>
                        <th className="px-3.5 py-2.5">Status Verval</th>
                        <th className="px-3.5 py-2.5">Rekomendasi Tindak Lanjut Cabang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400 italic">
                            Tidak ada santri yang cocok dengan filter.
                          </td>
                        </tr>
                      ) : (
                        paginatedStudents.map((s, idx) => (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3.5 py-2 text-slate-400">{(page - 1) * pageSize + idx + 1}</td>
                            <td className="px-3.5 py-2">
                              <div className="font-semibold text-slate-800">{s.nama}</div>
                              <div className="text-[10px] text-slate-400">
                                {s.tempatLahirEsantri}, {s.tanggalLahirEsantri} ({s.jenisKelaminEsantri})
                              </div>
                            </td>
                            <td className="px-3.5 py-2">
                              <div className="font-medium text-slate-700">{s.cabangName}</div>
                              <div className="text-[10px] text-slate-400">
                                {s.lembagaMuadalahName} • Kelas {s.kelasName}
                              </div>
                            </td>
                            <td className="px-3.5 py-2 font-mono text-slate-700">{s.nisnEsantri}</td>
                            <td className="px-3.5 py-2">
                              {s.statusEmis === 'TERDAFTAR' && (
                                <div>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                    ✓ Terdaftar ({s.nisnEmis})
                                  </span>
                                  {s.rombelEmis && s.rombelEmis !== '-' && (
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                      Rombel: {s.rombelEmis}
                                    </div>
                                  )}
                                </div>
                              )}
                              {s.statusEmis === 'DISKREPANSI' && (
                                <div>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                                    ⚠ Selisih ({s.nisnEmis})
                                  </span>
                                  {s.rombelEmis && s.rombelEmis !== '-' && (
                                    <div className="text-[10px] text-amber-700 font-mono mt-0.5">
                                      Rombel: {s.rombelEmis}
                                    </div>
                                  )}
                                </div>
                              )}
                              {s.statusEmis === 'BELUM_TERDAFTAR' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                                  ✕ Belum Masuk EMIS
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-2">
                              {s.statusVerval === 'VERVAL_OK' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                                  ✓ Verval Valid
                                </span>
                              )}
                              {s.statusVerval === 'RESIDU_VERVAL' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                                  ⚠ Residu Verval
                                </span>
                              )}
                              {s.statusVerval === 'BELUM_TERDAFTAR' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                  - Belum Ada
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-2">
                              {s.butuhTindakan ? (
                                <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] leading-tight">
                                  <div className="font-semibold">Perlu Tindakan Cabang:</div>
                                  <div>{s.rekomendasiTindakan}</div>
                                  {s.discrepancies.length > 0 && (
                                    <div className="text-[10px] text-rose-600 mt-0.5 font-mono">
                                      {s.discrepancies.join(' | ')}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-emerald-700 text-xs font-medium">✓ Lengkap & Sinkron</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500">
                    Menampilkan {paginatedStudents.length} dari {filteredStudents.length} santri
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-xs text-slate-600 px-2 font-medium">
                      Halaman {page} dari {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: TARIK DATA EMIS (LIVE) */}
      {activeTab === 'fetch-emis' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" />
              Live Extractor API EMIS Kemenag
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Menghubungkan langsung ke API EMIS Kemenag menggunakan Bearer Token resmi untuk mengambil data santri terdaftar.
            </p>
          </div>

          <div className="space-y-3 max-w-2xl">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Bearer Token EMIS (Dari Browser DevTools)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={emisToken}
                onChange={(e) => setEmisToken(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button
                onClick={handleFetchEmisList}
                disabled={emisLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                {emisLoading ? 'Menarik Data...' : '⚡ Tarik Daftar Santri'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Tips: Buka portal <strong>emis.kemenag.go.id</strong> → Login operator → Buka F12 DevTools → Tab Network → Cari request API → Salin nilai Authorization Bearer token.
            </p>
          </div>

          {/* Console Log Window */}
          {emisLog.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-600" /> Terminal Log Penarikan EMIS
              </div>
              <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs max-h-48 overflow-y-auto space-y-1 shadow-inner">
                {emisLog.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Hasil Fetch */}
          {emisStudents.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">
                  Pratinjau Data EMIS ({emisStudents.length} Santri Berhasil Ditarik)
                </div>
                <button
                  onClick={handleRunReconcile}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
                >
                  Bandingkan dengan Database eSantri →
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-72">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2">ID EMIS</th>
                      <th className="px-3 py-2">Nama Santri</th>
                      <th className="px-3 py-2">NISN</th>
                      <th className="px-3 py-2">Tempat, Tanggal Lahir</th>
                      <th className="px-3 py-2">Rombel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {emisStudents.slice(0, 50).map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 font-mono text-[11px] text-slate-400">{s.id || s._emis_id || '-'}</td>
                        <td className="px-3 py-1.5 font-medium text-slate-800">{s.full_name || s.nama || '-'}</td>
                        <td className="px-3 py-1.5 font-mono">{s.nisn || '-'}</td>
                        <td className="px-3 py-1.5">{s.birth_place || s.tempat_lahir || '-'}, {s.birth_date || s.tanggal_lahir || '-'}</td>
                        <td className="px-3 py-1.5">{s.la_study_group_name || s.study_group_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TARIK DATA VERVALPD (LIVE) */}
      {activeTab === 'fetch-verval' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              Live Extractor VervalPD Kemendikbud
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Menarik data verifikasi identitas santri & data residu langsung dari portal resmi VervalPD.
            </p>
          </div>

          <div className="space-y-3 max-w-2xl">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Browser Cookie VervalPD
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="ci_session=...; TS01d1a227=..."
                value={vervalCookie}
                onChange={(e) => setVervalCookie(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                onClick={handleFetchVervalDaftar}
                disabled={vervalLoading}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                Tarik Daftar Verval
              </button>
              <button
                onClick={handleFetchVervalResidu}
                disabled={vervalLoading}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                Tarik Residu
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Tips: Buka <strong>vervalpd.data.kemendikdasmen.go.id</strong> → Login operator → Tekan F12 → Application → Cookies → Salin nilai Cookie yang aktif.
            </p>
          </div>

          {/* Console Log Verval */}
          {vervalLog.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-600" /> Terminal Log Penarikan VervalPD
              </div>
              <div className="bg-slate-900 text-cyan-400 p-4 rounded-xl font-mono text-xs max-h-48 overflow-y-auto space-y-1 shadow-inner">
                {vervalLog.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Hasil Fetch Verval */}
          {vervalStudents.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">
                  Pratinjau Data VervalPD ({vervalStudents.length} Siswa)
                </div>
                <button
                  onClick={handleRunReconcile}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
                >
                  Bandingkan dengan Database eSantri →
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-72">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Nama Siswa</th>
                      <th className="px-3 py-2">NISN</th>
                      <th className="px-3 py-2">NIK</th>
                      <th className="px-3 py-2">Tempat, Tanggal Lahir</th>
                      <th className="px-3 py-2">Status Residu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vervalStudents.slice(0, 50).map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 font-medium text-slate-800">{s.nama}</td>
                        <td className="px-3 py-1.5 font-mono">{s.nisn || '-'}</td>
                        <td className="px-3 py-1.5 font-mono">{s.nik || '-'}</td>
                        <td className="px-3 py-1.5">{s.tempatLahir}, {s.tanggalLahir}</td>
                        <td className="px-3 py-1.5">
                          {s.isResidu ? (
                            <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">Residu</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: UPLOAD FILE CSV / EXCEL (OFFLINE) */}
      {activeTab === 'upload-csv' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              Upload File Ekspor EMIS / Verval (Offline Mode)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Jika Anda sudah mengunduh file CSV/Excel dari portal EMIS atau Verval, unggah langsung di sini tanpa perlu fetch live.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Box EMIS */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
              <FileSpreadsheet className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
              <div className="font-semibold text-sm text-slate-700 mb-1">Unggah File EMIS (CSV)</div>
              <p className="text-xs text-slate-500 mb-4">
                File <code>emis-ulya.csv</code> atau <code>emis-wustha.csv</code>
              </p>
              <input
                type="file"
                accept=".csv"
                id="emis-csv-input"
                onChange={handleUploadEmisCsv}
                className="hidden"
              />
              <label
                htmlFor="emis-csv-input"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
              >
                Pilih File CSV EMIS
              </label>
              {emisStudents.length > 0 && (
                <div className="text-xs text-emerald-600 font-semibold mt-3">
                  ✓ {emisStudents.length} santri termuat dari file
                </div>
              )}
            </div>

            {/* Upload Box Verval */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
              <FileSpreadsheet className="w-10 h-10 text-blue-500 mx-auto mb-3" />
              <div className="font-semibold text-sm text-slate-700 mb-1">Unggah File Verval (CSV)</div>
              <p className="text-xs text-slate-500 mb-4">
                File <code>daftar-verval-*.csv</code> atau <code>residu-verval-*.csv</code>
              </p>
              <input
                type="file"
                accept=".csv"
                id="verval-csv-input"
                onChange={handleUploadVervalCsv}
                className="hidden"
              />
              <label
                htmlFor="verval-csv-input"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
              >
                Pilih File CSV Verval
              </label>
              {vervalStudents.length > 0 && (
                <div className="text-xs text-emerald-600 font-semibold mt-3">
                  ✓ {vervalStudents.length} santri termuat dari file
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleRunReconcile}
              disabled={emisStudents.length === 0 && vervalStudents.length === 0}
              className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Jalankan Komparasi dengan Data File Terunggah
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
