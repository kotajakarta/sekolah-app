import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Plus, Edit2, Trash2, Loader2, Calendar, Settings, AlertCircle, Trash, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface Program {
  id: string;
  name: string;
  type: 'PELAJARAN' | 'UJIAN' | 'LAINNYA';
  date: string;
  isActive: boolean;
}

interface ProgramResponse {
  items: Program[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function KelolaProgramAbsensi() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'PELAJARAN' as 'PELAJARAN' | 'UJIAN' | 'LAINNYA',
    date: new Date().toISOString().split('T')[0],
    isActive: true
  });

  const DAYS_LIST = [
    { value: 0, label: 'Ahad' },
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' },
  ];

  const [bulkFormData, setBulkFormData] = useState({
    namePrefix: 'Absensi Pelajaran',
    daysOfWeek: [1, 2, 3, 4, 5, 6], // Default Senin - Sabtu
    startMonth: '2026-07',
    endMonth: '2027-06'
  });

  const { data, isLoading, isError } = useQuery<ProgramResponse>({
    queryKey: ['absensi-programs', page],
    queryFn: async () => {
      const res = await apiClient.get(`/absensi/programs?page=${page}&limit=${limit}`);
      return res.data;
    }
  });

  const list = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingProgram) {
        return apiClient.put(`/absensi/programs/${editingProgram.id}`, payload);
      }
      return apiClient.post('/absensi/programs', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absensi-programs'] });
      setIsModalOpen(false);
      setEditingProgram(null);
      triggerSuccess('Program absensi berhasil disimpan!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/absensi/programs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absensi-programs'] });
      triggerSuccess('Program absensi berhasil dihapus!');
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete('/absensi/programs/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absensi-programs'] });
      triggerSuccess('Semua program absensi berhasil dihapus!');
    },
    onError: (err: any) => {
      showToast('error', `Gagal menghapus semua program: ${err.message}`);
    }
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/absensi/programs/bulk-generate', payload);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['absensi-programs'] });
      setIsBulkModalOpen(false);
      triggerSuccess(`Berhasil membuat ${res.data.totalGenerated} program absensi secara masal.`);
    },
    onError: (err: any) => {
      showToast('error', `Gagal membuat program absensi masal: ${err?.response?.data?.message || err.message}`);
    }
  });

  const openAdd = () => {
    setEditingProgram(null);
    setFormData({
      name: '',
      type: 'PELAJARAN',
      date: new Date().toISOString().split('T')[0],
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEdit = (p: Program) => {
    setEditingProgram(p);
    setFormData({
      name: p.name,
      type: p.type,
      date: new Date(p.date).toISOString().split('T')[0],
      isActive: p.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus program absensi ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteAll = () => {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA program absensi beserta seluruh log kehadiran yang terkait? Tindakan ini tidak dapat dibatalkan.')) {
      deleteAllMutation.mutate();
    }
  };

  return (
    <div className="font-sans text-slate-800 animate-in fade-in duration-300 pb-10">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-500" />
            Kelola Program Absensi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Buat dan kelola program absensi untuk pelajaran, ujian, dan kegiatan lainnya.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDeleteAll}
            disabled={deleteAllMutation.isPending || list.length === 0}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors shadow-xs disabled:opacity-50"
          >
            {deleteAllMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash className="w-4 h-4 mr-2" />
            )}
            Hapus Semua Absensi
          </button>
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-xs"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Buat masal Absensi
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Program
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-500 flex items-center gap-2 justify-center">
            <AlertCircle className="w-5 h-5" /> Gagal memuat program absensi.
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Belum ada program absensi terdaftar.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                    <th className="px-6 py-3 w-16 text-center">No</th>
                    <th className="px-6 py-3">Nama Program</th>
                    <th className="px-6 py-3">Tipe</th>
                    <th className="px-6 py-3">Tanggal</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {list.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-center text-slate-400 font-medium">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{p.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.type === 'PELAJARAN' ? 'bg-blue-100 text-blue-800' :
                          p.type === 'UJIAN' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {p.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => openEdit(p)} className="inline-flex items-center px-2 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200">
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="inline-flex items-center px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200">
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs text-slate-500 font-medium">
                  Halaman {page} dari {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 border border-slate-200 bg-white rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all shadow-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 border border-slate-200 bg-white rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all shadow-xs"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Success Notification Modal (Pop Up Berhasil Simpan) */}
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Berhasil Simpan</h3>
            <p className="text-sm text-slate-500 mb-6">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition-colors animate-pulse"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">
                {editingProgram ? 'Edit Program Absensi' : 'Tambah Program Absensi'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-semibold">&times;</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(formData); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nama Program *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Absensi Pelajaran Sabtu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tipe *</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    <option value="PELAJARAN">Pelajaran</option>
                    <option value="UJIAN">Ujian</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Aktif (Bisa diisi oleh Cabang)</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Buat Masal Absensi */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Buat Masal Program Absensi</h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-semibold">&times;</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); bulkGenerateMutation.mutate(bulkFormData); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nama Program *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Absensi Pelajaran"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm"
                  value={bulkFormData.namePrefix}
                  onChange={e => setBulkFormData({ ...bulkFormData, namePrefix: e.target.value })}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Pilih Nama Hari * ({bulkFormData.daysOfWeek.length} Hari Terpilih)</label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setBulkFormData(prev => ({ ...prev, daysOfWeek: [1, 2, 3, 4, 5, 6] }))}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Senin-Sabtu
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setBulkFormData(prev => ({ ...prev, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }))}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Semua Hari
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {DAYS_LIST.map((day) => {
                    const isChecked = bulkFormData.daysOfWeek.includes(day.value);
                    return (
                      <label
                        key={day.value}
                        onClick={() => {
                          setBulkFormData(prev => {
                            const isSelected = prev.daysOfWeek.includes(day.value);
                            const nextDays = isSelected
                              ? prev.daysOfWeek.filter(d => d !== day.value)
                              : [...prev.daysOfWeek, day.value].sort((a, b) => a - b);
                            return { ...prev, daysOfWeek: nextDays };
                          });
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span>{day.label}</span>
                      </label>
                    );
                  })}
                </div>
                {bulkFormData.daysOfWeek.length === 0 && (
                  <p className="text-[11px] text-rose-500 mt-1 font-semibold">* Silakan centang minimal 1 hari.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Awal Bulan *</label>
                  <input
                    type="month"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm"
                    value={bulkFormData.startMonth}
                    onChange={e => setBulkFormData({ ...bulkFormData, startMonth: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Akhir Bulan *</label>
                  <input
                    type="month"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm"
                    value={bulkFormData.endMonth}
                    onChange={e => setBulkFormData({ ...bulkFormData, endMonth: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={bulkGenerateMutation.isPending || bulkFormData.daysOfWeek.length === 0}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkGenerateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Generasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
