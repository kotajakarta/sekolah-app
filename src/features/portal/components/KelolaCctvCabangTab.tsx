import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import { maskStreamUrl } from '../../../utils/cctvCrypto';
import {
  Video,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Play,
  Loader2,
  ExternalLink,
  School,
  Building2,
  Utensils,
  Building,
  Radio,
  Search,
  X,
  Save,
  Link2,
} from 'lucide-react';

export interface CctvChannelItem {
  id: string;
  cabangId: string;
  name: string;
  category: 'KELAS' | 'MASJID' | 'MAKAN' | 'ASRAMA' | 'HALAMAN' | 'LAINNYA';
  streamUrl: string;
  location?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  cabang?: { id: string; name: string } | null;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  KELAS: { label: 'Ruang Kelas', icon: School, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  MASJID: { label: 'Masjid & Ibadah', icon: Building2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  MAKAN: { label: 'Tempat Makan / Dapur', icon: Utensils, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ASRAMA: { label: 'Asrama Santri', icon: Building, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  HALAMAN: { label: 'Halaman & Lapangan', icon: Building, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  LAINNYA: { label: 'Lainnya', icon: Video, color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export default function KelolaCctvCabangTab() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCabangId, setSelectedCabangId] = useState<string>(user?.cabangId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CctvChannelItem | null>(null);
  const [previewStreamItem, setPreviewStreamItem] = useState<CctvChannelItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'KELAS',
    streamUrl: '',
    location: '',
    description: '',
    isActive: true,
  });

  // Fetch Cabang List if Admin Global / Wilayah
  const { data: cabangList = [] } = useQuery({
    queryKey: ['cabang-list-cctv'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/cabang');
      return res.data;
    },
    enabled: user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH',
  });

  // Fetch CCTV Channels
  const { data: cctvList = [], isLoading } = useQuery<CctvChannelItem[]>({
    queryKey: ['cctv-channels-admin', selectedCabangId],
    queryFn: async () => {
      const params = selectedCabangId ? { cabangId: selectedCabangId } : {};
      const res = await apiClient.get('/cctv/channels', { params });
      return res.data;
    },
  });

  // Save Mutation (Create/Update)
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingItem) {
        return apiClient.put(`/cctv/channels/${editingItem.id}`, payload);
      }
      return apiClient.post('/cctv/channels', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cctv-channels-admin'] });
      showToast('success', editingItem ? 'Kamera CCTV berhasil diperbarui!' : 'Kamera CCTV baru berhasil ditambahkan!');
      closeModal();
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan data CCTV');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/cctv/channels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cctv-channels-admin'] });
      showToast('success', 'Kamera CCTV berhasil dihapus!');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menghapus kamera CCTV');
    },
  });

  const openModal = (item?: CctvChannelItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        streamUrl: item.streamUrl,
        location: item.location || '',
        description: item.description || '',
        isActive: item.isActive,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: 'KELAS',
        streamUrl: '',
        location: '',
        description: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.streamUrl.trim()) {
      showToast('error', 'Nama kamera dan Alamat Stream URL wajib diisi');
      return;
    }

    const payload = {
      ...formData,
      ...(user?.scope === 'CABANG' ? { cabangId: user.cabangId } : { cabangId: selectedCabangId || user?.cabangId }),
    };

    saveMutation.mutate(payload);
  };

  const filteredCctv = cctvList.filter((c) => {
    const term = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(term) || (c.location || '').toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* ── BANNER INFORMASI CABANG ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-600" /> Konfigurasi Alamat Stream CCTV Cabang
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Di sini administrator cabang dapat mendaftarkan URL streaming IP Camera / NVR (HLS `.m3u8`, RTSP, WebRTC, atau HTTP embed) untuk setiap lokasi kamera.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Cabang Filter Dropdown for Global/Wilayah */}
          {(user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH') && (
            <select
              value={selectedCabangId}
              onChange={(e) => setSelectedCabangId(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Semua Cabang --</option>
              {cabangList.map((cb: any) => (
                <option key={cb.id} value={cb.id}>
                  {cb.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Kamera CCTV
          </button>
        </div>
      </div>

      {/* ── SEARCH & TABLE / CARDS ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama kamera / lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Total Kamera: <strong className="text-slate-800">{filteredCctv.length} Kamera</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Memuat daftar kamera CCTV...
          </div>
        ) : filteredCctv.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <Video className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">Belum ada kamera CCTV terdaftar untuk cabang ini.</p>
            <p className="text-[11px] text-slate-400">Klik tombol "Tambah Kamera CCTV" di atas untuk mendaftarkan URL streaming kamera.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCctv.map((item) => {
              const catInfo = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.LAINNYA;
              const IconComp = catInfo.icon;

              return (
                <div key={item.id} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:shadow-md transition-all space-y-3 relative group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100 shrink-0">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">{item.name}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.location || 'Lokasi tidak dispesifikasikan'}</p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.color}`}>
                      {catInfo.label}
                    </span>
                  </div>

                  {/* STREAM URL BOX */}
                  <div className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-indigo-300 flex items-center justify-between gap-2 overflow-hidden border border-slate-800">
                    <span className="truncate flex items-center gap-1.5 font-bold">
                      <Link2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      {maskStreamUrl(item.streamUrl)}
                    </span>
                    <button
                      onClick={() => setPreviewStreamItem(item)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" /> Tes Play
                    </button>
                  </div>

                  {item.description && <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Status Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Nonaktif
                        </span>
                      )}
                      {item.cabang && <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">Cabang: {item.cabang.name}</span>}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openModal(item)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Kamera"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus kamera "${item.name}"?`)) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Kamera"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL TAMBAH / EDIT KAMERA ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-600" />
                {editingItem ? 'Edit Kamera CCTV' : 'Tambah Kamera CCTV Cabang'}
              </h3>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nama Kamera CCTV *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: CCTV Kelas Utama A-102"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Kategori Area *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                  >
                    <option value="KELAS">Ruang Kelas</option>
                    <option value="MASJID">Masjid / Mushala</option>
                    <option value="MAKAN">Tempat Makan / Dapur</option>
                    <option value="ASRAMA">Asrama Santri</option>
                    <option value="HALAMAN">Halaman & Lapangan</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Lokasi Detail</label>
                  <input
                    type="text"
                    placeholder="Misal: Lantai 2 Gedung A"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Alamat Stream URL (IP / RTSP / HLS / HTTP) *</label>
                <input
                  type="text"
                  required
                  placeholder="https://cctv.cabang-gontor.com/live/kelas101.m3u8"
                  value={formData.streamUrl}
                  onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400">Dapat berupa URL HLS (`.m3u8`), WebRTC, RTSP, atau IP Camera Stream URL.</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Deskripsi / Catatan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan mengenai kamera ini..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isActiveToggle" className="font-bold text-slate-700 cursor-pointer">
                  Aktifkan Kamera untuk Wali Santri
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Kamera CCTV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── STREAM PREVIEW TEST MODAL ── */}
      {previewStreamItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-2xl w-full p-6 text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" /> Uji Tayangan: {previewStreamItem.name}
              </h3>
              <button onClick={() => setPreviewStreamItem(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
              <div className="p-6 text-center space-y-2">
                <Radio className="w-8 h-8 text-emerald-400 animate-pulse mx-auto" />
                <p className="font-bold text-xs text-emerald-300">Menghubungkan ke Stream Server...</p>
                <p className="font-mono text-[11px] text-slate-400 max-w-md truncate">{previewStreamItem.streamUrl}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewStreamItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
              >
                Tutup Uji Coba
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
