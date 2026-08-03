import { useMemo, useState } from 'react';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import { useGetRaporRiwayat } from '../../features/portal/hooks/useGetRaporRiwayat';
import { useGetHafalan } from '../../features/portal/hooks/useGetHafalan';
import { useGetRaporCetak } from '../../features/portal/hooks/useGetRaporCetak';
import { Loader2, Printer, BookOpen, X } from 'lucide-react';

interface Period {
  tahunAjaran: string;
  semester: string;
}

function periodKey(p: Period) {
  return `${p.tahunAjaran}||${p.semester}`;
}

export default function PortalRapor() {
  const { selectedStudentId, isLoading } = usePortalStudent();
  const { data: riwayat = [], isLoading: isRiwayatLoading } = useGetRaporRiwayat(selectedStudentId);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [showCetak, setShowCetak] = useState(false);

  // Riwayat is already ordered newest-first by the backend (tahunAjaran desc,
  // semester desc), so de-duping preserves that order.
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

  // Fetched (auto-enabled) as soon as a period is selected, rather than gated
  // behind refetch() — the "Cetak Rapor" button just opens the printable view
  // once data for the active period is ready.
  const { data: cetak, isLoading: isCetakLoading } = useGetRaporCetak(
    selectedStudentId,
    activePeriod?.tahunAjaran ?? null,
    activePeriod?.semester ?? null
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-slate-500 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
      </div>
    );
  }

  if (!selectedStudentId) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-slate-500">
        Belum ada santri yang terhubung ke akun ini.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-lg font-bold text-slate-800">Rapor</h1>
          {periods.length > 0 && (
            <select
              value={activePeriod ? periodKey(activePeriod) : ''}
              onChange={(e) => {
                const found = periods.find((p) => periodKey(p) === e.target.value);
                setSelectedPeriod(found ?? null);
              }}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {periods.map((p) => (
                <option key={periodKey(p)} value={periodKey(p)}>
                  {p.tahunAjaran} - Semester {p.semester}
                </option>
              ))}
            </select>
          )}
        </div>

        {isRiwayatLoading ? (
          <p className="mt-4 text-sm text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
          </p>
        ) : riwayat.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Belum ada data nilai.</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2 pr-4">Mata Pelajaran</th>
                    <th className="py-2 pr-4">Nilai Akhir</th>
                    <th className="py-2">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-4 text-slate-700">{r.mataPelajaran.name}</td>
                      <td className="py-2 pr-4 text-slate-700">{r.nilaiAkhir ?? '-'}</td>
                      <td className="py-2 text-slate-700">{r.predikat ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5">
              <button
                onClick={() => setShowCetak(true)}
                disabled={!activePeriod || isCetakLoading || !cetak}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 py-2.5 shadow-sm disabled:opacity-50"
              >
                {isCetakLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                Cetak Rapor
              </button>
            </div>
          </>
        )}
      </div>

      {hafalan && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Hafalan Al-Qur'an
          </h2>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide">Awal</p>
              <p className="font-semibold text-slate-800">
                Putaran {hafalan.awalPutaran ?? '-'} / Juz {hafalan.awalJuz ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide">Target</p>
              <p className="font-semibold text-slate-800">
                Putaran {hafalan.targetPutaran ?? '-'} / Juz {hafalan.targetJuz ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide">Akhir</p>
              <p className="font-semibold text-slate-800">
                Putaran {hafalan.akhirPutaran ?? '-'} / Juz {hafalan.akhirJuz ?? '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {showCetak && cetak && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 print:bg-white print:static print:p-0">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 space-y-4 print:shadow-none print:border-0 print:rounded-none print:max-w-full">
            <div className="flex items-center justify-between print:hidden">
              <h3 className="font-bold text-slate-800 text-base">Cetak Rapor</h3>
              <button onClick={() => setShowCetak(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <p className="font-bold text-slate-800">{cetak.sekolah.namaLembaga}</p>
              <p className="text-xs text-slate-500">
                Rapor {cetak.akademik.tahunAjaran} - Semester {cetak.akademik.semester}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <p>
                <span className="text-slate-400">Nama:</span> {cetak.siswa.fullName}
              </p>
              <p>
                <span className="text-slate-400">NISN:</span> {cetak.siswa.nisn || '-'}
              </p>
              <p>
                <span className="text-slate-400">Kelas:</span> {cetak.akademik.kelasName} ({cetak.akademik.tingkat})
              </p>
              <p>
                <span className="text-slate-400">Wali Kelas:</span> {cetak.akademik.waliKelasName}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2 pr-4">Mapel</th>
                    <th className="py-2 pr-4">Nilai</th>
                    <th className="py-2 pr-4">Predikat</th>
                    <th className="py-2">Rata Kelas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cetak.nilai.map((n) => (
                    <tr key={n.mataPelajaranId}>
                      <td className="py-2 pr-4">{n.namaMapel}</td>
                      <td className="py-2 pr-4">{n.nilaiAkhir ?? '-'}</td>
                      <td className="py-2 pr-4">{n.predikat ?? '-'}</td>
                      <td className="py-2">{n.rataRataKelas ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {cetak.siswa.isHafizlik && cetak.siswa.hafalan && (
              <div className="text-xs text-slate-600 border-t border-slate-100 pt-3">
                <p className="font-semibold text-slate-700 mb-1">Hafalan Al-Qur'an</p>
                <p>
                  Akhir: Putaran {cetak.siswa.hafalan.akhirPutaran ?? '-'} / Juz {cetak.siswa.hafalan.akhirJuz ?? '-'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 print:hidden">
              <button onClick={() => setShowCetak(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
