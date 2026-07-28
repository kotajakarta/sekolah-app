import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { ClipboardCheck, Search, RefreshCw, UserPlus, UserCog, Calendar, MapPin } from 'lucide-react';

interface DaftarUlangStudent {
  id: string;
  statusPool: string;
  daftarUlangAt: string | null;
  daftarUlangJenis: 'BARU' | 'PEMBARUAN' | null;
  daftarUlangTahunAjaran: string | null;
  daftarUlangSemester: string | null;
  biodata?: { fullName: string; nik: string | null; nisn: string | null } | null;
  wilayah?: { name: string } | null;
  cabang?: { name: string } | null;
}

const JENIS_META: Record<string, { label: string; cls: string; icon: any }> = {
  BARU: { label: 'Pendaftar Baru', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: UserPlus },
  PEMBARUAN: { label: 'Pembaruan Data', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: UserCog }
};

export default function DaftarUlangSiswa() {
  const [search, setSearch] = useState('');
  const [jenisFilter, setJenisFilter] = useState<'ALL' | 'BARU' | 'PEMBARUAN'>('ALL');
  const [periodeFilter, setPeriodeFilter] = useState('');

  const { data: students = [], isLoading, isError, refetch, isFetching } = useQuery<DaftarUlangStudent[]>({
    queryKey: ['daftar-ulang-list'],
    queryFn: async () => (await apiClient.get('/students/daftar-ulang/list')).data
  });

  const periodeOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.daftarUlangTahunAjaran && s.daftarUlangSemester) {
        set.add(`${s.daftarUlangTahunAjaran}__${s.daftarUlangSemester}`);
      }
    });
    return Array.from(set).sort().reverse();
  }, [students]);

  const filtered = students.filter(s => {
    if (jenisFilter !== 'ALL' && s.daftarUlangJenis !== jenisFilter) return false;
    if (periodeFilter && `${s.daftarUlangTahunAjaran}__${s.daftarUlangSemester}` !== periodeFilter) return false;
    const q = search.trim().toLowerCase();
    if (q) {
      return s.biodata?.fullName?.toLowerCase().includes(q)
        || s.biodata?.nik?.toLowerCase().includes(q)
        || s.biodata?.nisn?.toLowerCase().includes(q);
    }
    return true;
  });

  const totalBaru = students.filter(s => s.daftarUlangJenis === 'BARU').length;
  const totalPembaruan = students.filter(s => s.daftarUlangJenis === 'PEMBARUAN').length;

  return (
    <div className="font-sans text-slate-800 animate-in fade-in duration-500 pb-10">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-800" />
            Daftar Ulang
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Santri/wali yang mengisi formulir Daftar Ulang publik — baik pendaftar baru maupun pembaruan data santri lama.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="self-start inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all bg-white shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Segarkan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Masuk</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{students.length}</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" /> Pendaftar Baru
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{totalBaru}</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <UserCog className="w-3.5 h-3.5 text-blue-600" /> Pembaruan Data
          </span>
          <div className="text-2xl font-bold text-blue-700 mt-1">{totalPembaruan}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, NIK, atau NISN..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={jenisFilter}
            onChange={e => setJenisFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-600 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Semua Jenis</option>
            <option value="BARU">Pendaftar Baru</option>
            <option value="PEMBARUAN">Pembaruan Data</option>
          </select>
          {periodeOptions.length > 0 && (
            <select
              value={periodeFilter}
              onChange={e => setPeriodeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-600 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Periode</option>
              {periodeOptions.map(p => {
                const [ta, sem] = p.split('__');
                return <option key={p} value={p}>{sem} {ta}</option>;
              })}
            </select>
          )}
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                <th className="p-4">Santri</th>
                <th className="p-4">Jenis</th>
                <th className="p-4">Penempatan</th>
                <th className="p-4">Periode</th>
                <th className="p-4">Waktu Masuk</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Memuat data daftar ulang...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-rose-500">
                    Gagal memuat data daftar ulang.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Belum ada santri yang mengisi formulir Daftar Ulang.
                  </td>
                </tr>
              ) : (
                filtered.map(s => {
                  const meta = s.daftarUlangJenis ? JENIS_META[s.daftarUlangJenis] : null;
                  const Icon = meta?.icon;
                  const penempatan = s.cabang?.name || (s.statusPool === 'TERSEDIA' ? null : s.wilayah?.name);
                  return (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-slate-800">{s.biodata?.fullName || '-'}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          NIK: {s.biodata?.nik || '-'} {s.biodata?.nisn ? `· NISN: ${s.biodata.nisn}` : ''}
                        </p>
                      </td>
                      <td className="p-4">
                        {meta ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border tracking-wide ${meta.cls}`}>
                            {Icon && <Icon className="w-3 h-3" />}
                            {meta.label}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-4">
                        {penempatan ? (
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {penempatan}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                            Belum Ditempatkan (Pool)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500">
                        {s.daftarUlangSemester && s.daftarUlangTahunAjaran ? `${s.daftarUlangSemester} ${s.daftarUlangTahunAjaran}` : '-'}
                      </td>
                      <td className="p-4 text-slate-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {s.daftarUlangAt
                            ? new Date(s.daftarUlangAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
