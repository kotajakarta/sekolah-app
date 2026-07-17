import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Edit2, Trash2, Loader2, ArrowLeft, Building2, Search, Filter, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Cabang {
  id: string;
  name: string;
  wilayahId?: string;
  wilayah?: { name: string };
}

interface Ruang {
  id: string;
  nama: string;
  kode: string | null;
  tipe: string;
  kapasitas: number | null;
  luas: number | null;
  kondisi: string;
  keterangan: string | null;
  cabangId: string;
  cabang?: Cabang;
}

const TIPE_OPTIONS = [
  { value: 'KELAS', label: 'Ruang Kelas' },
  { value: 'ASRAMA', label: 'Asrama' },
  { value: 'KANTOR', label: 'Kantor / Ruang Guru' },
  { value: 'LAB', label: 'Laboratorium' },
  { value: 'PERPUSTAKAAN', label: 'Perpustakaan' },
  { value: 'AULA', label: 'Aula' },
  { value: 'LAINNYA', label: 'Lainnya' }
];

const KONDISI_OPTIONS = [
  { value: 'BAIK', label: 'Baik', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'RUSAK_RINGAN', label: 'Rusak Ringan', color: 'bg-amber-100 text-amber-800' },
  { value: 'RUSAK_BERAT', label: 'Rusak Berat', color: 'bg-rose-100 text-rose-800' }
];

