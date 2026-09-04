import React, { useState, useMemo, useEffect } from 'react';
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
  Info,
  Plus,
  Trash2,
  History,
  Calendar,
  X,
  Clock,
  Eye,
  EyeOff,
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
  batchId?: string;
  executedAt?: string;
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

  // State Riwayat Audit dari Database
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // State untuk Live Fetch EMIS (Multi-Token Support)
  interface EmisTokenEntry {
    id: string;
    label: string;
    token: string;
  }

  const [tokenEntries, setTokenEntries] = useState<EmisTokenEntry[]>(() => {
    try {
      const saved = localStorage.getItem('esantri_emis_tokens_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const oldToken = localStorage.getItem('esantri_emis_token') || '';
    return [
      { id: '1', label: 'PDF Ulya (Sekolah 1)', token: oldToken },
      { id: '2', label: 'PDF Wustha (Sekolah 2)', token: '' },
    ];
  });

  const [isAppendMode, setIsAppendMode] = useState<boolean>(true);
  const [emisStudents, setEmisStudents] = useState<any[]>([]);
  const [emisLoading, setEmisLoading] = useState<boolean>(false);
  const [activeEmisFetchId, setActiveEmisFetchId] = useState<string | null>(null);
  const [showTokenMap, setShowTokenMap] = useState<Record<string, boolean>>({});
  const [emisLog, setEmisLog] = useState<string[]>([]);
  const [emisProgress, setEmisProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  const saveTokens = (tokens: EmisTokenEntry[]) => {
    setTokenEntries(tokens);
    try {
      localStorage.setItem('esantri_emis_tokens_list', JSON.stringify(tokens));
      if (tokens.length > 0 && tokens[0].token) {
        localStorage.setItem('esantri_emis_token', tokens[0].token);
      }
    } catch {}
  };

  const handleAddTokenEntry = () => {
    const nextIdx = tokenEntries.length + 1;
    saveTokens([
      ...tokenEntries,
      { id: String(Date.now()), label: `Sekolah / Lembaga ${nextIdx}`, token: '' },
    ]);
  };

  const handleUpdateTokenEntry = (id: string, field: 'label' | 'token', val: string) => {
    const updated = tokenEntries.map((t) => (t.id === id ? { ...t, [field]: val } : t));
    saveTokens(updated);
  };

  const handleRemoveTokenEntry = (id: string) => {
    if (tokenEntries.length <= 1) {
      showToast('warning', 'Minimal harus ada 1 entri token sekolah.');
      return;
    }
    const updated = tokenEntries.filter((t) => t.id !== id);
    saveTokens(updated);
  };

  // Helper deduplikasi saat merge santri antar sekolah
  const mergeEmisStudents = (existing: any[], incoming: any[]): any[] => {
    const map = new Map<string, any>();
    for (const item of existing) {
      const nisn = (item.nisn || item.list_nisn || '').trim();
      const nama = item.full_name || item.nama || item.list_full_name || '';
      const tmpt = item.birth_place || item.tempat_lahir || '';
      const key = nisn ? `NISN:${nisn}` : `KEY:${nama.toLowerCase()}|${tmpt.toLowerCase()}`;
      map.set(key, item);
    }
    for (const item of incoming) {
      const nisn = (item.nisn || item.list_nisn || '').trim();
      const nama = item.full_name || item.nama || item.list_full_name || '';
      const tmpt = item.birth_place || item.tempat_lahir || '';
      const key = nisn ? `NISN:${nisn}` : `KEY:${nama.toLowerCase()}|${tmpt.toLowerCase()}`;
      map.set(key, item);
    }
    return Array.from(map.values());
  };

  // State untuk Live Fetch Verval
  interface VervalCookieEntry {
    id: string;
    label: string;
    cookie: string;
  }

  const [vervalEntries, setVervalEntries] = useState<VervalCookieEntry[]>(() => {
    try {
      const saved = localStorage.getItem('esantri_verval_cookies_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const oldCookie = localStorage.getItem('esantri_verval_cookie') || '';
    return [
      { id: '1', label: 'PDF Ulya (Sekolah 1)', cookie: oldCookie },
      { id: '2', label: 'PDF Wustha (Sekolah 2)', cookie: '' },
    ];
  });

  const [isVervalAppendMode, setIsVervalAppendMode] = useState<boolean>(true);
  const [vervalStudents, setVervalStudents] = useState<any[]>([]);
  const [vervalLoading, setVervalLoading] = useState<boolean>(false);
  const [activeVervalFetch, setActiveVervalFetch] = useState<{ id: string; mode: 'all' | 'daftar' | 'residu' } | null>(null);
  const [showCookieMap, setShowCookieMap] = useState<Record<string, boolean>>({});
  const [vervalLog, setVervalLog] = useState<string[]>([]);

  const saveVervalCookies = (entries: VervalCookieEntry[]) => {
    setVervalEntries(entries);
    try {
      localStorage.setItem('esantri_verval_cookies_list', JSON.stringify(entries));
      if (entries.length > 0 && entries[0].cookie) {
        localStorage.setItem('esantri_verval_cookie', entries[0].cookie);
      }
    } catch {}
  };

  const handleAddVervalEntry = () => {
    const nextIdx = vervalEntries.length + 1;
    saveVervalCookies([
      ...vervalEntries,
      { id: String(Date.now()), label: `Sekolah / Lembaga ${nextIdx}`, cookie: '' },
    ]);
  };

  const handleUpdateVervalEntry = (id: string, field: 'label' | 'cookie', val: string) => {
    const updated = vervalEntries.map((v) => (v.id === id ? { ...v, [field]: val } : v));
    saveVervalCookies(updated);
  };

  const handleRemoveVervalEntry = (id: string) => {
    if (vervalEntries.length <= 1) {
      showToast('warning', 'Minimal harus ada 1 entri cookie sekolah.');
      return;
    }
    const updated = vervalEntries.filter((v) => v.id !== id);
    saveVervalCookies(updated);
  };

  // Helper deduplikasi saat merge santri Verval antar sekolah
  const mergeVervalStudents = (existing: any[], incoming: any[]): any[] => {
    const map = new Map<string, any>();
    for (const item of existing) {
      const pdId = item.pesertaDidikId ? `PD:${item.pesertaDidikId}` : '';
      const nisn = (item.nisn || '').trim();
      const nik = (item.nik || '').trim();
      const nama = (item.nama || '').trim().toLowerCase();
      const tmpt = (item.tempatLahir || '').trim().toLowerCase();
      const key = pdId || (nisn ? `NISN:${nisn}` : (nik ? `NIK:${nik}` : `KEY:${nama}|${tmpt}`));
      map.set(key, item);
    }
    for (const item of incoming) {
      const pdId = item.pesertaDidikId ? `PD:${item.pesertaDidikId}` : '';
      const nisn = (item.nisn || '').trim();
      const nik = (item.nik || '').trim();
      const nama = (item.nama || '').trim().toLowerCase();
      const tmpt = (item.tempatLahir || '').trim().toLowerCase();
      const key = pdId || (nisn ? `NISN:${nisn}` : (nik ? `NIK:${nik}` : `KEY:${nama}|${tmpt}`));
      if (map.has(key)) {
        const prev = map.get(key);
        map.set(key, {
          ...prev,
          ...item,
          isResidu: prev.isResidu || item.isResidu,
          residuDetail: { ...(prev.residuDetail || {}), ...(item.residuDetail || {}) },
          _source_lembaga: prev._source_lembaga || item._source_lembaga,
        });
      } else {
        map.set(key, item);
      }
    }
    return Array.from(map.values());
  };

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

  // --- Handlers Live Fetch EMIS (Single Token) ---
  const handleFetchSingleToken = async (entry: EmisTokenEntry) => {
    if (!entry.token.trim()) {
      showToast('error', `Token untuk [${entry.label}] masih kosong!`);
      return;
    }
    setEmisLoading(true);
    setActiveEmisFetchId(entry.id);
    addEmisLog(`[${entry.label}] Memulai pengambilan daftar santri dari API EMIS...`);

    try {
      const cleanToken = entry.token.trim().replace(/^Bearer\s+/i, '');
      const res = await apiClient.post('/formal/emis/fetch-list', { token: cleanToken });
      const items = (res.data?.data || []).map((s: any) => ({
        ...s,
        _source_lembaga: entry.label,
      }));

      setEmisStudents((prev) => {
        const merged = isAppendMode ? mergeEmisStudents(prev, items) : items;
        setEmisProgress({ current: merged.length, total: merged.length });
        return merged;
      });

      addEmisLog(`[${entry.label}] Berhasil mengambil ${items.length} santri.`);
      showToast('success', `[${entry.label}] Berhasil menarik ${items.length} santri.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal menghubungi server EMIS';
      addEmisLog(`[${entry.label}] Error: ${msg}`);
      showToast('error', `[${entry.label}]: ${msg}`);
    } finally {
      setEmisLoading(false);
      setActiveEmisFetchId(null);
    }
  };

  // --- Handlers Live Fetch EMIS (Batch All Tokens) ---
  const handleFetchAllTokens = async () => {
    const validEntries = tokenEntries.filter((t) => t.token.trim().length > 0);
    if (validEntries.length === 0) {
      showToast('error', 'Tidak ada token yang terisi. Masukkan minimal 1 Bearer Token.');
      return;
    }

    setEmisLoading(true);
    setEmisLog([]);
    addEmisLog(`Memulai penarikan data dari ${validEntries.length} sekolah / lembaga terdaftar...`);

    let accumulated: any[] = isAppendMode ? [...emisStudents] : [];

    for (let i = 0; i < validEntries.length; i++) {
      const entry = validEntries[i];
      addEmisLog(`(${i + 1}/${validEntries.length}) [${entry.label}] Menghubungi API EMIS...`);

      try {
        const cleanToken = entry.token.trim().replace(/^Bearer\s+/i, '');
        const res = await apiClient.post('/formal/emis/fetch-list', { token: cleanToken });
        const items = (res.data?.data || []).map((s: any) => ({
          ...s,
          _source_lembaga: entry.label,
        }));
        accumulated = mergeEmisStudents(accumulated, items);
        addEmisLog(`(${i + 1}/${validEntries.length}) [${entry.label}] Berhasil: +${items.length} santri. (Total terkumpul: ${accumulated.length})`);
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Gagal menghubungi server EMIS';
        addEmisLog(`(${i + 1}/${validEntries.length}) [${entry.label}] Gagal: ${msg}`);
      }
    }

    setEmisStudents(accumulated);
    setEmisProgress({ current: accumulated.length, total: accumulated.length });
    setEmisLoading(false);
    addEmisLog(`✅ Penarikan selesai! Total ${accumulated.length} santri terkumpul dari semua lembaga.`);
    showToast('success', `Berhasil menarik total ${accumulated.length} santri dari semua lembaga.`);
  };

  // --- Handlers Live Fetch Verval (Single School) ---
  const handleFetchSingleVerval = async (entry: VervalCookieEntry, mode: 'all' | 'daftar' | 'residu' = 'all') => {
    if (!entry.cookie.trim()) {
      showToast('error', `Cookie Verval untuk [${entry.label}] masih kosong!`);
      return;
    }
    setVervalLoading(true);
    setActiveVervalFetch({ id: entry.id, mode });
    addVervalLog(`[${entry.label}] Memulai penarikan data dari VervalPD Kemendikbud...`);

    try {
      let items: any[] = [];

      if (mode === 'all' || mode === 'daftar') {
        addVervalLog(`[${entry.label}] Mengambil daftar siswa VervalPD...`);
        const resDaftar = await apiClient.post('/formal/emis/verval/fetch-daftar', { cookie: entry.cookie.trim() });
        const daftarItems = (resDaftar.data?.data || []).map((s: any) => ({
          ...s,
          _source_lembaga: entry.label,
        }));
        items = daftarItems;
        addVervalLog(`[${entry.label}] Berhasil mengambil ${daftarItems.length} siswa daftar Verval.`);
      }

      if (mode === 'all' || mode === 'residu') {
        addVervalLog(`[${entry.label}] Mengambil data residu siswa VervalPD...`);
        const resResidu = await apiClient.post('/formal/emis/verval/fetch-residu', { cookie: entry.cookie.trim() });
        const residuItems = (resResidu.data?.data || []).map((s: any) => ({
          ...s,
          _source_lembaga: entry.label,
          isResidu: true,
        }));
        items = mergeVervalStudents(items, residuItems);
        addVervalLog(`[${entry.label}] Berhasil mengambil ${residuItems.length} siswa residu Verval.`);
      }

      setVervalStudents((prev) => {
        return isVervalAppendMode ? mergeVervalStudents(prev, items) : items;
      });

      showToast('success', `[${entry.label}] Berhasil menarik data siswa VervalPD.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal menghubungi VervalPD';
      addVervalLog(`[${entry.label}] Error: ${msg}`);
      showToast('error', `[${entry.label}]: ${msg}`);
    } finally {
      setVervalLoading(false);
      setActiveVervalFetch(null);
    }
  };

  // --- Handlers Live Fetch Verval (Batch All Schools) ---
  const handleFetchAllVerval = async () => {
    const validEntries = vervalEntries.filter((v) => v.cookie.trim().length > 0);
    if (validEntries.length === 0) {
      showToast('error', 'Tidak ada cookie yang terisi. Masukkan minimal 1 Cookie VervalPD.');
      return;
    }

    setVervalLoading(true);
    setVervalLog([]);
    addVervalLog(`Memulai penarikan data dari ${validEntries.length} sekolah / lembaga VervalPD...`);

    let accumulated: any[] = isVervalAppendMode ? [...vervalStudents] : [];

    for (let i = 0; i < validEntries.length; i++) {
      const entry = validEntries[i];
      addVervalLog(`(${i + 1}/${validEntries.length}) [${entry.label}] Menghubungi VervalPD...`);

      try {
        // 1. Fetch Daftar
        const resDaftar = await apiClient.post('/formal/emis/verval/fetch-daftar', { cookie: entry.cookie.trim() });
        const daftarItems = (resDaftar.data?.data || []).map((s: any) => ({
          ...s,
          _source_lembaga: entry.label,
        }));
        accumulated = mergeVervalStudents(accumulated, daftarItems);
        addVervalLog(`(${i + 1}/${validEntries.length}) [${entry.label}] Daftar: +${daftarItems.length} siswa.`);

        // 2. Fetch Residu
        const resResidu = await apiClient.post('/formal/emis/verval/fetch-residu', { cookie: entry.cookie.trim() });
        const residuItems = (resResidu.data?.data || []).map((s: any) => ({
          ...s,
          _source_lembaga: entry.label,
          isResidu: true,
        }));
        accumulated = mergeVervalStudents(accumulated, residuItems);
        addVervalLog(`(${i + 1}/${validEntries.length}) [${entry.label}] Residu: +${residuItems.length} santri. (Total terkumpul: ${accumulated.length})`);
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Gagal menghubungi VervalPD';
        addVervalLog(`(${i + 1}/${validEntries.length}) [${entry.label}] Gagal: ${msg}`);
      }
    }

    setVervalStudents(accumulated);
    setVervalLoading(false);
    addVervalLog(`✅ Penarikan Verval selesai! Total ${accumulated.length} siswa terkumpul dari semua lembaga.`);
    showToast('success', `Berhasil menarik total ${accumulated.length} siswa VervalPD dari semua lembaga.`);
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

  // --- Otomatis Muat Hasil Audit Terakhir dari Database saat Halaman Dibuka ---
  useEffect(() => {
    const loadLatestAudit = async () => {
      try {
        const res = await apiClient.get('/formal/emis/latest');
        if (res.data?.data && res.data.data.students?.length > 0) {
          setReconData(res.data.data);
        }
      } catch {
        // Abaikan jika belum ada audit yang tersimpan sebelumnya
      }
    };
    loadLatestAudit();
  }, []);

  // --- Buka Modal Riwayat Audit ---
  const handleOpenHistory = async () => {
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await apiClient.get('/formal/emis/history');
      setHistoryList(res.data?.data || []);
    } catch {
      showToast('error', 'Gagal memuat riwayat sesi audit dari database.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // --- Muat Snapshot dari Riwayat Tertentu ---
  const handleSelectHistoryBatch = async (batchId: string) => {
    setReconLoading(true);
    try {
      const res = await apiClient.get(`/formal/emis/history/${batchId}`);
      if (res.data?.data) {
        setReconData(res.data.data);
        setActiveTab('komparasi');
        setHistoryModalOpen(false);
        showToast('success', `Snapshot audit #${batchId.slice(0, 8)} berhasil dimuat.`);
      }
    } catch {
      showToast('error', 'Gagal memuat detail snapshot audit.');
    } finally {
      setReconLoading(false);
    }
  };

  // --- Jalankan Komparasi dengan Database eSantri ---
  const handleRunReconcile = async () => {
    setReconLoading(true);
    try {
      // Optimasi payload: Hanya kirim atribut yang dibutuhkan algoritma pemadanan untuk mencegah payload terlalu besar
      const slimEmis = (emisStudents || []).map((s) => ({
        id: s.id || s._emis_id || '',
        nik: s.nik || s.list_nik || s.identity_number || s.no_identitas || s.no_kk || '',
        nisn: s.nisn || s.list_nisn || '',
        full_name: s.full_name || s.nama || s.list_full_name || '',
        birth_place: s.birth_place || s.tempat_lahir || s.list_birth_place || '',
        birth_date: s.birth_date || s.tanggal_lahir || s.list_birth_date || '',
        gender: s.gender || s.jenis_kelamin || '',
        tingkat: s.tingkat || s.la_study_group_name || s.study_group_name || s.rombel || s._parsed_rombel || '',
        _source_lembaga: s._source_lembaga || '',
      }));

      const slimVerval = (vervalStudents || []).map((v) => ({
        pesertaDidikId: v.pesertaDidikId || v.id || '',
        nik: v.nik || '',
        nisn: v.nisn || '',
        nama: v.nama || '',
        tempatLahir: v.tempatLahir || '',
        tanggalLahir: v.tanggalLahir || '',
        namaIbuKandung: v.namaIbuKandung || '',
        jenisKelamin: v.jenisKelamin || '',
        isResidu: Boolean(v.isResidu),
        residuDetail: v.residuDetail || null,
      }));

      const res = await apiClient.post('/formal/emis/reconcile', {
        emisStudents: slimEmis,
        vervalStudents: slimVerval,
      });
      setReconData(res.data?.data);
      setActiveTab('komparasi');
      showToast('success', 'Komparasi data selesai dan berhasil disimpan permanen ke database!');
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
              onClick={handleOpenHistory}
              disabled={reconLoading || historyLoading}
              className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              title="Lihat riwayat snapshot audit yang tersimpan di database"
            >
              <History className="w-4 h-4 mr-2 text-slate-600" />
              Riwayat Audit DB
            </button>
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

        {/* Banner Snapshot Database */}
        {reconData?.batchId && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 text-xs">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold">Hasil Audit Tersimpan di Database:</span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-medium">
                Batch #{reconData.batchId.slice(0, 8)}
              </span>
              {reconData.executedAt && (
                <span className="text-emerald-700 hidden sm:inline">
                  • {new Date(reconData.executedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              )}
            </div>
            <button
              onClick={handleOpenHistory}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer"
            >
              Buka Riwayat Sesi Lain
            </button>
          </div>
        )}

        {/* Banner Keamanan Data */}
        <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 leading-relaxed">
            <div>
              <strong>Keamanan Data Terjamin:</strong> Modul ini bekerja murni secara <em>read-only</em> terhadap data pokok santri eSantri.
            </div>
            <div className="mt-1 text-blue-700">
              💡 <strong>Smart Snapshot Merge Aktif:</strong> Jika Anda menarik EMIS dan VervalPD pada hari/sesi yang berbeda, sistem secara otomatis mempertahankan dan menggabungkan data dari sesi sebelumnya, sehingga hasil komparasi kedua sumber tetap utuh dan tidak saling menghilangkan.
            </div>
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

          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Daftar Token Sekolah / Lembaga EMIS ({tokenEntries.length} Lembaga)
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Masukkan Bearer Token untuk masing-masing sekolah/jenjang (misal: Ulya, Wustha, Cabang) agar data dapat digabungkan.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTokenEntry}
                className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tambah Sekolah
              </button>
            </div>

            {/* List of Token Rows */}
            <div className="space-y-2.5">
              {tokenEntries.map((entry, idx) => (
                <div key={entry.id} className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Sekolah #{idx + 1}
                    </span>
                    {tokenEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTokenEntry(entry.id)}
                        className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        title="Hapus token sekolah ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nama Lembaga (misal: PDF Ulya)"
                      value={entry.label}
                      onChange={(e) => handleUpdateTokenEntry(entry.id, 'label', e.target.value)}
                      className="w-full sm:w-52 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="relative flex-1">
                      <input
                        type={showTokenMap[entry.id] ? 'text' : 'password'}
                        placeholder="Bearer Token EMIS (eyJhbGciOiJIUz...)"
                        value={entry.token}
                        onChange={(e) => handleUpdateTokenEntry(entry.id, 'token', e.target.value)}
                        className="w-full px-3 py-1.5 pr-8 text-xs border border-slate-300 rounded-lg bg-white font-mono focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTokenMap((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                        title={showTokenMap[entry.id] ? 'Sembunyikan Token' : 'Tampilkan Token'}
                      >
                        {showTokenMap[entry.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFetchSingleToken(entry)}
                      disabled={emisLoading || !entry.token.trim()}
                      className="inline-flex items-center justify-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-40 transition-colors"
                      title={`Tarik data santri khusus dari ${entry.label}`}
                    >
                      {activeEmisFetchId === entry.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          <span>Menarik...</span>
                        </>
                      ) : (
                        <span>Tarik Ini</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions Bar */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFetchAllTokens}
                  disabled={emisLoading}
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${emisLoading ? 'animate-spin' : ''}`} />
                  {emisLoading ? 'Sedang Menarik Data...' : '⚡ Tarik Semua Sekolah Sekaligus'}
                </button>

                {emisStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Kosongkan data santri EMIS yang sudah terkumpul?')) {
                        setEmisStudents([]);
                        showToast('info', 'Data santri EMIS dikosongkan.');
                      }
                    }}
                    className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium cursor-pointer"
                  >
                    Reset Data Terkumpul
                  </button>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAppendMode}
                  onChange={(e) => setIsAppendMode(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Akumulasi (gabungkan santri antar sekolah tanpa menghapus)</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              Tips: Buka portal <strong>emis.kemenag.go.id</strong> untuk tiap sekolah → Login operator → Buka F12 DevTools → Tab Network → Salin token Authorization Bearer masing-masing.
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
                  Pratinjau Data EMIS ({emisStudents.length} Santri Terkumpul dari Berbagai Sekolah)
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
                      <th className="px-3 py-2">Asal Sekolah</th>
                      <th className="px-3 py-2">ID EMIS</th>
                      <th className="px-3 py-2">Nama Santri</th>
                      <th className="px-3 py-2">NISN</th>
                      <th className="px-3 py-2">Tempat, Tanggal Lahir</th>
                      <th className="px-3 py-2">Rombel / Tingkat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {emisStudents.slice(0, 50).map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5">
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-semibold border border-indigo-200">
                            {s._source_lembaga || 'EMIS'}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-slate-400">{s.id || s._emis_id || '-'}</td>
                        <td className="px-3 py-1.5 font-medium text-slate-800">{s.full_name || s.nama || s.list_full_name || '-'}</td>
                        <td className="px-3 py-1.5 font-mono">{s.nisn || s.list_nisn || '-'}</td>
                        <td className="px-3 py-1.5">{s.birth_place || s.tempat_lahir || '-'}, {s.birth_date || s.tanggal_lahir || '-'}</td>
                        <td className="px-3 py-1.5">{s._parsed_rombel || s.tingkat || s.la_study_group_name || s.study_group_name || '-'}</td>
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
              Menarik data verifikasi identitas santri & data residu langsung dari portal resmi VervalPD untuk beberapa sekolah / lembaga.
            </p>
          </div>

          <div className="space-y-4">
            {/* Header List Cookie Sekolah */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Daftar Browser Cookie VervalPD Per Sekolah / Lembaga
                </label>
                <p className="text-xs text-slate-400">
                  Dapat menambahkan beberapa sekolah (misal: PDF Ulya, PDF Wustha, dll.) dan menarik data secara akumulatif.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVervalEntry}
                className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors w-fit"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tambah Sekolah
              </button>
            </div>

            {/* List of Verval Rows */}
            <div className="space-y-2.5">
              {vervalEntries.map((entry, idx) => (
                <div key={entry.id} className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Sekolah #{idx + 1}
                    </span>
                    {vervalEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVervalEntry(entry.id)}
                        className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        title="Hapus cookie sekolah ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nama Lembaga (misal: PDF Ulya)"
                      value={entry.label}
                      onChange={(e) => handleUpdateVervalEntry(entry.id, 'label', e.target.value)}
                      className="w-full sm:w-52 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="relative flex-1">
                      <input
                        type={showCookieMap[entry.id] ? 'text' : 'password'}
                        placeholder="Browser Cookie (ci_session=...; TS01d1a227=...)"
                        value={entry.cookie}
                        onChange={(e) => handleUpdateVervalEntry(entry.id, 'cookie', e.target.value)}
                        className="w-full px-3 py-1.5 pr-8 text-xs border border-slate-300 rounded-lg bg-white font-mono focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCookieMap((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                        title={showCookieMap[entry.id] ? 'Sembunyikan Cookie' : 'Tampilkan Cookie'}
                      >
                        {showCookieMap[entry.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleFetchSingleVerval(entry, 'all')}
                        disabled={vervalLoading || !entry.cookie.trim()}
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors"
                        title={`Tarik Semua (Daftar & Residu) khusus dari ${entry.label}`}
                      >
                        {activeVervalFetch?.id === entry.id && activeVervalFetch?.mode === 'all' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                            <span>Menarik...</span>
                          </>
                        ) : (
                          <span>Tarik Semua</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFetchSingleVerval(entry, 'daftar')}
                        disabled={vervalLoading || !entry.cookie.trim()}
                        className="inline-flex items-center justify-center px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40 transition-colors"
                        title={`Tarik hanya Daftar Siswa dari ${entry.label}`}
                      >
                        {activeVervalFetch?.id === entry.id && activeVervalFetch?.mode === 'daftar' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                            <span>Daftar...</span>
                          </>
                        ) : (
                          <span>Daftar</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFetchSingleVerval(entry, 'residu')}
                        disabled={vervalLoading || !entry.cookie.trim()}
                        className="inline-flex items-center justify-center px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40 transition-colors"
                        title={`Tarik hanya Residu dari ${entry.label}`}
                      >
                        {activeVervalFetch?.id === entry.id && activeVervalFetch?.mode === 'residu' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                            <span>Residu...</span>
                          </>
                        ) : (
                          <span>Residu</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions Bar */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFetchAllVerval}
                  disabled={vervalLoading}
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${vervalLoading ? 'animate-spin' : ''}`} />
                  {vervalLoading ? 'Sedang Menarik Data...' : '⚡ Tarik Semua Sekolah Sekaligus'}
                </button>

                {vervalStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Kosongkan data siswa VervalPD yang sudah terkumpul?')) {
                        setVervalStudents([]);
                        showToast('info', 'Data siswa VervalPD dikosongkan.');
                      }
                    }}
                    className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium cursor-pointer"
                  >
                    Reset Data Terkumpul
                  </button>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isVervalAppendMode}
                  onChange={(e) => setIsVervalAppendMode(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Akumulasi (gabungkan santri antar sekolah tanpa menghapus)</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              Tips: Buka <strong>vervalpd.data.kemendikdasmen.go.id</strong> untuk tiap sekolah → Login operator → Tekan F12 → Application → Cookies → Salin nilai Cookie yang aktif.
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
                  Pratinjau Data VervalPD ({vervalStudents.length} Siswa Terkumpul dari Berbagai Sekolah
                  {vervalStudents.length > 50 ? ' — Menampilkan 50 data teratas' : ''})
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
                      <th className="px-3 py-2">Asal Sekolah</th>
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
                        <td className="px-3 py-1.5">
                          <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded font-semibold border border-blue-200">
                            {s._source_lembaga || 'VervalPD'}
                          </span>
                        </td>
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

      {/* MODAL RIWAYAT SNAPSHOT AUDIT DATABASE */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Riwayat Snapshot Audit Database</h3>
                  <p className="text-xs text-slate-500">Daftar sesi komparasi data santri yang tersimpan di PostgreSQL</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {historyLoading ? (
                <div className="py-12 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                  <span>Memuat riwayat sesi audit...</span>
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Belum ada riwayat komparasi yang tersimpan di database. Silakan jalankan komparasi pertama Anda.
                </div>
              ) : (
                historyList.map((h: any) => {
                  const isCurrent = reconData?.batchId === h.id;
                  const execDate = new Date(h.executedAt).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  });
                  return (
                    <div
                      key={h.id}
                      className={`border rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            #{h.id.slice(0, 8)}
                          </span>
                          <span className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {execDate}
                          </span>
                          {isCurrent && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                              Sedang Aktif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap pt-1">
                          <span>Total: <strong>{h.totalSantriEsantri}</strong></span>
                          <span className="text-emerald-700">EMIS: <strong>{h.totalTerdaftarEmis}</strong></span>
                          <span className="text-blue-700">Verval OK: <strong>{h.totalVervalOk}</strong></span>
                          <span className="text-amber-700">Residu: <strong>{h.totalResiduVerval}</strong></span>
                          {h.totalButuhTindakan > 0 && (
                            <span className="text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              Tindak Lanjut: {h.totalButuhTindakan}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleSelectHistoryBatch(h.id)}
                          disabled={reconLoading || isCurrent}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 ${
                            isCurrent
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                          }`}
                        >
                          {isCurrent ? 'Snapshot Aktif' : 'Buka Snapshot'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
