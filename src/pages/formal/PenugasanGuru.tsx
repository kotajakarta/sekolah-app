import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useGetGuru, useGetWilayah, useGetCabang } from '../../features/core_data/hooks/useMasterData';
import { Plus, Trash2, Loader2, BookOpen, UserCheck, AlertCircle, BarChart3, Building2, MapPin, X } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';

interface Assignment {
  id: string;
  staffId: string;
  staff: {
    id: string;
    name: string;
    position: string;
  };
  mataPelajaranId: string;
  mataPelajaran: {
    id: string;
    kodeMapel: string;
    name: string;
  };
  kelasId: string;
  kelas: {
    id: string;
    name: string;
    cabang?: {
      name: string;
      wilayah?: {
        name: string;
      };
    };
  };
}

export default function PenugasanGuru() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ staffId: '', mataPelajaranId: '', kelasId: '' });
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Filter States
  const [filterGuru, setFilterGuru] = useState('');
  const [filterMapel, setFilterMapel] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('');
  const [filterCabang, setFilterCabang] = useState('');

  // Queries
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery<Assignment[]>({
    queryKey: ['guru-mapel-kelas'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/guru-mapel-kelas');
      return res.data;
    }
  });

  const { data: guruList = [], isLoading: loadingGuru } = useGetGuru();
  const { data: wilayahs = [] } = useGetWilayah();
  const { data: cabangList = [] } = useGetCabang();

  const { data: kelasList = [], isLoading: loadingKelas } = useQuery<any[]>({
    queryKey: ['kelas'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/kelas');
      return res.data.filter((k: any) => k.isActive);
    }
  });

  const { data: mapelList = [], isLoading: loadingMapel } = useQuery<any[]>({
    queryKey: ['mapel'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/mapel');
      return res.data.filter((m: any) => m.isActive);
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiClient.post('/formal/guru-mapel-kelas', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru-mapel-kelas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsModalOpen(false);
      setFormData({ staffId: '', mataPelajaranId: '', kelasId: '' });
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menyimpan penugasan');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/formal/guru-mapel-kelas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru-mapel-kelas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsConfirmDeleteOpen(false);
      setAssignmentToDelete(null);
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menghapus penugasan');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staffId || !formData.mataPelajaranId || !formData.kelasId) {
      showToast('error', 'Harap isi semua kolom pilihan');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleOpenDelete = (id: string) => {
    setAssignmentToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const filteredAssignments = assignments.filter((asg) => {
    const matchGuru = asg.staff?.name?.toLowerCase().includes(filterGuru.toLowerCase());
    const matchMapel = asg.mataPelajaran?.name?.toLowerCase().includes(filterMapel.toLowerCase());
    const matchKelas = asg.kelas?.name?.toLowerCase().includes(filterKelas.toLowerCase());
    const matchWilayah = !filterWilayah || asg.kelas?.cabang?.wilayahId === filterWilayah;
    const matchCabang = !filterCabang || asg.kelas?.cabangId === filterCabang;
    return matchGuru && matchMapel && matchKelas && matchWilayah && matchCabang;
  });

  const mapelKurangGuru = useMemo(() => {
    if (loadingAssignments || loadingKelas || loadingMapel || !mapelList.length || !kelasList.length) return [];

    const requiredNames = ['matematika', 'bahasa indonesia', 'bahasa inggris', 'ipa', 'pkn'];
    const requiredMapel = mapelList.filter((mapel) => {
      const nameLower = mapel.name?.toLowerCase().trim() || '';
      return requiredNames.some(req => 
        nameLower === req || 
        nameLower.includes(req) || 
        (req === 'pkn' && (nameLower.includes('pancasila') || nameLower.includes('kewarganegaraan')))
      );
    });

    const result: Array<{ mapel: any; missingClasses: any[] }> = [];

    requiredMapel.forEach((mapel) => {
      const missingClassesForMapel: any[] = [];
      kelasList.forEach((kelas) => {
        const hasAssignment = assignments.some(
          (asg) => asg.mataPelajaranId === mapel.id && asg.kelasId === kelas.id
        );
        if (!hasAssignment) {
          missingClassesForMapel.push(kelas);
        }
      });

      if (missingClassesForMapel.length > 0) {
        result.push({
          mapel,
          missingClasses: missingClassesForMapel,
        });
      }
    });

    return result.sort((a, b) => b.missingClasses.length - a.missingClasses.length);
  }, [assignments, mapelList, kelasList, loadingAssignments, loadingKelas, loadingMapel]);

  const isLoading = loadingAssignments || loadingGuru || loadingKelas || loadingMapel;

  const progressStats = useMemo(() => {
    if (!mapelList.length || !kelasList.length || !assignments.length) {
      return { wilayahProgress: [], cabangProgress: [] };
    }

    const requiredNames = ['matematika', 'bahasa indonesia', 'bahasa inggris', 'ipa', 'pkn'];
    const requiredMapelIds = new Set(
      mapelList
        .filter((mapel) => {
          const nameLower = mapel.name?.toLowerCase().trim() || '';
          return requiredNames.some(req => 
            nameLower === req || 
            nameLower.includes(req) || 
            (req === 'pkn' && (nameLower.includes('pancasila') || nameLower.includes('kewarganegaraan')))
          );
        })
        .map(m => m.id)
    );

    if (requiredMapelIds.size === 0) {
      return { wilayahProgress: [], cabangProgress: [] };
    }

    // Progress per Cabang
    const cabangProgress = cabangList
      .filter(cabang => {
        if (user?.scope === 'CABANG') return cabang.id === user.cabangId;
        if (user?.scope === 'WILAYAH') return cabang.wilayahId === user.wilayahId;
        return true;
      })
      .map(cabang => {
        const classesInCabang = kelasList.filter(k => k.cabangId === cabang.id);
        const totalNeeded = classesInCabang.length * requiredMapelIds.size;
        
        let assignedCount = 0;
        classesInCabang.forEach(kelas => {
          assignments.forEach(asg => {
            if (asg.kelasId === kelas.id && requiredMapelIds.has(asg.mataPelajaranId)) {
              assignedCount++;
            }
          });
        });

        const percent = totalNeeded > 0 ? Math.round((assignedCount / totalNeeded) * 100) : 0;
        return {
          id: cabang.id,
          name: cabang.name,
          totalNeeded,
          assignedCount,
          percent,
          kelasCount: classesInCabang.length
        };
      })
      .sort((a, b) => b.percent - a.percent);

    // Progress per Wilayah
    const wilayahProgress = wilayahs
      .filter(wilayah => {
        if (user?.scope === 'WILAYAH') return wilayah.id === user.wilayahId;
        if (user?.scope === 'CABANG') {
          const myCabang = cabangList.find(c => c.id === user.cabangId);
          return wilayah.id === myCabang?.wilayahId;
        }
        return true;
      })
      .map(wilayah => {
        const cabangsInWilayah = new Set(cabangList.filter(c => c.wilayahId === wilayah.id).map(c => c.id));
        const classesInWilayah = kelasList.filter(k => cabangsInWilayah.has(k.cabangId));
        const totalNeeded = classesInWilayah.length * requiredMapelIds.size;
        
        let assignedCount = 0;
        classesInWilayah.forEach(kelas => {
          assignments.forEach(asg => {
            if (asg.kelasId === kelas.id && requiredMapelIds.has(asg.mataPelajaranId)) {
              assignedCount++;
            }
          });
        });

        const percent = totalNeeded > 0 ? Math.round((assignedCount / totalNeeded) * 100) : 0;
        return {
          id: wilayah.id,
          name: wilayah.name,
          totalNeeded,
          assignedCount,
          percent,
          kelasCount: classesInWilayah.length
        };
      })
      .sort((a, b) => b.percent - a.percent);

    return { wilayahProgress, cabangProgress };
  }, [assignments, mapelList, kelasList, wilayahs, cabangList, user]);

  return (
    <div className="font-sans text-slate-800 animate-in fade-in duration-500 pb-10">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Penugasan Mengajar Guru
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola pembagian tugas mengajar guru per mata pelajaran dan kelas yang spesifik.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsSummaryModalOpen(true)}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
          >
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Ringkasan & Progres
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Tambah Penugasan
          </button>
        </div>
      </div>

      {/* Card Compact Data Mapel Kurang Guru */}
      {!isLoading && mapelKurangGuru.length > 0 && (
        <div className="mb-6 bg-white border border-rose-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-rose-50/50 border-b border-rose-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold text-rose-800 uppercase tracking-wider">
                Mata Pelajaran Kurang Guru
              </h2>
            </div>
            <span className="text-[11px] font-bold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full">
              {mapelKurangGuru.length} Mapel Butuh Guru
            </span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[220px] overflow-y-auto custom-scrollbar">
            {mapelKurangGuru.map(({ mapel, missingClasses }) => (
              <div key={mapel.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[13px] font-semibold text-slate-800 truncate" title={mapel.name}>
                    {mapel.name}
                  </span>
                  <span className="text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md flex-shrink-0">
                    {missingClasses.length} Kelas
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2" title={missingClasses.map(c => c.name).join(', ')}>
                  Belum ada di: <span className="font-medium text-slate-700">{missingClasses.map(c => c.name).join(', ')}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`mb-4 grid grid-cols-1 ${
        user?.scope === 'GLOBAL' ? 'sm:grid-cols-5' : 
        user?.scope === 'WILAYAH' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
      } gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm`}>
        {user?.scope === 'GLOBAL' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Filter Wilayah</label>
            <select
              value={filterWilayah}
              onChange={(e) => {
                setFilterWilayah(e.target.value);
                setFilterCabang('');
              }}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Semua Wilayah</option>
              {wilayahs.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}
        {user?.scope !== 'CABANG' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Filter Cabang</label>
            <select
              value={filterCabang}
              onChange={(e) => setFilterCabang(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Semua Cabang</option>
              {cabangList
                .filter(c => {
                  if (user?.scope === 'WILAYAH') return c.wilayahId === user.wilayahId;
                  if (filterWilayah) return c.wilayahId === filterWilayah;
                  return true;
                })
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cari Guru</label>
          <input
            type="text"
            value={filterGuru}
            onChange={(e) => setFilterGuru(e.target.value)}
            placeholder="Ketik nama guru..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cari Mata Pelajaran</label>
          <input
            type="text"
            value={filterMapel}
            onChange={(e) => setFilterMapel(e.target.value)}
            placeholder="Ketik nama mapel..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cari Kelas</label>
          <input
            type="text"
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            placeholder="Ketik nama kelas..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm min-h-[300px]">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">Nama Guru</th>
                  <th className="px-6 py-4">Mata Pelajaran</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4">Cabang</th>
                  <th className="px-6 py-4">Wilayah</th>
                  <th className="px-6 py-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((asg) => (
                    <tr key={asg.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {asg.staff?.name || 'Staf tidak ditemukan'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-[13px] text-slate-700 font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          {asg.mataPelajaran?.name || 'Mapel tidak ditemukan'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-100">
                          {asg.kelas?.name || 'Kelas tidak ditemukan'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {asg.kelas?.cabang?.name || 'Pusat'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {asg.kelas?.cabang?.wilayah?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenDelete(asg.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Penugasan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      Belum ada penugasan guru yang terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Tambah Penugasan Guru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {/* Select Guru */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Guru Pengajar
                  </label>
                  <select
                    required
                    value={formData.staffId}
                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">-- Pilih Guru --</option>
                    {guruList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.position})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Kelas */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Kelas Penempatan
                  </label>
                  <select
                    required
                    value={formData.kelasId}
                    onChange={(e) => setFormData({ ...formData, kelasId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} {k.cabang?.name ? `(${k.cabang.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Mata Pelajaran */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    required
                    value={formData.mataPelajaranId}
                    onChange={(e) => setFormData({ ...formData, mataPelajaranId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} [{m.grupMapel}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => assignmentToDelete && deleteMutation.mutate(assignmentToDelete)}
        title="Batalkan Penugasan Guru"
        message="Apakah Anda yakin ingin membatalkan/menghapus tugas mengajar guru ini? Aksi ini bersifat permanen."
      />

      {/* Summary & Progress Modal */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Ringkasan & Progres Penugasan Guru
              </h3>
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {/* Section 1: Progress Stats */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progres Pemenuhan Guru (Mapel Wajib)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Wilayah Progress */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      Progres Per Wilayah
                    </div>
                    {progressStats.wilayahProgress.length > 0 ? (
                      <div className="space-y-3">
                        {progressStats.wilayahProgress.map(wp => (
                          <div key={wp.id} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-slate-700">
                              <span>{wp.name}</span>
                              <span className="font-semibold text-slate-900">{wp.percent}% ({wp.assignedCount}/{wp.totalNeeded})</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  wp.percent === 100 ? 'bg-green-500' :
                                  wp.percent >= 75 ? 'bg-emerald-500' :
                                  wp.percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${wp.percent}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Tidak ada data wilayah</p>
                    )}
                  </div>

                  {/* Cabang Progress */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      Progres Per Cabang
                    </div>
                    {progressStats.cabangProgress.length > 0 ? (
                      <div className="space-y-3 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                        {progressStats.cabangProgress.map(cp => (
                          <div key={cp.id} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-slate-700">
                              <span>{cp.name}</span>
                              <span className="font-semibold text-slate-900">{cp.percent}% ({cp.assignedCount}/{cp.totalNeeded})</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  cp.percent === 100 ? 'bg-green-500' :
                                  cp.percent >= 75 ? 'bg-emerald-500' :
                                  cp.percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${cp.percent}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Tidak ada data cabang</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Missing Subjects Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detail Kekurangan Guru Per Mata Pelajaran</h4>
                {mapelKurangGuru.length > 0 ? (
                  <div className="space-y-3">
                    {mapelKurangGuru.map(({ mapel, missingClasses }) => (
                      <div key={mapel.id} className="p-4 rounded-xl border border-rose-100 bg-rose-50/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-rose-500" />
                            {mapel.name}
                          </span>
                          <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                            {missingClasses.length} Kelas Kekurangan
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {missingClasses.map(c => (
                            <span key={c.id} className="text-[11px] font-semibold bg-white border border-rose-200 text-rose-700 px-2 py-0.5 rounded-md">
                              {c.name} {c.cabang?.name ? `(${c.cabang.name})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-green-50 rounded-xl border border-green-100 text-green-700 text-sm font-medium">
                    Semua kelas sudah memiliki guru untuk seluruh mata pelajaran wajib!
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
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
