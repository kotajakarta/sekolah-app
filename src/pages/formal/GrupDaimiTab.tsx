import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useGetStudents, Student } from '../../features/core_data/hooks/useGetStudents';
import { Plus, Edit2, Trash2, Loader2, Eye, User, Settings, UserPlus, UserMinus, Search, X, Check, Users, Tag, BarChart3, BookOpen, School, CheckCircle2, GraduationCap, Filter } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import JenisGrupDaimiManager from './JenisGrupDaimiManager';

interface Staff {
  id: string;
  name: string;
}

interface Cabang {
  id: string;
  name: string;
  wilayahId?: string;
  wilayah?: {
    id?: string;
    name: string;
  };
}

interface GrupDaimi {
  id: string;
  name: string;
  jenis?: string;
  ketuaId?: string;
  ketua?: Staff;
  cabangId?: string;
  cabang?: Cabang;
  dataDaimi?: {
    studentId: string;
  }[];
}

interface GrupDaimiTabProps {
  isAdmin?: boolean;
}

export default function GrupDaimiTab({ isAdmin = false }: GrupDaimiTabProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();
  const canManage = user?.scope === 'GLOBAL' || user?.scope === 'CABANG';

  const [subTab, setSubTab] = useState<'daftar' | 'jenis'>('daftar');

  // Filters State
  const [filterWilayah, setFilterWilayah] = useState(user?.scope === 'WILAYAH' && user?.wilayahId ? user.wilayahId : '');
  const [filterCabang, setFilterCabang] = useState(user?.scope === 'CABANG' && user?.cabangId ? user.cabangId : '');
  const [filterJenis, setFilterJenis] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrup, setEditingGrup] = useState<GrupDaimi | null>(null);
  
  // Group editing state
  const [formData, setFormData] = useState({ 
    name: '',
    jenis: '',
    ketuaId: '',
    cabangId: ''
  });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [grupToDelete, setGrupToDelete] = useState<string | null>(null);

  // Detail Modal States
  const [selectedDetailGrup, setSelectedDetailGrup] = useState<GrupDaimi | null>(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedJenisForChart, setSelectedJenisForChart] = useState<string>('ALL');

  // Queries
  const { data: grupList, isLoading } = useQuery<GrupDaimi[]>({
    queryKey: ['grup-daimi'],
    queryFn: async () => {
      const res = await apiClient.get('/pesantren/grup-daimi');
      return res.data;
    }
  });

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ['guru-staff'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/guru');
      return res.data;
    }
  });

  const { data: wilayahList = [] } = useQuery<any[]>({
    queryKey: ['wilayah'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/wilayah');
      return res.data;
    },
    enabled: user?.scope === 'GLOBAL'
  });

  const { data: cabangList = [] } = useQuery<Cabang[]>({
    queryKey: ['cabang'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/cabang');
      return res.data;
    },
    enabled: user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH'
  });

  const { data: jenisGrupDaimiList = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['jenis-grup-daimi'],
    queryFn: async () => {
      const res = await apiClient.get('/pesantren/jenis-grup-daimi');
      return res.data;
    }
  });

  const { data: allStudents = [], refetch: refetchAllStudents } = useGetStudents();

  const { data: studentsInGrup = [], isLoading: isLoadingGrupStudents, refetch: refetchGrupStudents } = useQuery<Student[]>({
    queryKey: ['grup-daimi', selectedDetailGrup?.id, 'students'],
    queryFn: async () => {
      if (!selectedDetailGrup?.id) return [];
      const res = await apiClient.get(`/pesantren/grup-daimi/${selectedDetailGrup.id}/students`);
      return res.data;
    },
    enabled: !!selectedDetailGrup?.id
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiClient.post('/pesantren/grup-daimi', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grup-daimi'] });
      setIsModalOpen(false);
      showToast('success', 'Grup Daimi berhasil dibuat');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal membuat grup');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & typeof formData) => {
      await apiClient.put(`/pesantren/grup-daimi/${data.id}`, {
        name: data.name,
        jenis: data.jenis,
        ketuaId: data.ketuaId,
        cabangId: data.cabangId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grup-daimi'] });
      setIsModalOpen(false);
      
      if (selectedDetailGrup) {
        setSelectedDetailGrup(prev => prev ? { 
          ...prev, 
          name: formData.name, 
          jenis: formData.jenis, 
          ketuaId: formData.ketuaId,
          cabangId: formData.cabangId,
          ketua: staffList.find(s => s.id === formData.ketuaId),
          cabang: cabangList.find(c => c.id === formData.cabangId)
        } : null);
      }
      
      showToast('success', 'Grup Daimi berhasil diperbarui');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal memperbarui grup');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/pesantren/grup-daimi/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grup-daimi'] });
      showToast('success', 'Grup Daimi berhasil dihapus');
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal menghapus. Kemungkinan grup ini masih digunakan oleh data santri atau mapel.');
    }
  });

  const addStudentsMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      if (!selectedDetailGrup) return;
      await Promise.all(
        studentIds.map(studentId =>
          apiClient.post(`/pesantren/grup-daimi/${selectedDetailGrup.id}/students`, { studentId })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grup-daimi'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      refetchAllStudents();
      refetchGrupStudents();
      setSelectedStudentIds([]);
      setStudentSearchQuery('');
      setIsAddStudentModalOpen(false);
      showToast('success', 'Berhasil menambahkan santri ke grup');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menambahkan santri');
    }
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      if (!selectedDetailGrup) return;
      return apiClient.delete(`/pesantren/grup-daimi/${selectedDetailGrup.id}/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grup-daimi'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      refetchAllStudents();
      refetchGrupStudents();
      showToast('success', 'Santri berhasil dikeluarkan dari grup');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal mengeluarkan santri');
    }
  });

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGrup) {
      updateMutation.mutate({ id: editingGrup.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openAddModal = () => {
    setEditingGrup(null);
    setFormData({ 
      name: '', 
      jenis: '', 
      ketuaId: '', 
      cabangId: user?.scope === 'CABANG' && user?.cabangId ? user.cabangId : '' 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (grup: GrupDaimi) => {
    setEditingGrup(grup);
    setFormData({ 
      name: grup.name, 
      jenis: grup.jenis || '', 
      ketuaId: grup.ketuaId || '',
      cabangId: grup.cabangId || ''
    });
    setIsModalOpen(true);
  };

  const openDetailModal = (grup: GrupDaimi) => {
    setSelectedDetailGrup(grup);
    setFormData({
      name: grup.name,
      jenis: grup.jenis || '',
      ketuaId: grup.ketuaId || '',
      cabangId: grup.cabangId || ''
    });
  };

  const handleUpdateGroupDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDetailGrup) {
      updateMutation.mutate({ id: selectedDetailGrup.id, ...formData });
    }
  };

  const confirmDelete = (id: string) => {
    setGrupToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const executeDelete = () => {
    if (grupToDelete) {
      deleteMutation.mutate(grupToDelete);
      setIsConfirmModalOpen(false);
      setGrupToDelete(null);
    }
  };

  // Student filtering for Add Student
  const studentCandidates = allStudents.filter(s => {
    const isNotInThisGrup = !studentsInGrup.some(ex => ex.id === s.id);
    const isSameCabang = selectedDetailGrup?.cabangId 
      ? s.cabangId === selectedDetailGrup.cabangId
      : (user?.scope !== 'CABANG' || s.cabangId === user.cabangId);
    return isNotInThisGrup && s.isActive && isSameCabang;
  });

  const filteredCandidates = studentCandidates.filter(s => {
    if (!studentSearchQuery.trim()) return true;
    const query = studentSearchQuery.toLowerCase();
    const fullName = (s.biodata?.fullName || '').toLowerCase();
    const nisn = (s.biodata?.nisn || '').toLowerCase();
    return fullName.includes(query) || nisn.includes(query);
  });

  const isAllCandidatesSelected = filteredCandidates.length > 0 && filteredCandidates.every(s => selectedStudentIds.includes(s.id));

  const handleSelectAllCandidates = (checked: boolean) => {
    if (checked) {
      const candidateIds = filteredCandidates.map(s => s.id);
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...candidateIds])));
    } else {
      const candidateIdSet = new Set(filteredCandidates.map(s => s.id));
      setSelectedStudentIds(prev => prev.filter(id => !candidateIdSet.has(id)));
    }
  };

  const handleSelectStudentToggle = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Apply filters client-side
  const filteredGrupList = React.useMemo(() => {
    return (grupList || []).filter((grup) => {
      if (filterWilayah) {
        const wId = grup.cabang?.wilayahId || grup.cabang?.wilayah?.id;
        if (wId !== filterWilayah) return false;
      }
      // 2. Filter Cabang
      if (filterCabang && grup.cabangId !== filterCabang) {
        return false;
      }
      // 3. Filter Jenis
      if (filterJenis && grup.jenis !== filterJenis) {
        return false;
      }
      return true;
    });
  }, [grupList, filterWilayah, filterCabang, filterJenis]);

  // Analytical Calculations for Grup Daimi Cross-Tabulation Charts & Top Header
  const daimiStats = React.useMemo(() => {
    const relevantStudents = (allStudents || []).filter(s => {
      const hasDaimi = !!(s.dataDaimi?.grupId || s.dataDaimi?.grup?.jenis || s.grupDaimi || s.dataDaimi?.grup?.name);
      if (!hasDaimi) return false;
      if (user?.scope === 'CABANG' && s.cabangId !== user.cabangId) return false;
      if (filterWilayah) {
        const wId = s.wilayahId || (s as any).cabang?.wilayahId || (s as any).cabang?.wilayah?.id;
        if (wId !== filterWilayah) return false;
      }
      if (filterCabang && s.cabangId !== filterCabang) return false;
      const jenisName = s.dataDaimi?.grup?.jenis || s.grupDaimi;
      if (filterJenis && jenisName !== filterJenis) return false;
      return true;
    });

    const totalSantriDaimi = relevantStudents.length;

    const masterJenisNames = (jenisGrupDaimiList || []).map(j => j.name);
    
    // Matrix: jenisName -> { '7': 0, '8': 0, '9': 0, '10': 0, '11': 0, '12': 0, 'Non Muadalah': 0 }
    const matrix: Record<string, Record<string, number>> = {};

    const initTingkatObj = () => ({
      '7': 0, '8': 0, '9': 0, '10': 0, '11': 0, '12': 0, 'Non Muadalah': 0
    });

    masterJenisNames.forEach(jName => {
      matrix[jName] = initTingkatObj();
    });

    let santriFormalCount = 0;

    relevantStudents.forEach(s => {
      // 1. Determine jenisName
      const rawJenis = s.dataDaimi?.grup?.jenis || s.grupDaimi || 'Tanpa Jenis';
      const matchedMaster = (jenisGrupDaimiList || []).find(j => j.name.trim().toLowerCase() === rawJenis.trim().toLowerCase());
      const jKey = matchedMaster ? matchedMaster.name : rawJenis;

      if (!matrix[jKey]) {
        matrix[jKey] = initTingkatObj();
      }

      // 2. Determine tingkatKey
      let tKey = 'Non Muadalah';
      if (s.siswaFormal?.kelas) {
        santriFormalCount++;
        const rawTingkat = String(s.siswaFormal.kelas.tingkat || s.siswaFormal.kelas.name || '').toUpperCase().trim();
        if (rawTingkat.includes('12') || rawTingkat.includes('XII')) tKey = '12';
        else if (rawTingkat.includes('11') || rawTingkat.includes('XI')) tKey = '11';
        else if (rawTingkat.includes('10') || rawTingkat.includes('X')) tKey = '10';
        else if (rawTingkat.includes('9') || rawTingkat.includes('IX')) tKey = '9';
        else if (rawTingkat.includes('8') || rawTingkat.includes('VIII')) tKey = '8';
        else if (rawTingkat.includes('7') || rawTingkat.includes('VII')) tKey = '7';
        else if (s.siswaFormal.kelas.tingkat) tKey = String(s.siswaFormal.kelas.tingkat);
      }

      matrix[jKey][tKey] = (matrix[jKey][tKey] || 0) + 1;
    });

    const activeJenisCount = Object.keys(matrix).filter(jKey => {
      const sum = Object.values(matrix[jKey]).reduce((a, b) => a + b, 0);
      return sum > 0;
    }).length;

    return {
      totalSantriDaimi,
      santriFormalCount,
      matrix,
      activeJenisCount
    };
  }, [allStudents, jenisGrupDaimiList, user, filterWilayah, filterCabang, filterJenis]);

  // Filter out jenis grup with 0 total santri
  const activeJenisEntries = React.useMemo(() => {
    return Object.entries(daimiStats.matrix).filter(([_, tObj]) => {
      return Object.values(tObj).reduce((a, b) => a + b, 0) > 0;
    });
  }, [daimiStats.matrix]);

  const ALL_TINGKAT_KEYS = ['7', '8', '9', '10', '11', '12', 'Non Muadalah'];

  // Filter out Tingkat keys that have 0 santri for selected filter
  const visibleTingkatKeys = React.useMemo(() => {
    return ALL_TINGKAT_KEYS.filter((tingkatKey) => {
      if (selectedJenisForChart === 'ALL') {
        return Object.values(daimiStats.matrix).some(tObj => (tObj[tingkatKey] || 0) > 0);
      }
      return (daimiStats.matrix[selectedJenisForChart]?.[tingkatKey] || 0) > 0;
    });
  }, [daimiStats.matrix, selectedJenisForChart]);

  // Overall active tingkat keys for matrix table columns
  const activeMatrixTingkatKeys = React.useMemo(() => {
    return ALL_TINGKAT_KEYS.filter((tingkatKey) => {
      return Object.values(daimiStats.matrix).some(tObj => (tObj[tingkatKey] || 0) > 0);
    });
  }, [daimiStats.matrix]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-slate-800">Manajemen Grup Daimi</h2>
          <p className="text-sm text-slate-500">Kelola master data Grup Daimi yang digunakan pada penempatan santri dan mapel.</p>
        </div>
        {canManage && subTab === 'daftar' && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Grup
          </button>
        )}
      </div>

      {/* Sub-tab: Daftar Grup Daimi / Jenis Grup */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('daftar')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${subTab === 'daftar'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <Users className="w-4 h-4" />
            Daftar Grup Daimi
          </button>
          <button
            onClick={() => setSubTab('jenis')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${subTab === 'jenis'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <Tag className="w-4 h-4" />
            Jenis Grup
          </button>
        </div>
      </div>

      {subTab === 'jenis' ? (
        <JenisGrupDaimiManager />
      ) : (
      <>
      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
        {user?.scope === 'GLOBAL' && (
          <div className="w-full sm:w-48">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Filter Wilayah</label>
            <select
              value={filterWilayah}
              onChange={(e) => {
                setFilterWilayah(e.target.value);
                setFilterCabang(''); // reset cabang filter
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Wilayah</option>
              {wilayahList.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}

        {(user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH') && (
          <div className="w-full sm:w-48">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Filter Cabang</label>
            <select
              value={filterCabang}
              onChange={(e) => setFilterCabang(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Cabang</option>
              {cabangList
                .filter((c: any) => !filterWilayah || c.wilayahId === filterWilayah)
                .map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>
        )}

        <div className="w-full sm:w-48">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Filter Jenis</label>
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Semua Jenis</option>
            {jenisGrupDaimiList.map((j) => (
              <option key={j.id} value={j.name}>{j.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Section: Compact Stat Cards & Cross-Tabulation Charts (Grup Daimi x Tingkat) */}
      <div className="space-y-3">
        {/* 1. Compact 4 Stat Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Total Santri Daimi */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-3 shadow-sm flex items-center justify-between text-white border border-indigo-700/30">
            <div>
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">Santri Daimi</span>
              <span className="text-xl font-extrabold tracking-tight mt-0.5 block">{daimiStats.totalSantriDaimi.toLocaleString('id-ID')}</span>
              <span className="text-[10px] text-indigo-300 block">Total Santri Terdaftar</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-indigo-200" />
            </div>
          </div>

          {/* Card 2: Jumlah Grup Daimi */}
          <div className="rounded-2xl bg-white border border-slate-200 p-3 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Jumlah Grup</span>
              <span className="text-xl font-extrabold text-slate-800 tracking-tight mt-0.5 block">{filteredGrupList.length.toLocaleString('id-ID')}</span>
              <span className="text-[10px] text-slate-400 block">Kelompok Daimi Aktif</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Jenis Grup Terisi */}
          <div className="rounded-2xl bg-white border border-slate-200 p-3 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Jenis Grup</span>
              <span className="text-xl font-extrabold text-slate-800 tracking-tight mt-0.5 block">{daimiStats.activeJenisCount}</span>
              <span className="text-[10px] text-emerald-600 font-semibold block">Jenis Terisi Santri</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>

          {/* Card 4: Siswa Muadalah */}
          <div className="rounded-2xl bg-white border border-slate-200 p-3 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Siswa Muadalah</span>
              <span className="text-xl font-extrabold text-slate-800 tracking-tight mt-0.5 block">{daimiStats.santriFormalCount.toLocaleString('id-ID')}</span>
              <span className="text-[10px] text-amber-600 font-semibold block">
                {daimiStats.totalSantriDaimi > 0 ? `${Math.round((daimiStats.santriFormalCount / daimiStats.totalSantriDaimi) * 100)}% Terdaftar` : '0%'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 2. Side-by-Side Chart (7 cols) & Matrix Table (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          {/* Bar Chart Element (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between space-y-2.5">
            {/* Chart Header & Interactive Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Grafik Sebaran per Tingkat
                </h3>
              </div>

              {/* Filter Pills for Jenis Grup */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedJenisForChart('ALL')}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap ${
                    selectedJenisForChart === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Jenis
                </button>
                {activeJenisEntries.map(([jName]) => (
                  <button
                    key={jName}
                    type="button"
                    onClick={() => setSelectedJenisForChart(jName)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap ${
                      selectedJenisForChart === jName
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {jName}
                  </button>
                ))}
              </div>
            </div>

            {/* Bar Chart Body */}
            <div className="pt-1">
              {visibleTingkatKeys.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-center text-xs font-medium text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  Belum ada santri terdaftar pada jenis grup / tingkat ini.
                </div>
              ) : (
                <div className="h-28 flex items-end justify-around gap-1.5 sm:gap-3 pb-1 border-b border-slate-200 overflow-x-auto">
                  {visibleTingkatKeys.map((tingkatKey) => {
                    let count = 0;
                    if (selectedJenisForChart === 'ALL') {
                      Object.values(daimiStats.matrix).forEach(tObj => {
                        count += (tObj[tingkatKey] || 0);
                      });
                    } else {
                      count = daimiStats.matrix[selectedJenisForChart]?.[tingkatKey] || 0;
                    }

                    let selectedTotal = 0;
                    if (selectedJenisForChart === 'ALL') {
                      selectedTotal = daimiStats.totalSantriDaimi;
                    } else {
                      selectedTotal = Object.values(daimiStats.matrix[selectedJenisForChart] || {}).reduce((a, b) => a + b, 0);
                    }

                    const maxVal = Math.max(...visibleTingkatKeys.map(t => {
                      if (selectedJenisForChart === 'ALL') {
                        return Object.values(daimiStats.matrix).reduce((acc, tObj) => acc + (tObj[t] || 0), 0);
                      }
                      return daimiStats.matrix[selectedJenisForChart]?.[t] || 0;
                    }), 1);

                    const heightPercent = maxVal > 0 ? Math.max(Math.round((count / maxVal) * 100), 10) : 10;
                    const formattedTingkat = /^\d+$/.test(tingkatKey) ? `Tingkat ${tingkatKey}` : tingkatKey;
                    const percentageOfTotal = selectedTotal > 0 ? Math.round((count / selectedTotal) * 100) : 0;

                    return (
                      <div key={tingkatKey} className="group relative flex-1 flex flex-col items-center h-full justify-end min-w-[36px] max-w-[55px]">
                        {/* Tooltip */}
                        <div className="absolute -top-11 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg shadow-lg z-20 whitespace-nowrap flex flex-col items-center">
                          <span className="font-semibold">{formattedTingkat} ({selectedJenisForChart === 'ALL' ? 'Semua' : selectedJenisForChart})</span>
                          <span className="text-indigo-300 font-mono">{count.toLocaleString('id-ID')} santri ({percentageOfTotal}%)</span>
                          <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mb-1 mt-0.5" />
                        </div>

                        {/* Value Label Above Bar */}
                        <span className="text-[10px] font-bold text-slate-700 mb-0.5 group-hover:text-indigo-600 transition-colors">
                          {count.toLocaleString('id-ID')}
                        </span>

                        {/* Bar Element */}
                        <div 
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-indigo-400 rounded-t-md group-hover:from-indigo-500 group-hover:to-indigo-300 transition-all duration-300 shadow-sm cursor-pointer relative overflow-hidden"
                        />

                        {/* Label Below Bar */}
                        <span className="mt-1 text-[10px] font-semibold text-slate-600 truncate max-w-full text-center group-hover:text-indigo-600 transition-colors" title={formattedTingkat}>
                          {/^\d+$/.test(tingkatKey) ? `Tkg ${tingkatKey}` : (tingkatKey === 'Non Muadalah' ? 'Non-M' : tingkatKey)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Matriks Ringkasan Tabel (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Matriks Ringkasan
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                {activeJenisEntries.length} Jenis
              </span>
            </div>

            <div className="max-h-[140px] overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl">
              {activeJenisEntries.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-slate-400 italic">
                  Belum ada data jenis grup daimi yang terisi santri.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200 text-[11px]">
                  <thead className="bg-slate-50 font-bold text-slate-600 sticky top-0 z-10">
                    <tr>
                      <th className="px-2.5 py-1.5 text-left">Jenis</th>
                      {activeMatrixTingkatKeys.map(tKey => (
                        <th key={tKey} className="px-1.5 py-1.5 text-center">
                          {/^\d+$/.test(tKey) ? `Tkg ${tKey}` : (tKey === 'Non Muadalah' ? 'Non-M' : tKey)}
                        </th>
                      ))}
                      <th className="px-2 py-1.5 text-right bg-slate-100">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 bg-white">
                    {activeJenisEntries.map(([jName, tObj]) => {
                      const rowTotal = Object.values(tObj).reduce((a, b) => a + b, 0);
                      const isSelected = selectedJenisForChart === jName;
                      return (
                        <tr 
                          key={jName} 
                          onClick={() => setSelectedJenisForChart(jName)}
                          className={`cursor-pointer transition-colors hover:bg-indigo-50/50 ${isSelected ? 'bg-indigo-50/90 font-bold text-indigo-900' : 'text-slate-700'}`}
                        >
                          <td className="px-2.5 py-1 font-semibold truncate max-w-[90px]" title={jName}>
                            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 bg-indigo-500" />
                            {jName}
                          </td>
                          {activeMatrixTingkatKeys.map(tKey => {
                            const val = tObj[tKey] || 0;
                            return (
                              <td key={tKey} className="px-1.5 py-1 text-center">
                                {val > 0 ? (
                                  <span className="font-semibold text-slate-800">{val}</span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-2 py-1 text-right font-bold bg-slate-50 text-indigo-700">{rowTotal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Nama Grup Daimi</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Jenis</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Cabang - Wilayah</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Ketua Grup</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest">Jumlah Siswa</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredGrupList.map((grup) => (
                <tr key={grup.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                    {grup.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-650">
                    {grup.jenis ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {grup.jenis}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {grup.cabang ? (
                      <span>
                        {grup.cabang.name}{' '}
                        {grup.cabang.wilayah?.name && (
                          <span className="text-slate-400 text-xs">({grup.cabang.wilayah.name})</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {grup.ketua?.name || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-slate-800">
                    {grup.dataDaimi?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openDetailModal(grup)}
                      className="inline-flex items-center px-2 py-1 border border-slate-200 rounded text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Detail
                    </button>
                    {canManage && (
                      <>
                        <button
                          onClick={() => openEditModal(grup)}
                          className="inline-flex items-center px-2 py-1 border border-indigo-200 rounded text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(grup.id)}
                          className="inline-flex items-center px-2 py-1 border border-red-200 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Hapus
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredGrupList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Belum ada data Grup Daimi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* Add / Edit Quick Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingGrup ? 'Edit Grup Daimi' : 'Tambah Grup Daimi'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Grup *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="Contoh: Endonezya, Muadalah..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Grup</label>
                  <select
                    value={formData.jenis}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                  >
                    <option value="">-- Pilih Jenis Grup --</option>
                    {jenisGrupDaimiList.map(opt => (
                      <option key={opt.id} value={opt.name}>{opt.name}</option>
                    ))}
                  </select>
                </div>

                {user?.scope !== 'CABANG' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cabang</label>
                    <select
                      value={formData.cabangId}
                      onChange={(e) => setFormData({ ...formData, cabangId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                    >
                      <option value="">-- Pilih Cabang --</option>
                      {cabangList.map(cab => (
                        <option key={cab.id} value={cab.id}>{cab.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ketua Grup</label>
                  <select
                    value={formData.ketuaId}
                    onChange={(e) => setFormData({ ...formData, ketuaId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                  >
                    <option value="">-- Pilih Ketua Grup (Guru/Ustadz) --</option>
                    {staffList.map(staff => (
                      <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal (Grup Information & Student Management) */}
      {selectedDetailGrup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-800">
                  Detail Grup Daimi: {selectedDetailGrup.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDetailGrup(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
              {/* Left Side: Edit Group Info */}
              <div className="lg:border-r lg:border-slate-200 lg:pr-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  Informasi Grup
                </h4>
                <form onSubmit={handleUpdateGroupDetails} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Grup *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="Masukkan nama grup..."
                      disabled={!canManage}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Jenis Grup</label>
                    <select
                      value={formData.jenis}
                      onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white disabled:bg-slate-50"
                      disabled={!canManage}
                    >
                      <option value="">-- Pilih Jenis Grup --</option>
                      {jenisGrupDaimiList.map(opt => (
                        <option key={opt.id} value={opt.name}>{opt.name}</option>
                      ))}
                    </select>
                  </div>

                  {user?.scope !== 'CABANG' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cabang</label>
                      <select
                        value={formData.cabangId}
                        onChange={(e) => setFormData({ ...formData, cabangId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white disabled:bg-slate-50"
                        disabled={!canManage}
                      >
                        <option value="">-- Pilih Cabang --</option>
                        {cabangList.map(cab => (
                          <option key={cab.id} value={cab.id}>{cab.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ketua Grup (Guru/Ustadz)</label>
                    <select
                      value={formData.ketuaId}
                      onChange={(e) => setFormData({ ...formData, ketuaId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white disabled:bg-slate-50"
                      disabled={!canManage}
                    >
                      <option value="">-- Pilih Ketua Grup --</option>
                      {staffList.map(staff => (
                        <option key={staff.id} value={staff.id}>{staff.name}</option>
                      ))}
                    </select>
                  </div>

                  {canManage && (
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  )}
                </form>
              </div>

              {/* Right Side: Student Management List */}
              <div className="lg:col-span-2 flex flex-col h-full min-h-0">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-500" />
                    Anggota Grup ({studentsInGrup.length} Siswa)
                  </h4>
                  <button
                    onClick={() => { setSelectedStudentIds([]); setIsAddStudentModalOpen(true); }}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    Tambah Santri
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl min-h-[300px]">
                  {isLoadingGrupStudents ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Nama Lengkap</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">NISN</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Cabang</th>
                          <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-500 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-150">
                        {studentsInGrup.map(student => (
                          <tr key={student.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold text-slate-800">
                              {student.biodata?.fullName}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-500">
                              {student.biodata?.nisn || '-'}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-650 font-medium">
                              {student.cabang?.name || '-'}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-right text-xs">
                              <button
                                onClick={() => removeStudentMutation.mutate(student.id)}
                                className="inline-flex items-center px-2 py-1 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded border border-red-100 transition-colors"
                              >
                                <UserMinus className="w-3.5 h-3.5 mr-1" />
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                        {studentsInGrup.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
                              Belum ada siswa yang ditambahkan ke grup ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDetailGrup(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal (Nested inside Detail Modal) */}
      {isAddStudentModalOpen && selectedDetailGrup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-indigo-500" />
                Pilih Santri untuk Grup: {selectedDetailGrup.name}
              </h4>
              <button 
                onClick={() => setIsAddStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-655"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50/55 border-b border-slate-100 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama santri atau NISN..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                />
              </div>

              <div className="flex items-center justify-between px-1 text-xs text-slate-600 font-medium">
                <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={isAllCandidatesSelected}
                    onChange={(e) => handleSelectAllCandidates(e.target.checked)}
                    disabled={filteredCandidates.length === 0}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer disabled:opacity-50"
                  />
                  <span>Pilih Semua ({filteredCandidates.length} santri)</span>
                </label>
                {selectedStudentIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIds([])}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                  >
                    Batal Pilih ({selectedStudentIds.length})
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 min-h-[250px]">
              <div className="space-y-2">
                {filteredCandidates.map(student => {
                  const isChecked = selectedStudentIds.includes(student.id);
                  return (
                    <div 
                      key={student.id} 
                      onClick={() => handleSelectStudentToggle(student.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 font-semibold' 
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-semibold">{student.biodata?.fullName}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">NISN: {student.biodata?.nisn || '-'} | Cabang: {student.cabang?.name}</span>
                      </div>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        isChecked 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
                {filteredCandidates.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-500 font-medium">
                    Tidak ada santri yang tersedia.
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-semibold">
                {selectedStudentIds.length} santri dipilih
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-650 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => addStudentsMutation.mutate(selectedStudentIds)}
                  disabled={selectedStudentIds.length === 0 || addStudentsMutation.isPending}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-750 disabled:opacity-50 shadow-sm"
                >
                  {addStudentsMutation.isPending ? 'Menambahkan...' : 'Tambahkan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus Grup Daimi ini? Aksi ini tidak dapat dibatalkan dan akan ditolak sistem jika masih ada santri/mapel yang terikat."
      />
    </div>
  );
}
