import React from 'react';
import { X, Printer, FileBarChart } from 'lucide-react';
import { Student } from '../hooks/useGetStudents';
import { MapelWithKeaktifan, NilaiFormalHistory } from '../hooks/useNilaiHistory';

interface TranskripNilaiModalProps {
  student: Student;
  history: NilaiFormalHistory[];
  mapelList: MapelWithKeaktifan[];
  onClose: () => void;
}

interface Periode {
  key: string;
  tahunAjaran: string;
  semester: string;
  label: string;
}

const SEMESTER_ORDER: Record<string, number> = { GANJIL: 0, GENAP: 1 };

const semesterLabel = (semester: string) => {
  const normalized = semester?.toUpperCase();
  return normalized === 'GANJIL' ? 'Ganjil' : normalized === 'GENAP' ? 'Genap' : semester;
};

const getPeriodeList = (history: NilaiFormalHistory[]): Periode[] => {
  const map = new Map<string, Periode>();
  history.forEach(item => {
    const key = `${item.tahunAjaran}__${item.semester}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        tahunAjaran: item.tahunAjaran,
        semester: item.semester,
        label: `${item.tahunAjaran} - ${semesterLabel(item.semester)}`
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => {
    if (a.tahunAjaran !== b.tahunAjaran) return a.tahunAjaran.localeCompare(b.tahunAjaran);
    const orderA = SEMESTER_ORDER[a.semester?.toUpperCase()] ?? 2;
    const orderB = SEMESTER_ORDER[b.semester?.toUpperCase()] ?? 2;
    return orderA - orderB;
  });
};

export default function TranskripNilaiModal({ student, history, mapelList, onClose }: TranskripNilaiModalProps) {
  const periodeList = getPeriodeList(history);
  const nilaiMap = new Map(history.map(item => [`${item.tahunAjaran}__${item.semester}__${item.mataPelajaranId}`, item]));

  const getNilai = (mapelId: string, periode: Periode) => nilaiMap.get(`${periode.tahunAjaran}__${periode.semester}__${mapelId}`);

  const rataRataMapel = (mapelId: string) => {
    const values = periodeList
      .map(p => getNilai(mapelId, p)?.nilaiAkhir)
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return null;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  const rataRataPeriode = (periode: Periode) => {
    const values = mapelList
      .map(m => getNilai(m.id, periode)?.nilaiAkhir)
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return null;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  const TableContent = () => (
    <table className="min-w-full border-collapse text-xs">
      <thead>
        <tr className="bg-slate-100">
          <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-700 sticky left-0 bg-slate-100">Mata Pelajaran</th>
          {periodeList.map(p => (
            <th key={p.key} className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-700 whitespace-nowrap">{p.label}</th>
          ))}
          <th className="border border-slate-300 px-3 py-2 text-center font-bold text-emerald-800 whitespace-nowrap">Rata-rata</th>
        </tr>
      </thead>
      <tbody>
        {mapelList.map(mapel => (
          <tr key={mapel.id} className="hover:bg-indigo-50/30">
            <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-800 sticky left-0 bg-white">
              {mapel.name}
              <span className="ml-1 text-[11px] font-normal text-slate-400">({mapel.kodeMapel})</span>
            </td>
            {periodeList.map(p => (
              <td key={p.key} className="border border-slate-300 px-3 py-2 text-center text-slate-700">
                {getNilai(mapel.id, p)?.nilaiAkhir ?? '-'}
              </td>
            ))}
            <td className="border border-slate-300 px-3 py-2 text-center font-bold text-emerald-700">
              {rataRataMapel(mapel.id) ?? '-'}
            </td>
          </tr>
        ))}
        <tr className="bg-slate-50">
          <td className="border border-slate-300 px-3 py-2 font-bold text-slate-700 sticky left-0 bg-slate-50">Rata-rata Semester</td>
          {periodeList.map(p => (
            <td key={p.key} className="border border-slate-300 px-3 py-2 text-center font-bold text-emerald-800">
              {rataRataPeriode(p) ?? '-'}
            </td>
          ))}
          <td className="border border-slate-300 px-3 py-2" />
        </tr>
      </tbody>
    </table>
  );

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <FileBarChart className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Transkrip Nilai</h3>
                <p className="text-sm text-slate-500">{student.biodata?.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-3 py-1.5 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                <Printer className="h-4 w-4 mr-1.5 text-slate-500" />
                Cetak
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {periodeList.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400">Belum ada riwayat nilai untuk siswa ini.</div>
            ) : (
              <TableContent />
            )}
          </div>
        </div>
      </div>

      {/* Versi cetak: hanya tampil saat print, meniru gaya dokumen rapor resmi */}
      <div className="hidden print:block p-8 text-slate-900">
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1 mb-6">
          <h2 className="text-xl font-extrabold uppercase tracking-wider">Transkrip Nilai Akademik</h2>
          <p className="text-xs font-medium">
            {student.biodata?.fullName} {student.biodata?.nisn ? `- NISN: ${student.biodata.nisn}` : ''}
          </p>
        </div>
        {periodeList.length > 0 && <TableContent />}
      </div>
    </>
  );
}
