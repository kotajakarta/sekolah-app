import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import Pagination from '../../components/Pagination';

interface Gap {
  tingkat: number | null;
  semester: string | null;
  kind: 'NO_RIWAYAT' | 'NO_NILAI' | 'NO_RIWAYAT_SAMA_SEKALI';
}

interface ContinuityRow {
  studentId: string;
  fullName: string;
  nis: string;
  nisn: string;
  kelasName: string;
  tingkatSaatIni: string;
  gaps: Gap[];
}

const gapLabel = (gap: Gap) => {
  if (gap.kind === 'NO_RIWAYAT_SAMA_SEKALI') return 'Belum ada riwayat kelas sama sekali';
  const semLabel = gap.semester === 'Ganjil' ? 'Ganjil' : 'Genap';
  return `Tingkat ${gap.tingkat} - ${semLabel}`;
};

export default function RiwayatContinuityTab() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<any>({
    queryKey: ['erapor-riwayat-continuity', search, page],
    queryFn: async () => {
      const res = await apiClient.get('/formal/erapor/riwayat-continuity', {
        params: { search: search || undefined, page, pageSize: 20 }
      });
      return res.data;
    }
  });

  const summary = data?.summary;

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">Cek Kelengkapan Riwayat Belajar & Nilai</h2>
        </div>
        <p className="text-xs text-slate-500 max-w-3xl">
          Memindai semua siswa berkelas formal untuk menemukan tingkat/semester yang riwayat kelas atau nilainya
          masih kosong, dari tingkat pertama yang tercatat sampai tingkat siswa saat ini. Siswa yang riwayatnya
          sudah lengkap tidak ditampilkan di daftar bawah.
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Siswa Formal</p>
            <p className="text-xl font-extrabold text-slate-800">{summary.totalSiswaFormal}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
            <p className="text-[11px] text-emerald-700 uppercase font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Riwayat Lengkap</p>
            <p className="text-xl font-extrabold text-emerald-800">{summary.siswaLengkap}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
            <p className="text-[11px] text-amber-700 uppercase font-semibold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Perlu Ditindaklanjuti</p>
            <p className="text-xl font-extrabold text-amber-800">{summary.siswaBermasalah}</p>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            placeholder="Cari nama siswa..."
            className="flex-1 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button
            onClick={() => { setSearch(searchInput); setPage(1); }}
            className="inline-flex items-center justify-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Memindai riwayat siswa...</div>
        ) : !data || data.data.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            {search ? 'Tidak ada siswa yang cocok dengan pencarian.' : 'Tidak ada siswa dengan riwayat bermasalah. Semua lengkap!'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">NIS / NISN</th>
                  <th className="py-3 px-4">Kelas Saat Ini</th>
                  <th className="py-3 px-4 text-center">Tingkat</th>
                  <th className="py-3 px-4">Gap yang Ditemukan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((row: ContinuityRow, idx: number) => (
                  <tr key={row.studentId} className="hover:bg-slate-50/80 transition-colors align-top">
                    <td className="py-2.5 px-4 text-center text-slate-500 font-medium">{(data.page - 1) * data.pageSize + idx + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{row.fullName}</td>
                    <td className="py-2.5 px-4 text-slate-600">{row.nis || '-'} / {row.nisn || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-600">{row.kelasName}</td>
                    <td className="py-2.5 px-4 text-center text-teal-800 font-semibold">{row.tingkatSaatIni}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {row.gaps.map((gap, gidx) => (
                          <span
                            key={gidx}
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                              gap.kind === 'NO_NILAI'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {gapLabel(gap)}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && (
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
            totalItems={data.total}
            itemsPerPage={data.pageSize}
          />
        )}
      </div>
    </div>
  );
}
