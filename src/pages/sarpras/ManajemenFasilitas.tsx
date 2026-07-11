import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Edit2, Trash2, Loader2, ArrowLeft, Database, Search, Filter, AlertTriangle, CheckCircle } from 'lucide-react';
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
  cabangId: string;
}

interface Fasilitas {
  id: string;
  nama: string;
  kode: string | null;
  jumlah: number;
  kondisi: string;
  keterangan: string | null;
  cabangId: string;
  cabang?: Cabang;
  ruangId: string | null;
  ruang?: Ruang | null;
}

const KONDISI_OPTIONS = [
  { value: 'BAIK', label: 'Baik', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'RUSAK_RINGAN', label: 'Rusak Ringan', color: 'bg-amber-100 text-amber-800' },
  { value: 'RUSAK_BERAT', label: 'Rusak Berat', color: 'bg-rose-100 text-rose-800' }
];

export default function ManajemenFasilitas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFasilitas, setEditingFasilitas] = useState<Fasilitas | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    kode: '',
    jumlah: '1',
    kondisi: 'BAIK',
    keterangan: '',
    cabangId: user?.scope === 'CABANG' ? user.cabangId || '' : '',
    ruangId: ''
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fasilitasToDelete, setFasilitasToDelete] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('');
  const [filterCabang, setFilterCabang] = useState(user?.scope === 'CABANG' ? user.cabangId || '' : '');
  const [filterRuang, setFilterRuang] = useState('');

  // Fetch Fasilitas
  const { data: fasList = [], isLoading, isError } = useQuery<Fasilitas[]>({
    queryKey: ['fasilitas'],
    queryFn: async () => {
      const res = await apiClient.get('/sarpras/fasilitas');
      return res.data;
    }
  });

  // Fetch Rooms
  const { data: ruangList = [] } = useQuery<Ruang[]>({
    queryKey: ['ruang-list-all'],
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
  const filteredFasList = useMemo(() => {
    return fasList.filter(item => {
      const matchesSearch = !searchQuery || 
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.kode && item.kode.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesKondisi = !filterKondisi || item.kondisi === filterKondisi;
      const matchesCabang = !filterCabang || item.cabangId === filterCabang;
      const matchesRuang = !filterRuang || item.ruangId === filterRuang;
      return matchesSearch && matchesKondisi && matchesCabang && matchesRuang;
    });
  }, [fasList, searchQuery, filterKondisi, filterCabang, filterRuang]);

  // Dynamic Metrics
  const metrics = useMemo(() => {
    const typesCount = fasList.length;
    const totalQty = fasList.reduce((sum, item) => sum + item.jumlah, 0);
    const baikQty = fasList.filter(item => item.kondisi === 'BAIK').reduce((sum, item) => sum + item.jumlah, 0);
    const rusakQty = fasList.filter(item => item.kondisi !== 'BAIK').reduce((sum, item) => sum + item.jumlah, 0);
    return { typesCount, totalQty, baikQty, rusakQty };
  }, [fasList]);

  // Dynamic Room List depending on Selected Cabang inside Modal
  const availableRoomsInModal = useMemo(() => {
    const selectedCabangId = formData.cabangId;
    if (!selectedCabangId) return [];
    return ruangList.filter(r => r.cabangId === selectedCabangId);
  }, [ruangList, formData.cabangId]);

  // Dynamic Room List depending on Filter Cabang selection
  const availableRoomsInFilter = useMemo(() => {
    if (!filterCabang) return ruangList;
    return ruangList.filter(r => r.cabangId === filterCabang);
  }, [ruangList, filterCabang]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiClient.post('/sarpras/fasilitas', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fasilitas'] });
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; body: typeof formData }) => {
      await apiClient.put(`/sarpras/fasilitas/${data.id}`, data.body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fasilitas'] });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/sarpras/fasilitas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fasilitas'] });
      setIsDeleteModalOpen(false);
    }
  });

  const handleOpenAdd = () => {
    setEditingFasilitas(null);
    setFormData({
      nama: '',
      kode: '',
      jumlah: '1',
      kondisi: 'BAIK',
      keterangan: '',
      cabangId: user?.scope === 'CABANG' ? user.cabangId || '' : '',
      ruangId: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Fasilitas) => {
    setEditingFasilitas(item);
    setFormData({
      nama: item.nama,
      kode: item.kode || '',
      jumlah: item.jumlah.toString(),
      kondisi: item.kondisi,
      keterangan: item.keterangan || '',
      cabangId: item.cabangId,
      ruangId: item.ruangId || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setFasilitasToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFasilitas) {
      updateMutation.mutate({ id: editingFasilitas.id, body: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCabangChange = (cabangId: string) => {
    setFormData(prev => ({
      ...prev,
      cabangId,
      ruangId: '' // reset room if branch changes
    }));
  };

  return (
    <div className="font-sans text-slate-800 pb-12">
      {/* Header */}
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-500" />
              Manajemen Fasilitas & Aset
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Catat inventaris fasilitas utama cabang, jumlah unit, kondisi kelayakan, dan lokasinya.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Fasilitas
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Jenis Fasilitas', value: metrics.typesCount, color: 'text-slate-700', bg: 'bg-white border-slate-200' },
          { label: 'Total Unit Barang', value: metrics.totalQty, color: 'text-indigo-700', bg: 'bg-indigo-50/50 border-indigo-100' },
          { label: 'Kondisi Baik (Unit)', value: metrics.baikQty, color: 'text-emerald-700', bg: 'bg-emerald-50/50 border-emerald-100' },
          { label: 'Rusak (Unit)', value: metrics.rusakQty, color: 'text-rose-700', bg: 'bg-rose-50/50 border-rose-100' }
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
            <label className="block text-xs font-medium text-slate-600 mb-1">Cari Fasilitas</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Nama atau kode aset..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Kondisi Barang</label>
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
                onChange={e => {
                  setFilterCabang(e.target.value);
                  setFilterRuang('');
                }}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Cabang</option>
                {cabangList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Lokasi Ruang</label>
            <select
              value={filterRuang}
              onChange={e => setFilterRuang(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua Ruangan</option>
              {availableRoomsInFilter.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : isError ? (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-700">
          <AlertTriangle className="w-5 h-5" /> Gagal memuat data inventaris. Coba muat ulang halaman.
        </div>
      ) : filteredFasList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
          <Database className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          Tidak ada data inventaris yang ditemukan.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-center w-12">No</th>
                  <th className="px-5 py-3">Nama Inventaris</th>
                  <th className="px-5 py-3">Kode Aset</th>
                  <th className="px-5 py-3 text-center">Jumlah (Qty)</th>
                  <th className="px-5 py-3">Lokasi Ruang</th>
                  <th className="px-5 py-3">Cabang</th>
                  <th className="px-5 py-3 text-center">Kondisi</th>
                  <th className="px-5 py-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredFasList.map((item, idx) => {
                  const kondisiCfg = KONDISI_OPTIONS.find(opt => opt.value === item.kondisi);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-3.5 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{item.nama}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-600">{item.kode || '-'}</td>
                      <td className="px-5 py-3.5 text-center text-slate-700 font-bold">{item.jumlah}</td>
                      <td className="px-5 py-3.5 text-indigo-650 font-semibold">{item.ruang?.nama || 'Tanpa Ruangan'}</td>
                      <td className="px-5 py-3.5 text-slate-500">{item.cabang?.name || '-'}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${kondisiCfg?.color || 'bg-slate-100'}`}>
                          {kondisiCfg?.label || item.kondisi}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
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
                {editingFasilitas ? 'Ubah Informasi Inventaris' : 'Tambah Inventaris Baru'}
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Barang *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Meja Siswa, Proyektor Epson"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kode Aset / Inventaris</label>
                  <input
                    type="text"
                    value={formData.kode}
                    onChange={e => setFormData({ ...formData, kode: e.target.value })}
                    placeholder="Contoh: INV/M-01/2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Jumlah Unit *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.jumlah}
                      onChange={e => setFormData({ ...formData, jumlah: e.target.value })}
                      placeholder="Contoh: 30"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
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

                {user?.scope !== 'CABANG' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Cabang *</label>
                    <select
                      required
                      value={formData.cabangId}
                      onChange={e => handleCabangChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Pilih Cabang</option>
                      {cabangList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Lokasi Ruang</label>
                  <select
                    value={formData.ruangId}
                    disabled={!formData.cabangId}
                    onChange={e => setFormData({ ...formData, ruangId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Tanpa Ruangan (Di Luar Ruang)</option>
                    {availableRoomsInModal.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
                  </select>
                  {!formData.cabangId && (
                    <p className="text-[10px] text-amber-600 mt-1">Pilih cabang terlebih dahulu untuk memilih ruangan.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Keterangan Tambahan</label>
                  <textarea
                    value={formData.keterangan}
                    onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Masukkan info tambahan, nomor seri, dll..."
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

      {/* Delete Confirmation */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus Inventaris?</h3>
              <p className="text-sm text-slate-500">
                Apakah Anda yakin ingin menghapus barang inventaris ini? Tindakan ini tidak dapat dibatalkan.
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
                  if (fasilitasToDelete) deleteMutation.mutate(fasilitasToDelete);
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