export default function ManajemenRuang() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuang, setEditingRuang] = useState<Ruang | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    kode: '',
    tipe: 'KELAS',
    kapasitas: '',
    luas: '',
    kondisi: 'BAIK',
    keterangan: '',
    cabangId: user?.scope === 'CABANG' ? user.cabangId || '' : ''
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ruangToDelete, setRuangToDelete] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipe, setFilterTipe] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('');
  const [filterCabang, setFilterCabang] = useState(user?.scope === 'CABANG' ? user.cabangId || '' : '');

  // Fetch Ruang Data
  const { data: ruangList = [], isLoading, isError } = useQuery<Ruang[]>({
    queryKey: ['ruang'],
    queryFn: async () => {
      const res = await apiClient.get('/sarpras/ruang');
      return res.data;
    }
  });

  // Fetch Cabang List
  const { data: cabangList = [] } = useQuery<Cabang[]>({
    queryKey: ['master-data', 'cabang'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/cabang');
      return res.data;
    }
  });

  // Filtered List
  const filteredRuangList = useMemo(() => {
    return ruangList.filter(ruang => {
      const matchesSearch = !searchQuery || 
        ruang.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ruang.kode && ruang.kode.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTipe = !filterTipe || ruang.tipe === filterTipe;
      const matchesKondisi = !filterKondisi || ruang.kondisi === filterKondisi;
      const matchesCabang = !filterCabang || ruang.cabangId === filterCabang;
      return matchesSearch && matchesTipe && matchesKondisi && matchesCabang;
    });
  }, [ruangList, searchQuery, filterTipe, filterKondisi, filterCabang]);

  // Dynamic Metrics Cards
  const metrics = useMemo(() => {
    const total = ruangList.length;
    const baik = ruangList.filter(r => r.kondisi === 'BAIK').length;
    const rusakRingan = ruangList.filter(r => r.kondisi === 'RUSAK_RINGAN').length;
    const rusakBerat = ruangList.filter(r => r.kondisi === 'RUSAK_BERAT').length;
    return { total, baik, rusakRingan, rusakBerat };
  }, [ruangList]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiClient.post('/sarpras/ruang', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ruang'] });
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; body: typeof formData }) => {
      await apiClient.put(`/sarpras/ruang/${data.id}`, data.body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ruang'] });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/sarpras/ruang/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ruang'] });
      setIsDeleteModalOpen(false);
    }
  });

  const handleOpenAdd = () => {
    setEditingRuang(null);
    setFormData({
      nama: '',
      kode: '',
      tipe: 'KELAS',
      kapasitas: '',
      luas: '',
      kondisi: 'BAIK',
      keterangan: '',
      cabangId: user?.scope === 'CABANG' ? user.cabangId || '' : ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ruang: Ruang) => {
    setEditingRuang(ruang);
    setFormData({
      nama: ruang.nama,
      kode: ruang.kode || '',
      tipe: ruang.tipe,
      kapasitas: ruang.kapasitas ? ruang.kapasitas.toString() : '',
      luas: ruang.luas ? ruang.luas.toString() : '',
      kondisi: ruang.kondisi,
      keterangan: ruang.keterangan || '',
      cabangId: ruang.cabangId
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setRuangToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRuang) {
      updateMutation.mutate({ id: editingRuang.id, body: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="font-sans text-slate-800 pb-12">
      {/* Header */}
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-500" />
              Manajemen Ruang & Bangunan
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Daftar ruangan, kapasitas, luas, dan status kondisi prasarana di masing-masing cabang.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Ruangan
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Ruangan', value: metrics.total, color: 'text-slate-700', bg: 'bg-white border-slate-200' },
          { label: 'Kondisi Baik', value: metrics.baik, color: 'text-emerald-700', bg: 'bg-emerald-50/50 border-emerald-100' },
          { label: 'Rusak Ringan', value: metrics.rusakRingan, color: 'text-amber-700', bg: 'bg-amber-50/50 border-amber-100' },
          { label: 'Rusak Berat', value: metrics.rusakBerat, color: 'text-rose-700', bg: 'bg-rose-50/50 border-rose-100' }
        ].map(card => (
          <div key={card.label} className={`${card.bg} border rounded-xl p-4 shadow-sm`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          <Filter className="w-3.5 h-3.5" /> Filter Data
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cari Ruang</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Nama atau kode..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipe Ruangan</label>
            <select
              value={filterTipe}
              onChange={e => setFilterTipe(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua Tipe</option>
              {TIPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Kondisi</label>
            <select
              value={filterKondisi}
              onChange={e => setFilterKondisi(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua Kondisi</option>
              {KONDISI_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          {user?.scope !== 'CABANG' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cabang</label>
              <select
                value={filterCabang}
                onChange={e => setFilterCabang(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Cabang</option>
                {cabangList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : isError ? (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-700">
          <AlertTriangle className="w-5 h-5" /> Gagal memuat data ruangan. Coba muat ulang halaman.
        </div>
      ) : filteredRuangList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          Tidak ada data ruangan yang ditemukan.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-center w-12">No</th>
                  <th className="px-5 py-3">Nama Ruang</th>
                  <th className="px-5 py-3">Kode</th>
                  <th className="px-5 py-3">Tipe</th>
                  <th className="px-5 py-3 text-center">Kapasitas</th>
                  <th className="px-5 py-3 text-center">Luas (m²)</th>
                  <th className="px-5 py-3">Cabang</th>
                  <th className="px-5 py-3 text-center">Kondisi</th>
                  <th className="px-5 py-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRuangList.map((ruang, idx) => {
                  const kondisiCfg = KONDISI_OPTIONS.find(opt => opt.value === ruang.kondisi);
                  const tipeLabel = TIPE_OPTIONS.find(opt => opt.value === ruang.tipe)?.label || ruang.tipe;
                  return (
                    <tr key={ruang.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-3.5 text-center font-medium text-slate-450 text-slate-400">{idx + 1}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{ruang.nama}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-600">{ruang.kode || '-'}</td>
                      <td className="px-5 py-3.5 text-slate-650">{tipeLabel}</td>
                      <td className="px-5 py-3.5 text-center text-slate-700 font-semibold">{ruang.kapasitas || '-'}</td>
                      <td className="px-5 py-3.5 text-center text-slate-700 font-semibold">{ruang.luas || '-'}</td>
                      <td className="px-5 py-3.5 text-slate-500">{ruang.cabang?.name || '-'}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${kondisiCfg?.color || 'bg-slate-100'}`}>
                          {kondisiCfg?.label || ruang.kondisi}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleOpenEdit(ruang)}
                            className="p-1 text-slate-550 hover:text-indigo-650 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(ruang.id)}
                            className="p-1 text-slate-550 hover:text-rose-650 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingRuang ? 'Ubah Informasi Ruangan' : 'Tambah Ruangan Baru'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Ruangan *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Ruang Kelas VII-A, Lab Fisika"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kode Ruangan</label>
                  <input
                    type="text"
                    value={formData.kode}
                    onChange={e => setFormData({ ...formData, kode: e.target.value })}
                    placeholder="Contoh: R-7A, LAB-PHY"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tipe Ruang *</label>
                    <select
                      value={formData.tipe}
                      onChange={e => setFormData({ ...formData, tipe: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    >
                      {TIPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Kondisi *</label>
                    <select
                      value={formData.kondisi}
                      onChange={e => setFormData({ ...formData, kondisi: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    >
                      {KONDISI_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Kapasitas (Siswa)</label>
                    <input
                      type="number"
                      value={formData.kapasitas}
                      onChange={e => setFormData({ ...formData, kapasitas: e.target.value })}
                      placeholder="Contoh: 35"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Luas (m²)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.luas}
                      onChange={e => setFormData({ ...formData, luas: e.target.value })}
                      placeholder="Contoh: 56"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                {user?.scope !== 'CABANG' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Cabang *</label>
                    <select
                      required
                      value={formData.cabangId}
                      onChange={e => setFormData({ ...formData, cabangId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Pilih Cabang</option>
                      {cabangList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Keterangan Tambahan</label>
                  <textarea
                    value={formData.keterangan}
                    onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Masukkan detail tambahan tentang ruangan..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus Ruangan?</h3>
              <p className="text-sm text-slate-500">
                Apakah Anda yakin ingin menghapus ruangan ini? Semua fasilitas yang berada di dalam ruangan ini akan diset tanpa ruangan. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (ruangToDelete) deleteMutation.mutate(ruangToDelete);
                }}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple fallback X icon if XCircle is missing or we want customized
const XCircle = ({ className, ...props }: any) => {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
};
