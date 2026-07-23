import React from 'react';
import { GraduationCap, ClipboardList } from 'lucide-react';
import { Student } from '../hooks/useGetStudents';
import { useGetNilaiHistory, NilaiFormalHistory } from '../hooks/useNilaiHistory';

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
  const { data: history, isLoading } = useGetNilaiHistory(student.id);
  const groups = groupBySemester(history ?? []);

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
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Memuat data...</div>
        ) : groups.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Belum ada riwayat nilai rapor untuk siswa ini.</div>
        ) : (
          <div className="p-5 space-y-4">
            {groups.map(group => {
              const rata = average(group.items);
              return (
                <div key={group.key} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-700">{group.tahunAjaran}</span>
                      <SemesterBadge semester={group.semester} />
                      {group.kelasName && (
                        <span className="text-xs text-slate-500">Kelas: <span className="font-semibold text-slate-700">{group.kelasName}</span></span>
                      )}
                    </div>
                    {rata !== null && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-slate-400">Rata-rata</span>
                        <span className="text-sm font-extrabold text-emerald-700">{rata}</span>
                      </div>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead>
                        <tr className="bg-white">
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Mapel</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Grup</th>
                          <th className="px-4 py-2.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Harian</th>
                          <th className="px-4 py-2.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">PAS</th>
                          <th className="px-4 py-2.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Nilai Akhir</th>
                          <th className="px-4 py-2.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Predikat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.items.map(item => (
                          <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-4 py-2.5 text-sm font-semibold text-slate-800">
                              {item.mataPelajaran?.name || '-'}
                              <span className="ml-1.5 text-xs font-normal text-slate-400">({item.mataPelajaran?.kodeMapel || '-'})</span>
                            </td>
                            <td className="px-4 py-2.5 text-sm text-slate-500">{item.mataPelajaran?.grupMapel || '-'}</td>
                            <td className="px-4 py-2.5 text-sm text-center text-slate-600">{item.nilaiHarian ?? '-'}</td>
                            <td className="px-4 py-2.5 text-sm text-center text-slate-600">{item.nilaiPas ?? '-'}</td>
                            <td className="px-4 py-2.5 text-sm text-center font-bold text-slate-800">{item.nilaiAkhir ?? '-'}</td>
                            <td className="px-4 py-2.5 text-sm text-center text-slate-600">{item.predikat ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
