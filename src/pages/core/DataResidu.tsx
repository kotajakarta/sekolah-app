import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, XCircle, Search, RefreshCw } from 'lucide-react';
import apiClient from '../../lib/apiClient';

interface ResiduStudent {
  id: string;
  fullName: string;
  nisn: string | null;
  flags: Record<string, 'VALID' | 'EMPTY' | 'DUPLICATE'>;
}

export default function DataResidu() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: students, isLoading, isError, refetch } = useQuery<ResiduStudent[]>({
    queryKey: ['students-residu'],
    queryFn: async () => {
      const res = await apiClient.get('/students/residu');
      return res.data;
    }
  });

  const filteredStudents = (students || []).filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.fullName?.toLowerCase().includes(q) || s.nisn?.toLowerCase().includes(q);
  });

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

      {/* Legend & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Valid</div>
          <div className="flex items-center gap-1.5"><XCircle className="w-4 h-4 text-rose-500" /> Kosong</div>
          <div className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-500" /> Duplikat</div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm"
          />
        </div>
      </div>

      {/* Table */}
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
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">{idx + 1}</td>
                      <td className="px-4 py-3 sticky left-[52px] bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0] font-medium text-slate-900">
                        {student.fullName}
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
    </div>
  );
}
