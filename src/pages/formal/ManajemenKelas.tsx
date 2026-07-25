import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useGetCabang, useGetGuru } from '../../features/core_data/hooks/useMasterData';
import { Plus, Edit2, CheckCircle, XCircle, Loader2, Upload, Download, Trash2, Eye, Users, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';
import Papa from 'papaparse';
import ImportKelasModal from './ImportKelasModal';
import KenaikanKelasModal from './KenaikanKelasModal';
import ConfirmModal from '../../components/ConfirmModal';
import GrupDaimiTab from './GrupDaimiTab';
import DetailRombel from './DetailRombel';
import { useToast } from '../../contexts/ToastContext';

interface Cabang {
  id: string;
  name: string;
  wilayahId?: string;
  wilayah?: { name: string };
}

interface LembagaMuadalah {
  id: string;
  name: string;
  code: string;
  isActive?: boolean;
}

interface Kelas {
  id: string;
  name: string;
  tingkat?: string;
  isActive: boolean;
  cabangId?: string;
  cabang?: Cabang;
  lembagaMuadalahId?: string;
  lembagaMuadalah?: LembagaMuadalah;
  tahunAjaran?: string;
  waliKelasId?: string;
  ruangId?: string;
  kurikulum?: string;
  jurusan?: string;
  jenisRombel?: string;
  kapasitas?: number;
  waliKelas?: { id: string; name: string };
  ruang?: { id: string; nama: string };
  _count?: {
    siswaFormal: number;
  };
}

export default function ManajemenKelas() {
  const [activeTab, setActiveTab] = useState<'kelas' | 'grup-daimi'>('kelas');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = user?.scope === 'GLOBAL';
  const isWilayahOrAdmin = user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH';
  const { t } = useTranslation();

  const [selectedKelasForDetail, setSelectedKelasForDetail] = useState<Kelas | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isKenaikanModalOpen, setIsKenaikanModalOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    tingkat: 'Non Muadalah', 
    isActive: true, 
    cabangId: '', 
    lembagaMuadalahId: '',
    tahunAjaran: '2026/2027 Ganjil',
    waliKelasId: '',
    ruangId: '',
    kurikulum: 'Kurikulum Mandiri',
    jurusan: 'AGAMA',
    jenisRombel: 'Kelas',
    kapasitas: 80
  });

  const { data: staffList = [] } = useGetGuru();
  const { data: ruangList = [] } = useQuery<any[]>({
    queryKey: ['sarpras', 'ruang'],
    queryFn: async () => {
      const res = await apiClient.get('/sarpras/ruang');
      return res.data;
    }
  });
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [kelasToDelete, setKelasToDelete] = useState<string | null>(null);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);

  // Filter states
  const [filterMuadalah, setFilterMuadalah] = useState('');
  const [filterWilayah, setFilterWilayah] = useState(user?.scope === 'CABANG' || user?.scope === 'WILAYAH' ? user?.wilayahId || '' : '');
  const [filterCabang, setFilterCabang] = useState(user?.scope === 'CABANG' ? user?.cabangId || '' : '');

  const { data: kelasList, isLoading } = useQuery<Kelas[]>({
    queryKey: ['kelas'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/kelas');
      return res.data;
    }
  });

  const { data: cabangList, isLoading: loadingCabang } = useGetCabang();

  const { data: muadalahList = [] } = useQuery<LembagaMuadalah[]>({
    queryKey: ['lembaga-muadalah'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/muadalah');
      return res.data.filter((m: any) => m.isActive);
    }
  });

  const { data: wilayahs = [] } = useQuery<any[]>({
    queryKey: ['master-data', 'wilayah'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/wilayah');
      return res.data;
    }
  });

  const handleFilterWilayahChange = (wId: string) => {
    setFilterWilayah(wId);
    setFilterCabang('');
    setCurrentPage(1);
  };

  const handleFilterCabangChange = (cId: string) => {
    setFilterCabang(cId);
    setCurrentPage(1);
  };

  const filteredFilterCabangList = cabangList?.filter(c => {
    if (user?.scope === 'CABANG') return c.id === user.cabangId;
    if (user?.scope === 'WILAYAH') return c.wilayahId === user.wilayahId;
    if (filterWilayah) return c.wilayahId === filterWilayah;
    return true;
  }) || [];

  const handleExport = () => {
    if (!kelasList || kelasList.length === 0) {
      showToast('error', 'Tidak ada data untuk diexport');
      return;
    }

    const exportData = filteredKelasList.map((kelas) => ({
      nama_kelas: kelas.name,
      tingkat: kelas.tingkat || '',
      lembaga_muadalah: kelas.lembagaMuadalah?.name || '',
      is_active: kelas.isActive ? 'true' : 'false',
      cabang: kelas.cabang?.name || '',
      wilayah: kelas.cabang?.wilayah?.name || '',
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'data_kelas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiClient.post('/formal/kelas', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.put(`/formal/kelas/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      setIsModalOpen(false);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (data: { id: string, isActive: boolean }) => {
      await apiClient.patch(`/formal/kelas/${data.id}/status`, { isActive: data.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/formal/kelas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      showToast('success', t('common.delete_success') || 'Berhasil dihapus');
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || t('common.delete_failed') || 'Gagal menghapus');
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete('/formal/kelas/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      showToast('success', t('common.delete_success') || 'Berhasil menghapus semua kelas');
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || t('common.delete_failed') || 'Gagal menghapus semua kelas');
    }
  });

  const confirmDelete = (id: string) => {
    setKelasToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteAll = () => {
    setIsConfirmDeleteAllOpen(true);
  };

  const executeDelete = () => {
    if (kelasToDelete) {
      deleteMutation.mutate(kelasToDelete);
      setIsConfirmModalOpen(false);
      setKelasToDelete(null);
    }
  };

  const executeDeleteAll = () => {
    deleteAllMutation.mutate();
    setIsConfirmDeleteAllOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingKelas) {
      updateMutation.mutate({ 
        id: editingKelas.id, 
        name: formData.name, 
        tingkat: formData.tingkat, 
        cabangId: formData.cabangId,
        lembagaMuadalahId: formData.lembagaMuadalahId,
        tahunAjaran: formData.tahunAjaran,
        waliKelasId: formData.waliKelasId,
        ruangId: formData.ruangId,
        kurikulum: formData.kurikulum,
        jurusan: formData.jurusan,
        jenisRombel: formData.jenisRombel,
        kapasitas: formData.kapasitas
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openAddModal = () => {
    setEditingKelas(null);
    setFormData({ 
      name: '', 
      tingkat: 'Non Muadalah', 
      isActive: true, 
      cabangId: user?.scope === 'CABANG' ? (user.cabangId || '') : '',
      lembagaMuadalahId: '',
      tahunAjaran: '2026/2027 Ganjil',
      waliKelasId: '',
      ruangId: '',
      kurikulum: 'Kurikulum Mandiri',
      jurusan: 'AGAMA',
      jenisRombel: 'Kelas',
      kapasitas: 80
    });
    setIsModalOpen(true);
  };

  const openEditModal = (kelas: Kelas) => {
    setEditingKelas(kelas);
    setFormData({ 
      name: kelas.name, 
      tingkat: kelas.tingkat || 'Non Muadalah', 
      isActive: kelas.isActive, 
      cabangId: kelas.cabangId || '',
      lembagaMuadalahId: kelas.lembagaMuadalahId || '',
      tahunAjaran: kelas.tahunAjaran || '2026/2027 Ganjil',
      waliKelasId: kelas.waliKelasId || '',
      ruangId: kelas.ruangId || '',
      kurikulum: kelas.kurikulum || 'Kurikulum Mandiri',
      jurusan: kelas.jurusan || 'AGAMA',
      jenisRombel: kelas.jenisRombel || 'Kelas',
      kapasitas: kelas.kapasitas || 80
    });
    setIsModalOpen(true);
  };

  const filteredKelasList = (kelasList || []).filter((kelas) => {
    if (filterMuadalah && kelas.lembagaMuadalahId !== filterMuadalah) {
      return false;
    }
    if (filterWilayah && kelas.cabang?.wilayahId !== filterWilayah) {
      return false;
    }
    if (filterCabang && kelas.cabangId !== filterCabang) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {selectedKelasForDetail ? (
        <DetailRombel
          kelas={selectedKelasForDetail}
          onClose={() => {
            setSelectedKelasForDetail(null);
            queryClient.invalidateQueries({ queryKey: ['kelas'] });
          }}
          onEdit={(k) => openEditModal(k)}
          onDelete={(id) => {
            confirmDelete(id);
          }}
          isAdmin={isAdmin}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Manajemen Kelas & Grup Daimi</h1>
              <p className="text-sm text-slate-500 mt-1.5">{t('formal.kelas_subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <button 
                  onClick={confirmDeleteAll}
                  className="inline-flex items-center px-4 py-2 border border-red-200 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Semua
                </button>
              )}
              {isWilayahOrAdmin && (
                <>
                  <button 
                    onClick={handleExport}
                    className="inline-flex items-center px-4 py-2 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </button>
                  <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </button>
                  <button 
                    onClick={() => setIsKenaikanModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Kenaikan Kelas
                  </button>
                  <button 
                    onClick={openAddModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Kelas
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-6">
              <button
                onClick={() => setActiveTab('kelas')}
                className={`pb-4 px-1 text-sm font-medium border-b-2 transition-all ${
                  activeTab === 'kelas'
                    ? 'border-indigo-600 text-indigo-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Manajemen Kelas
              </button>
              <button
                onClick={() => setActiveTab('grup-daimi')}
                className={`pb-4 px-1 text-sm font-medium border-b-2 transition-all ${
                  activeTab === 'grup-daimi'
                    ? 'border-indigo-600 text-indigo-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Grup Daimi
              </button>
            </nav>
          </div>

          {activeTab === 'kelas' ? (() => {
            const tingkatCounts: Record<string, number> = {};
            filteredKelasList.forEach(k => {
              const t = k.tingkat || 'Tanpa Tingkat';
              tingkatCounts[t] = (tingkatCounts[t] || 0) + (k._count?.siswaFormal || 0);
            });
            const totalSantri = Object.values(tingkatCounts).reduce((a, b) => a + b, 0);

            return (
              <div className="space-y-6 mt-6">
                {/* Cards: Total Santri menurut Tingkat */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-100 tracking-wide">Total Santri</span>
                      <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-white mt-3">
                      {totalSantri.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {Object.entries(tingkatCounts).map(([tingkat, total]) => (
                    <div key={tingkat} className="group rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-500 truncate" title={tingkat}>
                          {/^\d+$/.test(tingkat) ? `Tingkat ${tingkat}` : tingkat}
                        </span>
                        <div className="w-8 h-8 shrink-0 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 mt-3">
                        <span className="text-2xl font-bold text-slate-800">
                          {total.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">santri</span>
                      </div>
                    </div>
                  ))}
                  {Object.keys(tingkatCounts).length === 0 && (
                    <div className="col-span-full py-4 text-center text-xs font-mono text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      Belum ada data tingkat siswa.
                    </div>
                  )}
                </div>

                {/* Filter Section */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Lembaga Muadalah</label>
                    <select
                      value={filterMuadalah}
                      onChange={e => { setFilterMuadalah(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
                    >
                      <option value="">-- Semua Lembaga --</option>
                      {muadalahList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Wilayah</label>
                    <select
                      value={filterWilayah}
                      onChange={e => handleFilterWilayahChange(e.target.value)}
                      disabled={!isAdmin}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50 disabled:opacity-75"
                    >
                      {isAdmin ? (
                        <>
                          <option value="">-- Semua Wilayah --</option>
                          {wilayahs.map((w: any) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </>
                      ) : (
                        <option value={filterWilayah}>{user?.wilayahName || 'Wilayah Terkunci'}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Cabang</label>
                    <select
                      value={filterCabang}
                      onChange={e => handleFilterCabangChange(e.target.value)}
                      disabled={user?.scope === 'CABANG'}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50 disabled:opacity-75"
                    >
                      <option value="">-- Semua Cabang --</option>
                      {filteredFilterCabangList.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {isLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                  ) : (<>
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50/80 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest w-16">No</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Nama Kelas</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Tingkat</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Lembaga Muadalah</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('cabang.branch_name')}</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest w-28">Jumlah Siswa</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('common.action')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {filteredKelasList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((kelas, idx) => (
                          <tr key={kelas.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-slate-400">
                              {(currentPage - 1) * itemsPerPage + idx + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                              {kelas.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              {kelas.tingkat || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-semibold text-indigo-650">
                              {kelas.lembagaMuadalah?.name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              {kelas.cabang ? `${kelas.cabang.name} ${kelas.cabang.wilayah ? `(${kelas.cabang.wilayah.name})` : ''}` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${kelas.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {kelas.isActive ? 'Aktif' : 'Tidak Aktif'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-slate-700 font-mono">
                              {kelas._count?.siswaFormal || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              {isWilayahOrAdmin && (
                                <button
                                  onClick={() => toggleStatusMutation.mutate({ id: kelas.id, isActive: !kelas.isActive })}
                                  className={`inline-flex items-center px-2 py-1 border rounded text-xs font-medium ${kelas.isActive ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100' : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'}`}
                                  disabled={toggleStatusMutation.isPending}
                                >
                                  {kelas.isActive ? <XCircle className="w-3.5 h-3.5 mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                                  {kelas.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedKelasForDetail(kelas)}
                                disabled={user?.scope === 'CABANG' && !kelas.isActive}
                                className={`inline-flex items-center px-2 py-1 border rounded text-xs font-medium transition-colors ${
                                  user?.scope === 'CABANG' && !kelas.isActive
                                    ? 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
                                    : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                Detail
                              </button>
                              {isWilayahOrAdmin && (
                                <button
                                  onClick={() => openEditModal(kelas)}
                                  className="inline-flex items-center px-2 py-1 border border-indigo-200 rounded text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                                >
                                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                                  {t('common.edit')}
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => confirmDelete(kelas.id)}
                                  className="inline-flex items-center px-2 py-1 border border-red-200 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  Hapus
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredKelasList.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-slate-500 font-medium text-sm">
                              {t('common.no_data')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <Pagination 
                      currentPage={currentPage} 
                      totalPages={Math.ceil((filteredKelasList.length || 0) / itemsPerPage)} 
                      onPageChange={setCurrentPage} 
                      totalItems={filteredKelasList.length || 0} 
                      itemsPerPage={itemsPerPage} 
                    />
                  </>)}
                </div>
              </div>
            );
          })() : (
            <GrupDaimiTab isAdmin={isAdmin} />
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingKelas ? `${t('common.edit')} Kelas` : `${t('common.add')} Kelas`}
                </h3>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user?.scope !== 'CABANG' && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('cabang.branch_name')}</label>
                      {loadingCabang ? (
                        <div className="text-sm text-slate-500 flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-1"/> {t('common.loading')}</div>
                      ) : (
                        <select
                          required
                          value={formData.cabangId}
                          onChange={(e) => setFormData({ ...formData, cabangId: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none bg-white text-sm"
                        >
                          <option value="">-- {t('common.select')} --</option>
                          {cabangList?.filter(c => user?.scope === 'WILAYAH' ? c.wilayahId === user.wilayahId : true).map(cabang => (
                            <option key={cabang.id} value={cabang.id}>
                              {cabang.name} {cabang.wilayah ? `(${cabang.wilayah.name})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Rombel / Kelas</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="Contoh: CADANGAN 11, 10A..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tingkat</label>
                    <select
                      value={formData.tingkat}
                      onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none bg-white text-sm"
                    >
                      <option value="Non Muadalah">Non Muadalah</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                      <option value="11">11</option>
                      <option value="12">12</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Ajaran</label>
                    <select
                      value={formData.tahunAjaran}
                      onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none bg-white text-sm"
                    >
                      <option value="2024/2025 Ganjil">2024/2025 Ganjil</option>
                      <option value="2024/2025 Genap">2024/2025 Genap</option>
                      <option value="2025/2026 Ganjil">2025/2026 Ganjil</option>
                      <option value="2025/2026 Genap">2025/2026 Genap</option>
                      <option value="2026/2027 Ganjil">2026/2027 Ganjil</option>
                      <option value="2026/2027 Genap">2026/2027 Genap</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Wali Kelas</label>
                    <select
                      value={formData.waliKelasId}
                      onChange={(e) => setFormData({ ...formData, waliKelasId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none bg-white text-sm"
                    >
                      <option value="">-- Pilih Wali Kelas --</option>
                      {staffList
                        .filter(s => formData.cabangId ? s.cabangId === formData.cabangId : true)
                        .map(staff => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name}
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lembaga Muadalah (Opsional)</label>
                    <select
                      value={formData.lembagaMuadalahId}
                      onChange={(e) => setFormData({ ...formData, lembagaMuadalahId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none bg-white text-sm"
                    >
                      <option value="">-- Tanpa Lembaga (Non Muadalah) --</option>
                      {muadalahList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!editingKelas && (
                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-slate-700">
                      Aktif
                    </label>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <ImportKelasModal onClose={() => setIsImportModalOpen(false)} />
      )}

      {isKenaikanModalOpen && (
        <KenaikanKelasModal 
          kelasList={kelasList || []} 
          onClose={() => setIsKenaikanModalOpen(false)} 
        />
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeDelete}
        title={t('common.delete_confirm') || "Konfirmasi Hapus"}
        message="Apakah Anda yakin ingin menghapus kelas ini? Aksi ini tidak dapat dibatalkan."
      />

      <ConfirmModal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={executeDeleteAll}
        title="Konfirmasi Hapus Semua Kelas"
        message="PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data kelas? Aksi ini akan menghapus seluruh data kelas secara permanen dan tidak dapat dibatalkan."
      />
    </div>
  );
}
