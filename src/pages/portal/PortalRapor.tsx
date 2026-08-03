import React, { useMemo, useState } from 'react';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import { useGetRaporRiwayat } from '../../features/portal/hooks/useGetRaporRiwayat';
import { useGetHafalan } from '../../features/portal/hooks/useGetHafalan';
import { useGetRaporCetak } from '../../features/portal/hooks/useGetRaporCetak';
import { Loader2, Printer, BookOpen, X, GraduationCap, Award, Calendar } from 'lucide-react';

interface Period {
  tahunAjaran: string;
  semester: string;
}

function periodKey(p: Period) {
  return `${p.tahunAjaran}||${p.semester}`;
}

export default function PortalRapor() {
  const { selectedStudentId, isLoading, isError } = usePortalStudent();
  const { data: riwayat = [], isLoading: isRiwayatLoading } = useGetRaporRiwayat(selectedStudentId);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [showCetak, setShowCetak] = useState(false);

  const periods = useMemo<Period[]>(() => {
    const seen = new Set<string>();
    const list: Period[] = [];
    for (const row of riwayat) {
      const p = { tahunAjaran: row.tahunAjaran, semester: row.semester };
      const key = periodKey(p);
      if (!seen.has(key)) {
        seen.add(key);
        list.push(p);
      }
    }
    return list;
  }, [riwayat]);

  const activePeriod = selectedPeriod ?? periods[0] ?? null;

  const rows = useMemo(() => {
    if (!activePeriod) return [];
    return riwayat.filter(
      (r) => r.tahunAjaran === activePeriod.tahunAjaran && r.semester === activePeriod.semester
    );
  }, [riwayat, activePeriod]);

  const { data: hafalan } = useGetHafalan(
    selectedStudentId,
    activePeriod?.tahunAjaran ?? null,
    activePeriod?.semester ?? null
  );

  const { data: cetak, isLoading: isCetakLoading } = useGetRaporCetak(
    selectedStudentId,
    activePeriod?.tahunAjaran ?? null,
    activePeriod?.semester ?? null
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-sm text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Memuat data rapor...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-sm text-rose-600 text-center font-medium">
        Gagal memuat data rapor. Silakan muat ulang.
      </div>
    );
  }

  if (!selectedStudentId) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 text-center text-sm text-slate-500">
        Belum ada santri yang terhubung ke akun ini.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── CARD NILAI RAPOR ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <GraduationCap className="w-6 h-6 text-indigo-600" /> Rapor Akademik Santri
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Lihat transkrip nilai akademik per tahun ajaran dan semester.
            </p>
          </div>

          {periods.length > 0 && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={activePeriod ? periodKey(activePeriod) : ''}
                onChange={(e) => {
                  const found = periods.find((p) => periodKey(p) === e.target.value);
                  setSelectedPeriod(found ?? null);
                }}
                className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs outline-none"
              >
                {periods.map((p) => (
                  <option key={periodKey(p)} value={periodKey(p)}>
                    Tahun {p.tahunAjaran} — Semester {p.semester}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isRiwayatLoading ? (
          <div className="p-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Memuat nilai rapor...
          </div>
        ) : riwayat.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 my-4">
            Belum ada data nilai tersimpan untuk periode ini.
          </div>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 text-[11px]">
                    <th className="py-3 pr-4">Mata Pelajaran</th>
                    <th className="py-3 pr-4 text-center">Nilai Akhir</th>
                    <th className="py-3 text-center">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pr-4 font-semibold text-slate-800">{r.mataPelajaran.name}</td>
                      <td className="py-3.5 pr-4 text-center font-bold text-indigo-600">{r.nilaiAkhir ?? '-'}</td>
                      <td className="py-3.5 text-center">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          {r.predikat ?? '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowCetak(true)}
                disabled={!activePeriod || isCetakLoading || !cetak}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 py-2.5 text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isCetakLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                Cetak Rapor Digital
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── CARD HAFALAN AL-QURAN ── */}
      {hafalan && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-indigo-600" /> Capaian Hafalan Al-Qur'an
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Capaian Awal</p>
              <p className="font-bold text-slate-800 text-base mt-1">
                Putaran {hafalan.awalPutaran ?? '-'} <span className="text-slate-400 font-normal">/</span> Juz {hafalan.awalJuz ?? '-'}
              </p>
            </div>
            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <p className="text-indigo-600 text-[11px] font-bold uppercase tracking-wider">Target Semester</p>
              <p className="font-bold text-indigo-900 text-base mt-1">
                Putaran {hafalan.targetPutaran ?? '-'} <span className="text-indigo-300 font-normal">/</span> Juz {hafalan.targetJuz ?? '-'}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Capaian Akhir</p>
              <p className="font-bold text-slate-800 text-base mt-1">
                Putaran {hafalan.akhirPutaran ?? '-'} <span className="text-slate-400 font-normal">/</span> Juz {hafalan.akhirJuz ?? '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CETAK RAPOR ── */}
      {showCetak && cetak && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:bg-white print:static print:p-0">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 print:shadow-none print:border-0 print:rounded-none print:max-w-full">
            <div className="flex items-center justify-between print:hidden pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Pratinjau Rapor Santri</h3>
              <button onClick={() => setShowCetak(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <p className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight">{cetak.sekolah.namaLembaga}</p>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Laporan Hasil Belajar Santri — {cetak.akademik.tahunAjaran} (Semester {cetak.akademik.semester})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p><span className="text-slate-400">Nama Santri:</span> <strong>{cetak.siswa.fullName}</strong></p>
              <p><span className="text-slate-400">NISN / NIS:</span> <strong>{cetak.siswa.nisn || '-'}</strong></p>
              <p><span className="text-slate-400">Kelas:</span> <strong>{cetak.akademik.kelasName} ({cetak.akademik.tingkat})</strong></p>
              <p><span className="text-slate-400">Wali Kelas:</span> <strong>{cetak.akademik.waliKelasName}</strong></p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-200 text-[10px]">
                    <th className="py-2.5 pr-4">Mata Pelajaran</th>
                    <th className="py-2.5 pr-4 text-center">Nilai</th>
                    <th className="py-2.5 pr-4 text-center">Predikat</th>
                    <th className="py-2.5 text-center">Rata-rata Kelas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cetak.nilai.map((n) => (
                    <tr key={n.mataPelajaranId}>
                      <td className="py-2.5 pr-4 font-semibold text-slate-800">{n.namaMapel}</td>
                      <td className="py-2.5 pr-4 text-center font-bold text-indigo-600">{n.nilaiAkhir ?? '-'}</td>
                      <td className="py-2.5 pr-4 text-center font-semibold text-slate-700">{n.predikat ?? '-'}</td>
                      <td className="py-2.5 text-center text-slate-500">{n.rataRataKelas ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {cetak.siswa.isHafizlik && cetak.siswa.hafalan && (
              <div className="text-xs text-slate-700 border-t border-slate-100 pt-3 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100">
                <p className="font-bold text-indigo-900 mb-0.5">Hafalan Al-Qur'an</p>
                <p className="text-slate-600">
                  Capaian Akhir: Putaran {cetak.siswa.hafalan.akhirPutaran ?? '-'} / Juz {cetak.siswa.hafalan.akhirJuz ?? '-'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 print:hidden border-t border-slate-100">
              <button onClick={() => setShowCetak(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
