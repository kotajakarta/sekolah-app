import React, { useState } from 'react';
import { GraduationCap, ClipboardList, ChevronDown, ChevronRight, FileBarChart, Printer } from 'lucide-react';
import { Student } from '../hooks/useGetStudents';
import {
  useGetNilaiHistory,
  useGetMapelList,
  sortMapelList,
  getKeteranganTanpaNilai,
  NilaiFormalHistory
} from '../hooks/useNilaiHistory';
import TranskripNilaiModal from './TranskripNilaiModal';
import RaporCetakModal from '../../../pages/formal/RaporCetakModal';

interface RiwayatNilaiTabProps {
  student: Student;
}

const SemesterBadge = ({ semester }: { semester: string }) => {
  const normalized = semester?.toUpperCase();
  const label = normalized === 'GANJIL' ? 'Sem. 1 (Ganjil)' : normalized === 'GENAP' ? 'Sem. 2 (Genap)' : semester;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
      {label}
    </span>
  );
};

interface NilaiGroup {
  key: string;
  tahunAjaran: string;
  semester: string;
  kelasName?: string;
  items: NilaiFormalHistory[];
}

const groupBySemester = (history: NilaiFormalHistory[]): NilaiGroup[] => {
  const map = new Map<string, NilaiGroup>();
  history.forEach(item => {
    const key = `${item.tahunAjaran}__${item.semester}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        tahunAjaran: item.tahunAjaran,
        semester: item.semester,
        kelasName: item.kelas?.name,
        items: []
      });
    }
    map.get(key)!.items.push(item);
  });
  return Array.from(map.values());
};

const average = (items: NilaiFormalHistory[]) => {
  const values = items.map(i => i.nilaiAkhir).filter((v): v is number => v !== null && v !== undefined);
  if (values.length === 0) return null;
  return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
};

export default function RiwayatNilaiTab({ student }: RiwayatNilaiTabProps) {
  const { data: history, isLoading: isLoadingHistory } = useGetNilaiHistory(student.id);
  const { data: mapelList, isLoading: isLoadingMapel } = useGetMapelList();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isTranskripOpen, setIsTranskripOpen] = useState(false);
  const [cetakGroup, setCetakGroup] = useState<{ tahunAjaran: string; semester: string } | null>(null);

  const isLoading = isLoadingHistory || isLoadingMapel;
  const groups = groupBySemester(history ?? []);
  const sortedMapel = sortMapelList(mapelList ?? []);

  const grupDaimiId = student.dataDaimi?.grupId ?? null;
  const grupDaimiName = student.dataDaimi?.grup?.jenis || student.dataDaimi?.grup?.name || null;

  const toggleGroup = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-indigo-700">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-indigo-200" />
            <h4 className="text-sm font-bold text-white">Riwayat Nilai Rapor</h4>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
              {isLoading ? '...' : groups.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsTranskripOpen(true)}
            disabled={groups.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all"
          >
            <FileBarChart className="w-3.5 h-3.5" />
            Transkrip Nilai
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Memuat data...</div>
        ) : groups.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Belum ada riwayat nilai rapor untuk siswa ini.</div>
        ) : (
          <div className="p-5 space-y-3">
            {groups.map(group => {
              const rata = average(group.items);
              const nilaiMap = new Map(group.items.map(item => [item.mataPelajaranId, item]));
              const isOpen = !!expanded[group.key];
              return (
                <div key={group.key} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.key)}
                      className="flex items-center gap-2 flex-wrap flex-1 text-left"
                    >
                      {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-700">{group.tahunAjaran}</span>
                      <SemesterBadge semester={group.semester} />
                      {group.kelasName && (
                        <span className="text-xs text-slate-500">Kelas: <span className="font-semibold text-slate-700">{group.kelasName}</span></span>
                      )}
                    </button>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {rata !== null && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">Rata-rata</span>
                          <span className="text-sm font-extrabold text-emerald-700">{rata}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setCetakGroup({ tahunAjaran: group.tahunAjaran, semester: group.semester })}
                        title="Cetak Rapor periode ini"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Cetak Rapor
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100">
                        <thead>
                          <tr className="bg-white">
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Mapel</th>
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Grup</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Nilai Akhir</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-rata Kelas</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Predikat</th>
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sortedMapel.map(mapel => {
                            const nilai = nilaiMap.get(mapel.id);
                            const keterangan = nilai ? '-' : getKeteranganTanpaNilai(mapel, grupDaimiId, grupDaimiName);
                            return (
                              <tr key={mapel.id} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="px-4 py-2.5 text-sm font-semibold text-slate-800">
                                  {mapel.name}
                                  <span className="ml-1.5 text-xs font-normal text-slate-400">({mapel.kodeMapel})</span>
                                </td>
                                <td className="px-4 py-2.5 text-sm text-slate-500">{mapel.grupMapel}</td>
                                <td className="px-4 py-2.5 text-sm text-center font-bold text-slate-800">{nilai?.nilaiAkhir ?? '-'}</td>
                                <td className="px-4 py-2.5 text-sm text-center text-emerald-700 font-semibold">{nilai?.rataRataKelas ?? '-'}</td>
                                <td className="px-4 py-2.5 text-sm text-center text-slate-600">{nilai?.predikat ?? '-'}</td>
                                <td className="px-4 py-2.5 text-xs text-slate-400 italic">{keterangan}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isTranskripOpen && (
        <TranskripNilaiModal
          student={student}
          history={history ?? []}
          mapelList={sortedMapel}
          onClose={() => setIsTranskripOpen(false)}
        />
      )}

      {cetakGroup && (
        <RaporCetakModal
          studentId={student.id}
          tahunAjaran={cetakGroup.tahunAjaran}
          semester={cetakGroup.semester}
          onClose={() => setCetakGroup(null)}
        />
      )}
    </div>
  );
}
