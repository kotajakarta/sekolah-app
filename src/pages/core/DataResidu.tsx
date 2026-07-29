import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, XCircle, Search, RefreshCw, Filter } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import AdvancedFilterBar, { FilterState } from '../../components/AdvancedFilterBar';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../hooks/useAuth';

interface ResiduStudent {
  id: string;
  wilayahId: string | null;
  cabangId: string | null;
  biodata?: {
    fullName: string;
  };
  siswaFormal?: {
    kelasId: string;
    kelas?: {
      tingkat: string;
      lembagaMuadalah?: {
        id: string;
      };
    };
  };
  dataDaimi?: {
    grup?: {
      jenis: string;
    };
  };
  grupDaimi?: string;
  nisn: string | null;
  flags: Record<string, 'VALID' | 'EMPTY' | 'DUPLICATE'>;
}

export default function DataResidu() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'EMPTY' | 'DUPLICATE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    wilayahId: user?.scope === 'WILAYAH' || user?.scope === 'CABANG' ? user?.wilayahId || '' : '',
    cabangId: user?.scope === 'CABANG' ? user?.cabangId || '' : '',
    kelasId: '',
    lembagaMuadalahId: '',
    jenisDaimi: '',
    tingkat: ''
  });

  const { data: students, isLoading, isError, refetch } = useQuery<ResiduStudent[]>({
    queryKey: ['students-residu'],
    queryFn: async () => {
      const res = await apiClient.get('/students/residu');
      return res.data;
    }
  });

  // Filter students based on all criteria
  const filteredStudents = (students || []).filter(s => {
    // RBAC Divisi scoping
    if (user?.divisi === 'FORMAL' && !s.siswaFormal) return false;
    if (user?.divisi === 'PESANTREN' && !s.dataDaimi && !s.grupDaimi) return false;

    // Advanced filters
    if (advancedFilters.wilayahId && s.wilayahId !== advancedFilters.wilayahId) return false;
    if (advancedFilters.cabangId && s.cabangId !== advancedFilters.cabangId) return false;
    if (advancedFilters.kelasId && s.siswaFormal?.kelasId !== advancedFilters.kelasId) return false;
    if (advancedFilters.lembagaMuadalahId && s.siswaFormal?.kelas?.lembagaMuadalah?.id !== advancedFilters.lembagaMuadalahId) return false;
    if (advancedFilters.jenisDaimi && s.dataDaimi?.grup?.jenis !== advancedFilters.jenisDaimi) return false;
    if (advancedFilters.tingkat && s.siswaFormal?.kelas?.tingkat !== advancedFilters.tingkat) return false;

    // Search query
    const q = searchQuery.toLowerCase();
    if (q) {
      const fullName = s.biodata?.fullName || '';
      const nisn = s.nisn || '';
      if (!fullName.toLowerCase().includes(q) && !nisn.toLowerCase().includes(q)) return false;
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      const hasDuplicate = Object.values(s.flags).includes('DUPLICATE');
      const hasEmpty = Object.values(s.flags).includes('EMPTY');
      
      if (statusFilter === 'DUPLICATE' && !hasDuplicate) return false;
      if (statusFilter === 'EMPTY' && !hasEmpty) return false;
      if (statusFilter === 'VALID' && (hasDuplicate || hasEmpty)) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const currentStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    { key: 'nisn', label: 'NISN' },
    { key: 'noGlodemy', label: 'ID Glodemy' },
    { key: 'nisLokal', label: 'NIS Lokal' },
    { key: 'nik', label: 'NIK' },
    { key: 'noKk', label: 'No KK' },
    { key: 'anakKe', label: 'Anak Ke' },
    { key: 'jumlahSaudara', label: 'Jml Saudara' },
    { key: 'tempatLahir', label: 'Tmpt Lahir' },
    { key: 'tanggalLahir', label: 'Tgl Lahir' },
    { key: 'namaAyah', label: 'Ayah' },
    { key: 'pekerjaanAyah', label: 'Pekerjaan Ayah' },
    { key: 'pendidikanAyah', label: 'Pendidikan Ayah' },
    { key: 'penghasilanAyah', label: 'Penghasilan Ayah' },
    { key: 'namaIbu', label: 'Ibu' },
    { key: 'pekerjaanIbu', label: 'Pekerjaan Ibu' },
    { key: 'pendidikanIbu', label: 'Pendidikan Ibu' },
    { key: 'penghasilanIbu', label: 'Penghasilan Ibu' },
    { key: 'address', label: 'Alamat' },
    { key: 'alamatProvId', label: 'Provinsi' },
    { key: 'alamatKabId', label: 'Kabupaten' },
    { key: 'alamatKecId', label: 'Kecamatan' },
    { key: 'alamatKelId', label: 'Kelurahan' },
    { key: 'alamatJalan', label: 'Jalan' },
    { key: 'phone', label: 'No HP' },
    { key: 'fotoUrl', label: 'Foto' },
    { key: 'ijazahUrl', label: 'Ijazah' },
    { key: 'kkUrl', label: 'Scan KK' },
  ];

  const renderIcon = (status: 'VALID' | 'EMPTY' | 'DUPLICATE') => {
    if (status === 'VALID') return <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />;
    if (status === 'EMPTY') return <XCircle className="w-5 h-5 text-rose-500 mx-auto" />;
    if (status === 'DUPLICATE') return <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />;
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Residu Santri</h1>
          <p className="text-slate-500 mt-1">Pantau kelengkapan dan validitas (duplikasi) data santri secara keseluruhan.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <AdvancedFilterBar
        onFilterChange={(newFilters) => {
          setAdvancedFilters(newFilters);
          setCurrentPage(1);
        }}
        userScope={user?.scope || ''}
        userWilayahId={user?.wilayahId}
        userCabangId={user?.cabangId}
        showDaimiFilter={true}
        showTingkatFilter={true}
      />

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'ALL' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Semua
          </button>
          <button
            onClick={() => { setStatusFilter('VALID'); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'VALID' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <CheckCircle2 className="w-4 h-4" /> Valid
          </button>
          <button
            onClick={() => { setStatusFilter('EMPTY'); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'EMPTY' ? 'bg-rose-50 text-rose-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <XCircle className="w-4 h-4" /> Kosong
          </button>
          <button
            onClick={() => { setStatusFilter('DUPLICATE'); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'DUPLICATE' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <AlertTriangle className="w-4 h-4" /> Duplikat
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau NISN..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            <p>Memuat data residu...</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-rose-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Gagal memuat data. Silakan coba lagi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 font-semibold sticky left-0 bg-slate-50 z-20 shadow-[1px_0_0_0_#e2e8f0]">No</th>
                  <th className="px-4 py-4 font-semibold sticky left-[52px] bg-slate-50 z-20 shadow-[1px_0_0_0_#e2e8f0] min-w-[200px]">Nama Lengkap</th>
                  {columns.map(col => (
                    <th key={col.key} className="px-4 py-4 font-semibold text-center">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentStudents.length > 0 ? (
                  currentStudents.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0] font-medium text-slate-600 text-center">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3 sticky left-[52px] bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0] font-medium text-slate-900">
                        {student.biodata?.fullName || '-'}
                      </td>
                      {columns.map(col => (
                        <td key={col.key} className="px-4 py-3 text-center">
                          {renderIcon(student.flags[col.key] || 'EMPTY')}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 2} className="px-4 py-12 text-center text-slate-500">
                      Tidak ada data santri yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
