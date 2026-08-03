import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { 
  Plus, Edit2, CheckCircle, XCircle, Loader2, Trash2, School, Search, User, FileText, Eye, EyeOff, Upload,
  Building2, Users, FileCheck, Shield, Award, FolderOpen, ExternalLink, Key, Lock, MapPin, Calendar
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';

interface SantriBreakdownGender {
  l: number;
  p: number;
  total: number;
}

interface LembagaMuadalah {
  id: string;
  name: string;
  code: string;
  npsn?: string;
  nspp?: string;
  pesantrenInduk?: string;
  tahunBerdiri?: string;
  namaKetua?: string;
  operator?: string;
  emisPontren?: string;
  emisPontrenPass?: string;
  emisSpm?: string;
  emisSpmPass?: string;
  ttdKetua?: string;
  skSpm?: string;
  skStruktur?: string;
  skDewanMasyayikh?: string;
  skPengangkatanKepalaSpm?: string;
  isActive: boolean;
  namaLain?: string;
  jenjang?: string;
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  kelurahan?: string;
  alamatDetail?: string;
  kelas?: { 
    id: string; 
    name: string; 
    tingkat?: string;
    cabang?: {
      id: string;
      name: string;
      wilayah?: {
        id: string;
        name: string;
      }
    }
  }[];
  jumlahSantri?: {
    wustha: {
      tingkat7: SantriBreakdownGender;
      tingkat8: SantriBreakdownGender;
      tingkat9: SantriBreakdownGender;
      total: SantriBreakdownGender;
    };
    ulya: {
      tingkat10: SantriBreakdownGender;
      tingkat11: SantriBreakdownGender;
      tingkat12: SantriBreakdownGender;
      total: SantriBreakdownGender;
    };
    totalL: number;
    totalP: number;
    totalAll: number;
  };
}

type SubTab = 'identitas' | 'jumlah_santri' | 'berkas';

export default function LembagaMuadalahPage() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('identitas');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();

  // RBAC Access Control Flags
  const isAdmin = user?.scope === 'GLOBAL';
  const isWilayahOrAdmin = user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMuadalah, setEditingMuadalah] = useState<LembagaMuadalah | null>(null);

  // Form password visibility toggles
  const [showEmisPontrenPass, setShowEmisPontrenPass] = useState(false);
  const [showEmisSpmPass, setShowEmisSpmPass] = useState(false);

  // Profile modal password visibility toggles
  const [showProfilePontrenPass, setShowProfilePontrenPass] = useState(false);
  const [showProfileSpmPass, setShowProfileSpmPass] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    code: '', 
    npsn: '', 
    nspp: '', 
    pesantrenInduk: '',
    tahunBerdiri: '',
    namaKetua: '', 
    operator: '',
    emisPontren: '',
    emisPontrenPass: '',
    emisSpm: '',
    emisSpmPass: '',
    ttdKetua: '', 
    skSpm: '', 
    skStruktur: '',
    skDewanMasyayikh: '',
    skPengangkatanKepalaSpm: '',
    isActive: true,
    namaLain: '',
    jenjang: 'WUSTHA',
    provinsi: '',
    kabupaten: '',
    kecamatan: '',
    kelurahan: '',
    alamatDetail: '',
  });
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [muadalahToDelete, setMuadalahToDelete] = useState<string | null>(null);

  // Profile modal and tab states
  const [selectedProfileMuadalah, setSelectedProfileMuadalah] = useState<LembagaMuadalah | null>(null);
  const [profileTab, setProfileTab] = useState<'info' | 'kelas'>('info');

  // Uploading states per document type
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Filter states
  const [filterName, setFilterName] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');

  // Address API States (Emsifa)
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const [alamatProvId, setAlamatProvId] = useState('');
  const [alamatKabId, setAlamatKabId] = useState('');
  const [alamatKecId, setAlamatKecId] = useState('');
  const [alamatKelId, setAlamatKelId] = useState('');

  // Fetch provinces on load
  React.useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((r) => r.json())
      .then((data) => setProvinces(data))
      .catch((e) => console.error('Gagal mengambil data provinsi', e));
  }, []);

  React.useEffect(() => {
    if (alamatProvId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${alamatProvId}.json`)
        .then((r) => r.json())
        .then((data) => setRegencies(data))
        .catch((e) => console.error('Gagal mengambil data kabupaten', e));
    } else {
      setRegencies([]);
    }
  }, [alamatProvId]);

  React.useEffect(() => {
    if (alamatKabId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${alamatKabId}.json`)
        .then((r) => r.json())
        .then((data) => setDistricts(data))
        .catch((e) => console.error('Gagal mengambil data kecamatan', e));
    } else {
      setDistricts([]);
    }
  }, [alamatKabId]);

  React.useEffect(() => {
    if (alamatKecId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${alamatKecId}.json`)
        .then((r) => r.json())
        .then((data) => setVillages(data))
        .catch((e) => console.error('Gagal mengambil data kelurahan', e));
    } else {
      setVillages([]);
    }
  }, [alamatKecId]);

  const { data: list = [], isLoading } = useQuery<LembagaMuadalah[]>({
    queryKey: ['lembaga-muadalah'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/muadalah');
      return res.data;
    }
  });

  const getFullFileUrl = (relativeUrl?: string) => {
    if (!relativeUrl) return '';
    const baseURL = apiClient.defaults.baseURL || '/api/v1';
    const token = localStorage.getItem('token') || '';
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${baseURL}${relativeUrl}${query}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof typeof formData) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fieldName === 'ttdKetua' && file.type !== 'image/png') {
      showToast('error', 'Format file tanda tangan harus PNG transparan');
      return;
    }

    setUploadingField(fieldName as string);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/formal/muadalah/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData((prev) => ({ ...prev, [fieldName]: res.data.url }));
      showToast('success', 'Dokumen berhasil diunggah');
    } catch (err: any) {
      showToast('error', 'Gagal mengunggah file: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingField(null);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/formal/muadalah', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembaga-muadalah'] });
      setIsModalOpen(false);
      showToast('success', 'Lembaga Muadalah berhasil ditambahkan');
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menyimpan data');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.put(`/formal/muadalah/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembaga-muadalah'] });
      setIsModalOpen(false);
      showToast('success', 'Data Lembaga Muadalah berhasil diperbarui');
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal mengubah data');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (data: { id: string; isActive: boolean }) => {
      await apiClient.patch(`/formal/muadalah/${data.id}/status`, { isActive: data.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembaga-muadalah'] });
      showToast('success', 'Status lembaga berhasil diubah');
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal mengubah status');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/formal/muadalah/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembaga-muadalah'] });
      showToast('success', 'Lembaga Muadalah berhasil dihapus');
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menghapus data');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMuadalah) {
      updateMutation.mutate({ 
        id: editingMuadalah.id, 
        ...formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openAddModal = () => {
    setEditingMuadalah(null);
    setShowEmisPontrenPass(false);
    setShowEmisSpmPass(false);
    setFormData({ 
      name: '', 
      code: '', 
      npsn: '', 
      nspp: '', 
      pesantrenInduk: '',
      tahunBerdiri: '',
      namaKetua: '', 
      operator: '',
      emisPontren: '',
      emisPontrenPass: '',
      emisSpm: '',
      emisSpmPass: '',
      ttdKetua: '', 
      skSpm: '', 
      skStruktur: '',
      skDewanMasyayikh: '',
      skPengangkatanKepalaSpm: '',
      isActive: true,
      namaLain: '',
      jenjang: 'WUSTHA',
      provinsi: '',
      kabupaten: '',
      kecamatan: '',
      kelurahan: '',
      alamatDetail: '',
    });
    setAlamatProvId('');
    setAlamatKabId('');
    setAlamatKecId('');
    setAlamatKelId('');
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    setIsModalOpen(true);
  };

  const openEditModal = async (item: LembagaMuadalah) => {
    setEditingMuadalah(item);
    setShowEmisPontrenPass(false);
    setShowEmisSpmPass(false);
    setFormData({ 
      name: item.name, 
      code: item.code, 
      npsn: item.npsn || '', 
      nspp: item.nspp || '', 
      pesantrenInduk: item.pesantrenInduk || '',
      tahunBerdiri: item.tahunBerdiri || '',
      namaKetua: item.namaKetua || '', 
      operator: item.operator || '',
      emisPontren: item.emisPontren || '',
      emisPontrenPass: item.emisPontrenPass || '',
      emisSpm: item.emisSpm || '',
      emisSpmPass: item.emisSpmPass || '',
      ttdKetua: item.ttdKetua || '', 
      skSpm: item.skSpm || '', 
      skStruktur: item.skStruktur || '',
      skDewanMasyayikh: item.skDewanMasyayikh || '',
      skPengangkatanKepalaSpm: item.skPengangkatanKepalaSpm || '',
      isActive: item.isActive,
      namaLain: item.namaLain || '',
      jenjang: item.jenjang || 'WUSTHA',
      provinsi: item.provinsi || '',
      kabupaten: item.kabupaten || '',
      kecamatan: item.kecamatan || '',
      kelurahan: item.kelurahan || '',
      alamatDetail: item.alamatDetail || '',
    });

    setAlamatProvId('');
    setAlamatKabId('');
    setAlamatKecId('');
    setAlamatKelId('');

    if (item.provinsi) {
      const pMatch = provinces.find(p => p.name.toUpperCase() === item.provinsi?.toUpperCase());
      if (pMatch) {
        setAlamatProvId(pMatch.id);
        try {
          const regRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${pMatch.id}.json`);
          const regData = await regRes.json();
          setRegencies(regData);
          
          if (item.kabupaten) {
            const kMatch = regData.find((r: any) => r.name.toUpperCase() === item.kabupaten?.toUpperCase());
            if (kMatch) {
              setAlamatKabId(kMatch.id);
              
              const distRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${kMatch.id}.json`);
              const distData = await distRes.json();
              setDistricts(distData);
              
              if (item.kecamatan) {
                const kecMatch = distData.find((d: any) => d.name.toUpperCase() === item.kecamatan?.toUpperCase());
                if (kecMatch) {
                  setAlamatKecId(kecMatch.id);
                  
                  const vilRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${kecMatch.id}.json`);
                  const vilData = await vilRes.json();
                  setVillages(vilData);
                  
                  if (item.kelurahan) {
                    const kelMatch = vilData.find((v: any) => v.name.toUpperCase() === item.kelurahan?.toUpperCase());
                    if (kelMatch) {
                      setAlamatKelId(kelMatch.id);
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Gagal memuat detail wilayah saat edit', e);
        }
      }
    }

    setIsModalOpen(true);
  };

  const confirmDelete = (id: string) => {
    setMuadalahToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const executeDelete = () => {
    if (muadalahToDelete) {
      deleteMutation.mutate(muadalahToDelete);
      setIsConfirmModalOpen(false);
      setMuadalahToDelete(null);
    }
  };

  // Filter Logic
  const filteredList = list.filter(item => {
    const matchName = !filterName || 
      item.name.toLowerCase().includes(filterName.toLowerCase()) ||
      item.code.toLowerCase().includes(filterName.toLowerCase()) ||
      (item.namaLain || '').toLowerCase().includes(filterName.toLowerCase());

    const matchJenjang = !filterJenjang || (item.jenjang || '').toUpperCase() === filterJenjang.toUpperCase();

    return matchName && matchJenjang;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* ── HEADER HALAMAN ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <School className="w-6 h-6 text-indigo-600" /> Manajemen Lembaga Muadalah
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data identitas kelembagaan SPM/Muadalah, akun EMIS, statistik santri, dan dokumen berkas legalitas.
          </p>
        </div>

        {/* RBAC Action Button */}
        {isWilayahOrAdmin && (
          <button 
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent shadow-xs text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Lembaga Muadalah
          </button>
        )}
      </div>

      {/* ── SUB-TABS NAVIGATION (Identitas Lembaga, Jumlah Santri, Berkas) ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          
          {/* Sub-Tab Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setActiveSubTab('identitas')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'identitas'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Identitas Lembaga
            </button>

            <button
              onClick={() => setActiveSubTab('jumlah_santri')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'jumlah_santri'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Jumlah Santri
            </button>

            <button
              onClick={() => setActiveSubTab('berkas')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'berkas'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" /> Berkas Dokumen
            </button>
          </div>

          {/* Search & Filter Inputs */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari lembaga / kode..."
                value={filterName}
                onChange={e => { setFilterName(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <select
              value={filterJenjang}
              onChange={e => { setFilterJenjang(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            >
              <option value="">-- Semua Jenjang --</option>
              <option value="WUSTHA">WUSTHA</option>
              <option value="ULYA">ULYA</option>
              <option value="ULA">ULA</option>
            </select>
          </div>
        </div>

        {/* ── TABLE CONTAINER (Dynamic per SubTab) ── */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              {/* ── SUB-TAB 1: IDENTITAS LEMBAGA HEADER ── */}
              {activeSubTab === 'identitas' && (
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">No</th>
                    <th className="py-3 px-3">Nama Lembaga</th>
                    <th className="py-3 px-3">Pesantren Induk</th>
                    <th className="py-3 px-3 text-center">Jenjang</th>
                    <th className="py-3 px-3 text-center">Tahun Berdiri</th>
                    <th className="py-3 px-3">Kepala SPM</th>
                    <th className="py-3 px-3">Operator</th>
                    <th className="py-3 px-3 text-center">EMIS Pontren</th>
                    <th className="py-3 px-3 text-center">EMIS SPM</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
              )}

              {/* ── SUB-TAB 2: JUMLAH SANTRI HEADER (Nested) ── */}
              {activeSubTab === 'jumlah_santri' && (
                <thead className="bg-slate-50/90 text-slate-600 font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th rowSpan={3} className="py-3 px-2 text-center border-r border-slate-200 w-10">No</th>
                    <th rowSpan={3} className="py-3 px-3 border-r border-slate-200 min-w-[180px]">Nama Lembaga</th>
                    <th rowSpan={3} className="py-3 px-2 text-center border-r border-slate-200 w-16">Jenjang</th>
                    <th colSpan={6} className="py-1.5 px-2 text-center border-r border-slate-200 bg-indigo-50/60 text-indigo-900 uppercase">Wustha</th>
                    <th colSpan={6} className="py-1.5 px-2 text-center border-r border-slate-200 bg-emerald-50/60 text-emerald-900 uppercase">Ulya</th>
                    <th colSpan={3} className="py-1.5 px-2 text-center border-r border-slate-200 bg-slate-100 uppercase">Total Santri</th>
                    <th rowSpan={3} className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                  <tr>
                    <th colSpan={2} className="py-1 px-1 text-center border-r border-b border-slate-200 bg-indigo-50/40">Tingkat 7</th>
                    <th colSpan={2} className="py-1 px-1 text-center border-r border-b border-slate-200 bg-indigo-50/40">Tingkat 8</th>
                    <th colSpan={2} className="py-1 px-1 text-center border-r border-b border-slate-200 bg-indigo-50/40">Tingkat 9</th>
                    <th colSpan={2} className="py-1 px-1 text-center border-r border-b border-slate-200 bg-emerald-50/40">Tingkat 10</th>
                    <th colSpan={2} className="py-1 px-1 text-center border-r border-b border-slate-200 bg-emerald-50/40">Tingkat 11</th>
                    <th colSpan={2} className="py-1 px-1 text-center border-r border-b border-slate-200 bg-emerald-50/40">Tingkat 12</th>
                    <th rowSpan={2} className="py-1 px-2 text-center border-r border-slate-200 bg-slate-100 font-bold">L</th>
                    <th rowSpan={2} className="py-1 px-2 text-center border-r border-slate-200 bg-slate-100 font-bold">P</th>
                    <th rowSpan={2} className="py-1 px-2 text-center border-r border-slate-200 bg-slate-100 font-bold">Total</th>
                  </tr>
                  <tr>
                    <th className="py-1 px-1 text-center border-r border-slate-200 text-[10px]">L</th>
                    <th className="py-1 px-1 text-center border-r border-slate-200 text-[10px]">P</th>
                    <th className="py-1 px-1 text-center border-r border-slate-200 text-[10px]">L</th>
                    <th className="py-1 px-1 text-center border-r border-slate-200 text-[10px]">P</th>
                    <th className="py-1 px-1 text-center border-r border-slate-200 text-[10px]">L</th>
                    <th className="py-1 px-1 text-center border-r border-slate-200 text-[10px]">P</th>
                    <th className="py-1 px-1 text-center border-r border-slate-200 text-[10px]">L</th>
                    <th className="py-1 px-1 text-center border-r border-slate-200 text-[10px]">P</th>
                    <th className="py-1 px-1 text-center border-r border-slate-200 text-[10px]">L</th>
                    <th className="py-1 px-1 text-center border-r border-slate-200 text-[10px]">P</th>
                    <th className="py-1 px-1 text-center border-r border-slate-200 text-[10px]">L</th>
                    <th className="py-1 px-1 text-center border-r border-slate-200 text-[10px]">P</th>
                  </tr>
                </thead>
              )}

              {/* ── SUB-TAB 3: BERKAS HEADER ── */}
              {activeSubTab === 'berkas' && (
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-3">Nama Lembaga</th>
                    <th className="py-3 px-3 text-center">SK Pendirian SPM</th>
                    <th className="py-3 px-3 text-center">Struktur Organisasi</th>
                    <th className="py-3 px-3 text-center">SK Dewan Masyayikh</th>
                    <th className="py-3 px-3 text-center">SK Pengangkatan Kepala SPM</th>
                    <th className="py-3 px-3 text-center">TTD Kepala SPM</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
              )}

              <tbody className="divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada data lembaga muadalah yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredList
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((item, idx) => {
                      const rowNo = (currentPage - 1) * itemsPerPage + idx + 1;
                      const js = item.jumlahSantri;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-2 text-center text-slate-400 font-medium">{rowNo}</td>

                          {/* NAMA LEMBAGA */}
                          <td className="py-3.5 px-3 font-semibold text-slate-800">
                            <button
                              onClick={() => { setSelectedProfileMuadalah(item); setProfileTab('info'); }}
                              className="hover:text-indigo-600 text-left font-bold transition-colors cursor-pointer"
                            >
                              {item.name}
                            </button>
                            {activeSubTab === 'identitas' && (
                              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                NPSN: <span className="font-bold text-slate-700">{item.npsn || '-'}</span>
                              </p>
                            )}
                          </td>

                          {/* ── SUB-TAB 1: IDENTITAS BODY ── */}
                          {activeSubTab === 'identitas' && (
                            <>
                              <td className="py-3.5 px-3 text-slate-700 font-medium">
                                <p className="font-semibold text-slate-800">{item.pesantrenInduk || '-'}</p>
                                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                  NSPP: <span className="font-bold text-slate-700">{item.nspp || '-'}</span>
                                </p>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {item.jenjang || 'WUSTHA'}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center text-slate-700 font-medium">{item.tahunBerdiri || '-'}</td>
                              <td className="py-3.5 px-3 text-slate-700 font-medium">{item.namaKetua || '-'}</td>
                              <td className="py-3.5 px-3 text-slate-700 font-medium">{item.operator || '-'}</td>
                              <td className="py-3.5 px-3 text-center font-semibold text-slate-700">{item.emisPontren || '-'}</td>
                              <td className="py-3.5 px-3 text-center font-semibold text-slate-700">{item.emisSpm || '-'}</td>
                              <td className="py-3.5 px-3 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${item.isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                                  {item.isActive ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </td>
                            </>
                          )}

                          {/* ── SUB-TAB 2: JUMLAH SANTRI BODY ── */}
                          {activeSubTab === 'jumlah_santri' && (
                            <>
                              <td className="py-3.5 px-2 text-center font-bold text-slate-700">{item.jenjang || 'WUSTHA'}</td>
                              
                              {/* WUSTHA T7, T8, T9 */}
                              <td className="py-3.5 px-1 text-center font-semibold text-slate-700 border-r border-slate-100">{js?.wustha.tingkat7.l || 0}</td>
                              <td className="py-3.5 px-1 text-center font-semibold text-slate-700 border-r border-slate-100">{js?.wustha.tingkat7.p || 0}</td>
                              <td className="py-3.5 px-1 text-center font-semibold text-slate-700 border-r border-slate-100">{js?.wustha.tingkat8.l || 0}</td>
                              <td className="py-3.5 px-1 text-center font-semibold text-slate-700 border-r border-slate-100">{js?.wustha.tingkat8.p || 0}</td>
                              <td className="py-3.5 px-1 text-center font-semibold text-slate-700 border-r border-slate-100">{js?.wustha.tingkat9.l || 0}</td>
                              <td className="py-3.5 px-1 text-center font-semibold text-slate-700 border-r border-slate-200">{js?.wustha.tingkat9.p || 0}</td>

                              {/* ULYA T10, T11, T12 */}
                              <td className="py-3.5 px-1 text-center font-semibold text-slate-700 border-r border-slate-100">{js?.ulya.tingkat10.l || 0}</td>
                              <td className="py-3.5 px-1 text-center font-semibold text-slate-700 border-r border-slate-100">{js?.ulya.tingkat10.p || 0}</td>
                              <td className="py-3.5 px-1 text-center font-semibold text-slate-700 border-r border-slate-100">{js?.ulya.tingkat11.l || 0}</td>
                              <td className="py-3.5 px-1 text-center font-semibold text-slate-700 border-r border-slate-100">{js?.ulya.tingkat11.p || 0}</td>
                              <td className="py-3.5 px-1 text-center font-semibold text-slate-700 border-r border-slate-100">{js?.ulya.tingkat12.l || 0}</td>
                              <td className="py-3.5 px-1 text-center font-semibold text-slate-700 border-r border-slate-200">{js?.ulya.tingkat12.p || 0}</td>

                              {/* TOTAL L, P, ALL */}
                              <td className="py-3.5 px-2 text-center font-bold text-indigo-700 bg-indigo-50/20">{js?.totalL || 0}</td>
                              <td className="py-3.5 px-2 text-center font-bold text-emerald-700 bg-emerald-50/20">{js?.totalP || 0}</td>
                              <td className="py-3.5 px-2 text-center font-extrabold text-slate-900 bg-slate-100/50">{js?.totalAll || 0}</td>
                            </>
                          )}

                          {/* ── SUB-TAB 3: BERKAS DOKUMEN BODY ── */}
                          {activeSubTab === 'berkas' && (
                            <>
                              <td className="py-3.5 px-3 text-center">
                                {item.skSpm ? (
                                  <a href={getFullFileUrl(item.skSpm)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-100">
                                    <FileCheck className="w-3 h-3 text-indigo-600" /> Terupload
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">Belum Ada</span>
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                {item.skStruktur ? (
                                  <a href={getFullFileUrl(item.skStruktur)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-100">
                                    <FileCheck className="w-3 h-3 text-indigo-600" /> Terupload
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">Belum Ada</span>
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                {item.skDewanMasyayikh ? (
                                  <a href={getFullFileUrl(item.skDewanMasyayikh)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-100">
                                    <FileCheck className="w-3 h-3 text-indigo-600" /> Terupload
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">Belum Ada</span>
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                {item.skPengangkatanKepalaSpm ? (
                                  <a href={getFullFileUrl(item.skPengangkatanKepalaSpm)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-100">
                                    <FileCheck className="w-3 h-3 text-indigo-600" /> Terupload
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">Belum Ada</span>
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                {item.ttdKetua ? (
                                  <a href={getFullFileUrl(item.ttdKetua)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-100">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" /> PNG Ready
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">Belum Ada</span>
                                )}
                              </td>
                            </>
                          )}

                          {/* ── ACTION BUTTONS WITH RBAC ── */}
                          <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => { setSelectedProfileMuadalah(item); setProfileTab('info'); }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Lihat Profil Muadalah"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* RBAC: Edit & Toggle Status available for Wilayah & Admin */}
                            {isWilayahOrAdmin && (
                              <>
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                                  title="Edit Lembaga"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => toggleStatusMutation.mutate({ id: item.id, isActive: !item.isActive })}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${item.isActive ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}
                                  title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                >
                                  {item.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                </button>
                              </>
                            )}

                            {/* RBAC: Delete only available for Admin Pusat */}
                            {isAdmin && (
                              <button
                                onClick={() => confirmDelete(item.id)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                title="Hapus Lembaga"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <Pagination 
          currentPage={currentPage} 
          totalPages={Math.ceil((filteredList.length || 0) / itemsPerPage)} 
          onPageChange={setCurrentPage} 
          totalItems={filteredList.length || 0} 
          itemsPerPage={itemsPerPage} 
        />
      </div>

      {/* ── MODAL TAMBAH / EDIT LEMBAGA ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
                  <School className="w-4 h-4" /> Kelola Kelembagaan
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingMuadalah ? 'Edit Data Lembaga Muadalah' : 'Tambah Lembaga Muadalah Baru'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
              {/* SECTION 1: IDENTITAS KELEMBAGAAN */}
              <div>
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">1. Identitas Utama & Akun EMIS</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Lembaga *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="Pondok Modern Darussalam Gontor"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Kode Singkatan / Singkat *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="GONTOR"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Lain / Alias</label>
                    <input
                      type="text"
                      value={formData.namaLain}
                      onChange={(e) => setFormData({ ...formData, namaLain: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="KMI Gontor"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Jenjang Pendidikan *</label>
                    <select
                      required
                      value={formData.jenjang}
                      onChange={(e) => setFormData({ ...formData, jenjang: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      <option value="WUSTHA">WUSTHA (SMP/MTs Equivalent)</option>
                      <option value="ULYA">ULYA (SMA/MA Equivalent)</option>
                      <option value="ULA">ULA (SD/MI Equivalent)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">NPSN</label>
                    <input
                      type="text"
                      value={formData.npsn}
                      onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="NPSN Lembaga"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">NSPP Pesantren</label>
                    <input
                      type="text"
                      value={formData.nspp}
                      onChange={(e) => setFormData({ ...formData, nspp: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="NSPP Pesantren"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Pesantren Induk</label>
                    <input
                      type="text"
                      value={formData.pesantrenInduk}
                      onChange={(e) => setFormData({ ...formData, pesantrenInduk: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="Pondok Pesantren Pusat"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Tahun Berdiri</label>
                    <input
                      type="text"
                      value={formData.tahunBerdiri}
                      onChange={(e) => setFormData({ ...formData, tahunBerdiri: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="1926"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Kepala SPM / Ketua</label>
                    <input
                      type="text"
                      value={formData.namaKetua}
                      onChange={(e) => setFormData({ ...formData, namaKetua: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="KH. Hasan Abdullah Sahal"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Operator SPM</label>
                    <input
                      type="text"
                      value={formData.operator}
                      onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="Nama Operator"
                    />
                  </div>

                  {/* EMIS Pontren Username */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">EMIS Pontren Username</label>
                    <input
                      type="text"
                      value={formData.emisPontren}
                      onChange={(e) => setFormData({ ...formData, emisPontren: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="Username EMIS Pontren"
                    />
                  </div>

                  {/* EMIS Pontren Password with Eye Toggle */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">EMIS Pontren Password</label>
                    <div className="relative">
                      <input
                        type={showEmisPontrenPass ? 'text' : 'password'}
                        value={formData.emisPontrenPass}
                        onChange={(e) => setFormData({ ...formData, emisPontrenPass: e.target.value })}
                        className="w-full pl-3 pr-10 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmisPontrenPass((v) => !v)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showEmisPontrenPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* EMIS SPM Username */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">EMIS SPM Username</label>
                    <input
                      type="text"
                      value={formData.emisSpm}
                      onChange={(e) => setFormData({ ...formData, emisSpm: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="Username EMIS SPM"
                    />
                  </div>

                  {/* EMIS SPM Password with Eye Toggle */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">EMIS SPM Password</label>
                    <div className="relative">
                      <input
                        type={showEmisSpmPass ? 'text' : 'password'}
                        value={formData.emisSpmPass}
                        onChange={(e) => setFormData({ ...formData, emisSpmPass: e.target.value })}
                        className="w-full pl-3 pr-10 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmisSpmPass((v) => !v)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showEmisSpmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ALAMAT LENGKAP */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">2. Alamat & Wilayah</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Provinsi</label>
                    <select 
                      value={alamatProvId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const name = provinces.find((p) => p.id === id)?.name || '';
                        setAlamatProvId(id);
                        setFormData(prev => ({ ...prev, provinsi: name, kabupaten: '', kecamatan: '', kelurahan: '' }));
                        setAlamatKabId('');
                        setAlamatKecId('');
                        setAlamatKelId('');
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    >
                      <option value="">-- Pilih Provinsi --</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Kabupaten / Kota</label>
                    <select 
                      value={alamatKabId}
                      disabled={!alamatProvId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const name = regencies.find((r) => r.id === id)?.name || '';
                        setAlamatKabId(id);
                        setFormData(prev => ({ ...prev, kabupaten: name, kecamatan: '', kelurahan: '' }));
                        setAlamatKecId('');
                        setAlamatKelId('');
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none disabled:opacity-50"
                    >
                      <option value="">-- Pilih Kabupaten --</option>
                      {regencies.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Kecamatan</label>
                    <select 
                      value={alamatKecId}
                      disabled={!alamatKabId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const name = districts.find((d) => d.id === id)?.name || '';
                        setAlamatKecId(id);
                        setFormData(prev => ({ ...prev, kecamatan: name, kelurahan: '' }));
                        setAlamatKelId('');
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none disabled:opacity-50"
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Kelurahan / Desa</label>
                    <select 
                      value={alamatKelId}
                      disabled={!alamatKecId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const name = villages.find((v) => v.id === id)?.name || '';
                        setAlamatKelId(id);
                        setFormData(prev => ({ ...prev, kelurahan: name }));
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none disabled:opacity-50"
                    >
                      <option value="">-- Pilih Kelurahan --</option>
                      {villages.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Detail Alamat Jalan</label>
                    <input
                      type="text"
                      value={formData.alamatDetail}
                      onChange={(e) => setFormData({ ...formData, alamatDetail: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      placeholder="Jalan Sukarno Hatta No 8"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: UNGGAH DOKUMEN & BERKAS */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">3. Dokumen & Berkas Legalitas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SK Pendirian SPM */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SK Pendirian SPM (PDF/Gambar)</label>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        Pilih File SK SPM
                        <input type="file" accept="application/pdf,image/*" onChange={(e) => handleFileUpload(e, 'skSpm')} className="hidden" />
                      </label>
                      {uploadingField === 'skSpm' && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                      {formData.skSpm && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                    </div>
                  </div>

                  {/* SK Struktur Organisasi */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Struktur Organisasi (PDF/Gambar)</label>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        Pilih File Struktur
                        <input type="file" accept="application/pdf,image/*" onChange={(e) => handleFileUpload(e, 'skStruktur')} className="hidden" />
                      </label>
                      {uploadingField === 'skStruktur' && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                      {formData.skStruktur && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                    </div>
                  </div>

                  {/* SK Dewan Masyayikh */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SK Dewan Masyayikh (PDF/Gambar)</label>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        Pilih File SK Masyayikh
                        <input type="file" accept="application/pdf,image/*" onChange={(e) => handleFileUpload(e, 'skDewanMasyayikh')} className="hidden" />
                      </label>
                      {uploadingField === 'skDewanMasyayikh' && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                      {formData.skDewanMasyayikh && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                    </div>
                  </div>

                  {/* SK Pengangkatan Kepala SPM */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SK Pengangkatan Kepala SPM (PDF/Gambar)</label>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        Pilih SK Kepala SPM
                        <input type="file" accept="application/pdf,image/*" onChange={(e) => handleFileUpload(e, 'skPengangkatanKepalaSpm')} className="hidden" />
                      </label>
                      {uploadingField === 'skPengangkatanKepalaSpm' && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                      {formData.skPengangkatanKepalaSpm && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                    </div>
                  </div>

                  {/* TTD Kepala SPM (PNG) */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">TTD Kepala SPM (Format PNG Transparan)</label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        Pilih Gambar TTD (PNG)
                        <input type="file" accept="image/png" onChange={(e) => handleFileUpload(e, 'ttdKetua')} className="hidden" />
                      </label>
                      {uploadingField === 'ttdKetua' && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                      {formData.ttdKetua && (
                        <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> File PNG Siap
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || !!uploadingField}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 py-2 text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Simpan Data Lembaga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PROFIL LEMBAGA MODAL ENHANCED ── */}
      {selectedProfileMuadalah && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 space-y-0">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
                  {selectedProfileMuadalah.code.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedProfileMuadalah.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Kode: <strong className="text-slate-800">{selectedProfileMuadalah.code}</strong> | Jenjang: <span className="font-bold text-indigo-600">{selectedProfileMuadalah.jenjang || 'WUSTHA'}</span>
                  </p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setSelectedProfileMuadalah(null);
                  setShowProfilePontrenPass(false);
                  setShowProfileSpmPass(false);
                }} 
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* SECTION A: IDENTITAS LEMBAGA */}
              <div>
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> 1. Identitas Utama Kelembagaan
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Nama Lain / Alias</span>
                    <span className="font-bold text-slate-800">{selectedProfileMuadalah.namaLain || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">NPSN</span>
                    <span className="font-bold text-slate-800">{selectedProfileMuadalah.npsn || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">NSPP Pesantren</span>
                    <span className="font-bold text-slate-800">{selectedProfileMuadalah.nspp || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Pesantren Induk</span>
                    <span className="font-bold text-slate-800">{selectedProfileMuadalah.pesantrenInduk || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Tahun Berdiri</span>
                    <span className="font-bold text-slate-800">{selectedProfileMuadalah.tahunBerdiri || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Status Keaktifan</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedProfileMuadalah.isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                      {selectedProfileMuadalah.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Kepala SPM / Ketua</span>
                    <span className="font-bold text-slate-800">{selectedProfileMuadalah.namaKetua || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Operator SPM</span>
                    <span className="font-bold text-slate-800">{selectedProfileMuadalah.operator || '-'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION B: AKUN & KREDENSIAL EMIS */}
              <div>
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Key className="w-4 h-4" /> 2. Kredensial Akun EMIS
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* EMIS Pontren Card */}
                  <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/70 space-y-2">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600" /> EMIS Pontren
                    </span>
                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-500 font-semibold">Username:</p>
                      <p className="font-bold text-slate-900 font-mono text-xs">{selectedProfileMuadalah.emisPontren || '-'}</p>
                    </div>
                    <div className="space-y-1 pt-1 border-t border-indigo-100/60">
                      <p className="text-[11px] text-slate-500 font-semibold">Password:</p>
                      <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-indigo-200/60">
                        <span className="font-bold text-slate-900 font-mono">
                          {showProfilePontrenPass ? (selectedProfileMuadalah.emisPontrenPass || '-') : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowProfilePontrenPass((v) => !v)}
                          className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                        >
                          {showProfilePontrenPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* EMIS SPM Card */}
                  <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/70 space-y-2">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" /> EMIS SPM
                    </span>
                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-500 font-semibold">Username:</p>
                      <p className="font-bold text-slate-900 font-mono text-xs">{selectedProfileMuadalah.emisSpm || '-'}</p>
                    </div>
                    <div className="space-y-1 pt-1 border-t border-emerald-100/60">
                      <p className="text-[11px] text-slate-500 font-semibold">Password:</p>
                      <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-emerald-200/60">
                        <span className="font-bold text-slate-900 font-mono">
                          {showProfileSpmPass ? (selectedProfileMuadalah.emisSpmPass || '-') : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowProfileSpmPass((v) => !v)}
                          className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                        >
                          {showProfileSpmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION C: ALAMAT LENGKAP */}
              <div>
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> 3. Alamat Lengkap
                </h4>
                <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60 text-xs leading-relaxed font-semibold text-slate-800">
                  {selectedProfileMuadalah.alamatDetail && `${selectedProfileMuadalah.alamatDetail}, `}
                  {selectedProfileMuadalah.kelurahan && `${selectedProfileMuadalah.kelurahan}, `}
                  {selectedProfileMuadalah.kecamatan && `${selectedProfileMuadalah.kecamatan}, `}
                  {selectedProfileMuadalah.kabupaten && `${selectedProfileMuadalah.kabupaten}, `}
                  {selectedProfileMuadalah.provinsi && `${selectedProfileMuadalah.provinsi}`}
                  {!selectedProfileMuadalah.provinsi && 'Alamat belum diatur'}
                </div>
              </div>

              {/* SECTION D: BERKAS & TTD */}
              <div>
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4" /> 4. Berkas Legalitas & Tanda Tangan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">SK Pendirian SPM</span>
                    {selectedProfileMuadalah.skSpm ? (
                      <a href={getFullFileUrl(selectedProfileMuadalah.skSpm)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline">
                        Lihat <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : <span className="text-slate-400 italic">Belum Ada</span>}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Struktur Organisasi</span>
                    {selectedProfileMuadalah.skStruktur ? (
                      <a href={getFullFileUrl(selectedProfileMuadalah.skStruktur)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline">
                        Lihat <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : <span className="text-slate-400 italic">Belum Ada</span>}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">SK Dewan Masyayikh</span>
                    {selectedProfileMuadalah.skDewanMasyayikh ? (
                      <a href={getFullFileUrl(selectedProfileMuadalah.skDewanMasyayikh)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline">
                        Lihat <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : <span className="text-slate-400 italic">Belum Ada</span>}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">SK Pengangkatan Kepala</span>
                    {selectedProfileMuadalah.skPengangkatanKepalaSpm ? (
                      <a href={getFullFileUrl(selectedProfileMuadalah.skPengangkatanKepalaSpm)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline">
                        Lihat <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : <span className="text-slate-400 italic">Belum Ada</span>}
                  </div>

                  {selectedProfileMuadalah.ttdKetua && (
                    <div className="sm:col-span-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                      <span className="block text-[11px] font-bold text-slate-500 uppercase">Spesimen Tanda Tangan Kepala SPM</span>
                      <img 
                        src={getFullFileUrl(selectedProfileMuadalah.ttdKetua)} 
                        alt="TTD Ketua" 
                        className="max-h-24 mx-auto object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedProfileMuadalah(null);
                  setShowProfilePontrenPass(false);
                  setShowProfileSpmPass(false);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Tutup Profil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeDelete}
        title="Konfirmasi Hapus Lembaga"
        message="Apakah Anda yakin ingin menghapus Lembaga Muadalah ini? Seluruh data terikat akan berpengaruh."
      />
    </div>
  );
}
