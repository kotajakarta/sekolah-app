import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Edit2, CheckCircle, XCircle, Loader2, Trash2, School, Search, User, FileText, Eye, Upload } from 'lucide-react';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';

interface LembagaMuadalah {
  id: string;
  name: string;
  code: string;
  npsn?: string;
  nspp?: string;
  namaKetua?: string;
  ttdKetua?: string;
  skSpm?: string;
  isActive: boolean;
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
}

export default function LembagaMuadalahPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.scope === 'GLOBAL';
  const isWilayahOrAdmin = user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMuadalah, setEditingMuadalah] = useState<LembagaMuadalah | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    code: '', 
    npsn: '', 
    nspp: '', 
    namaKetua: '', 
    ttdKetua: '', 
    skSpm: '', 
    isActive: true 
  });
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [muadalahToDelete, setMuadalahToDelete] = useState<string | null>(null);

  // Profile modal and tab states
  const [selectedProfileMuadalah, setSelectedProfileMuadalah] = useState<LembagaMuadalah | null>(null);
  const [profileTab, setProfileTab] = useState<'info' | 'kelas'>('info');

  // Uploading states
  const [isUploadingTtd, setIsUploadingTtd] = useState(false);
  const [isUploadingSk, setIsUploadingSk] = useState(false);

  // Filter states
  const [filterName, setFilterName] = useState('');
  const [filterTingkat, setFilterTingkat] = useState('');

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
    return `${baseURL}${relativeUrl}`;
  };

  const handleTtdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'image/png') {
      alert('Format file harus PNG');
      return;
    }
    setIsUploadingTtd(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/formal/muadalah/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, ttdKetua: res.data.url }));
    } catch (err: any) {
      alert('Gagal mengupload file: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploadingTtd(false);
    }
  };

  const handleSkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSk(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/formal/muadalah/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, skSpm: res.data.url }));
    } catch (err: any) {
      alert('Gagal mengupload file: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploadingSk(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/formal/muadalah', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembaga-muadalah'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Gagal menyimpan data');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.put(`/formal/muadalah/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembaga-muadalah'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Gagal mengubah data');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (data: { id: string, isActive: boolean }) => {
      await apiClient.patch(`/formal/muadalah/${data.id}/status`, { isActive: data.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembaga-muadalah'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Gagal mengubah status');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/formal/muadalah/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembaga-muadalah'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Gagal menghapus data');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMuadalah) {
      updateMutation.mutate({ 
        id: editingMuadalah.id, 
        name: formData.name, 
        code: formData.code,
        npsn: formData.npsn,
        nspp: formData.nspp,
        namaKetua: formData.namaKetua,
        ttdKetua: formData.ttdKetua,
        skSpm: formData.skSpm
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openAddModal = () => {
    setEditingMuadalah(null);
    setFormData({ 
      name: '', 
      code: '', 
      npsn: '', 
      nspp: '', 
      namaKetua: '', 
      ttdKetua: '', 
      skSpm: '', 
      isActive: true 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: LembagaMuadalah) => {
    setEditingMuadalah(item);
    setFormData({ 
      name: item.name, 
      code: item.code, 
      npsn: item.npsn || '', 
      nspp: item.nspp || '', 
      namaKetua: item.namaKetua || '', 
      ttdKetua: item.ttdKetua || '', 
      skSpm: item.skSpm || '', 
      isActive: item.isActive 
    });
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

  // Local Filter logic
  const filteredList = list.filter(item => {
    const matchName = !filterName || 
      item.name.toLowerCase().includes(filterName.toLowerCase()) ||
      item.code.toLowerCase().includes(filterName.toLowerCase());

    const matchTingkat = !filterTingkat ||
      (item.kelas && item.kelas.some(k => k.tingkat === filterTingkat));

    return matchName && matchTingkat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            <School className="w-6 h-6 text-indigo-500" />
            Manajemen Lembaga Muadalah
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">Kelola data Lembaga Muadalah yang menaungi kelas-kelas di setiap cabang.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isWilayahOrAdmin && (
            <button 
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 animate-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Lembaga
            </button>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Cari Nama Lembaga / Kode</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Masukkan kata kunci nama atau kode..."
              value={filterName}
              onChange={e => { setFilterName(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Filter Tingkat Kelas</label>
          <select
            value={filterTingkat}
            onChange={e => { setFilterTingkat(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
          >
            <option value="">-- Semua Tingkat --</option>
            <option value="Non Muadalah">Non Muadalah</option>
            <option value="7">Tingkat 7</option>
            <option value="8">Tingkat 8</option>
            <option value="9">Tingkat 9</option>
            <option value="10">Tingkat 10</option>
            <option value="11">Tingkat 11</option>
            <option value="12">Tingkat 12</option>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Kode Lembaga</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Nama Lembaga</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-slate-400">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                    {item.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => { setSelectedProfileMuadalah(item); setProfileTab('info'); }}
                      className="inline-flex items-center px-2 py-1 border border-slate-200 rounded text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Profil
                    </button>
                    {isWilayahOrAdmin && (
                      <button
                        onClick={() => toggleStatusMutation.mutate({ id: item.id, isActive: !item.isActive })}
                        className={`inline-flex items-center px-2 py-1 border rounded text-xs font-medium ${item.isActive ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100' : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'}`}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {item.isActive ? <XCircle className="w-3.5 h-3.5 mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                        {item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    )}
                    {isWilayahOrAdmin && (
                      <button
                        onClick={() => openEditModal(item)}
                        className="inline-flex items-center px-2 py-1 border border-indigo-200 rounded text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => confirmDelete(item.id)}
                        className="inline-flex items-center px-2 py-1 border border-red-200 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Hapus
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data lembaga muadalah yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination 
            currentPage={currentPage} 
            totalPages={Math.ceil((filteredList.length || 0) / itemsPerPage)} 
            onPageChange={setCurrentPage} 
            totalItems={filteredList.length || 0} 
            itemsPerPage={itemsPerPage} 
          />
        </>)}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingMuadalah ? 'Edit Lembaga Muadalah' : 'Tambah Lembaga Muadalah'}
                </h3>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kode Lembaga *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="Contoh: GONTOR, LIRBOYO..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lembaga Muadalah *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="Contoh: Pondok Modern Darussalam Gontor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NPSN</label>
                  <input
                    type="text"
                    value={formData.npsn}
                    onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="Masukkan NPSN lembaga..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NSPP Pesantren</label>
                  <input
                    type="text"
                    value={formData.nspp}
                    onChange={(e) => setFormData({ ...formData, nspp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="Masukkan NSPP pesantren..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Ketua Muadalah</label>
                  <input
                    type="text"
                    value={formData.namaKetua}
                    onChange={(e) => setFormData({ ...formData, namaKetua: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="Masukkan nama ketua..."
                  />
                </div>

                {/* Upload TTD Ketua (PNG) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Upload TTD Ketua (PNG)</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                      <Upload className="w-4 h-4 mr-2 text-slate-400" />
                      Pilih PNG TTD
                      <input
                        type="file"
                        accept="image/png"
                        onChange={handleTtdUpload}
                        className="hidden"
                      />
                    </label>
                    {isUploadingTtd && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                    {formData.ttdKetua && (
                      <span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Terupload
                      </span>
                    )}
                  </div>
                </div>

                {/* Upload SK SPM */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Upload SK SPM (PDF/Gambar)</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                      <Upload className="w-4 h-4 mr-2 text-slate-400" />
                      Pilih Dokumen SK
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={handleSkUpload}
                        className="hidden"
                      />
                    </label>
                    {isUploadingSk && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                    {formData.skSpm && (
                      <span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Terupload
                      </span>
                    )}
                  </div>
                </div>

                {!editingMuadalah && (
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
                  className="px-4 py-2 text-sm font-semibold text-slate-650 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || isUploadingTtd || isUploadingSk}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {selectedProfileMuadalah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <School className="w-5 h-5 text-indigo-500" />
                Profil Lembaga Muadalah
              </h3>
              <button 
                onClick={() => setSelectedProfileMuadalah(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub Tabs */}
            <div className="border-b border-slate-100 px-6 flex space-x-6">
              <button
                onClick={() => setProfileTab('info')}
                className={`pb-3 pt-2 text-sm font-semibold border-b-2 transition-all ${
                  profileTab === 'info'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Profil Lembaga
              </button>
              <button
                onClick={() => setProfileTab('kelas')}
                className={`pb-3 pt-2 text-sm font-semibold border-b-2 transition-all ${
                  profileTab === 'kelas'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Daftar Kelas & Cabang ({selectedProfileMuadalah.kelas?.length || 0})
              </button>
            </div>

            <div className="p-6 space-y-6">
              {profileTab === 'info' ? (
                <>
                  <div className="flex items-center gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/55">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                      {selectedProfileMuadalah.code.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-base">{selectedProfileMuadalah.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">Kode: {selectedProfileMuadalah.code}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest">NPSN</span>
                      <span className="text-sm font-medium text-slate-700">{selectedProfileMuadalah.npsn || 'Tidak ada'}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest">NSPP Pesantren</span>
                      <span className="text-sm font-medium text-slate-700">{selectedProfileMuadalah.nspp || 'Tidak ada'}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Status Keaktifan</span>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${selectedProfileMuadalah.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedProfileMuadalah.isActive ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        Ketua Muadalah
                      </span>
                      <span className="block text-sm font-semibold text-slate-850">{selectedProfileMuadalah.namaKetua || 'Tidak ada'}</span>
                      {selectedProfileMuadalah.ttdKetua && (
                        <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 max-w-[200px] hover:shadow-sm animate-all">
                          <span className="block text-[10px] text-slate-400 mb-1 font-semibold">Tanda Tangan</span>
                          <img 
                            src={getFullFileUrl(selectedProfileMuadalah.ttdKetua)} 
                            alt="Tanda Tangan Ketua" 
                            className="max-h-20 max-w-full object-contain mx-auto" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        SK SPM
                      </span>
                      {selectedProfileMuadalah.skSpm ? (
                        <a
                          href={getFullFileUrl(selectedProfileMuadalah.skSpm)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100 animate-all"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Lihat Dokumen SK
                        </a>
                      ) : (
                        <span className="text-sm text-slate-500 font-medium">Belum diupload</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="overflow-x-auto max-h-[50vh] border border-slate-200 rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest w-12">No</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Nama Kelas</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Tingkat</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Cabang</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Wilayah</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {(selectedProfileMuadalah.kelas || []).map((kelasItem, index) => (
                        <tr key={kelasItem.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 whitespace-nowrap text-center text-xs text-slate-400 font-semibold">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-slate-800">
                            {kelasItem.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-650">
                            {kelasItem.tingkat || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-750 font-medium">
                            {kelasItem.cabang?.name || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                            {kelasItem.cabang?.wilayah?.name || '-'}
                          </td>
                        </tr>
                      ))}
                      {(selectedProfileMuadalah.kelas || []).length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-xs">
                            Belum ada kelas yang terdaftar di bawah lembaga muadalah ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProfileMuadalah(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus lembaga muadalah ini? Aksi ini tidak dapat dibatalkan."
      />
    </div>
  );
}
