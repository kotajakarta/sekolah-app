import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import { useGetRiwayatKelas } from '../../features/portal/hooks/useGetRiwayatKelas';
import { UserCircle, CheckCircle2, XCircle, GraduationCap, MapPin, History, Loader2 } from 'lucide-react';

const STATUS_HAFIDZ_LABEL: Record<string, string> = {
  BELUM_MULAI: 'Belum Mulai Hafalan',
  SEDANG_BERLANGSUNG: 'Sedang Menghafal',
  SUDAH_SETOR_30_JUZ: 'Sudah Setor 30 Juz',
  SUDAH_KHATAMAN_KUBRO: 'Sudah Khataman Kubro',
};

export default function PortalBeranda() {
  const { selectedStudentId, selectedLink, isLoading, isError } = usePortalStudent();
  const { data: riwayat = [], isLoading: isRiwayatLoading } = useGetRiwayatKelas(selectedStudentId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-slate-500 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-rose-600">
        Gagal memuat data, coba lagi.
      </div>
    );
  }

  if (!selectedStudentId || !selectedLink) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-slate-500">
        Belum ada santri yang terhubung ke akun ini.
      </div>
    );
  }

  const student = selectedLink.student;
  const kelas = student.siswaFormal?.kelas;
  const mostRecent = riwayat[0];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            {student.biodata?.fotoUrl ? (
              <img
                src={student.biodata.fotoUrl}
                alt={student.biodata?.fullName ?? 'Santri'}
                className="w-16 h-16 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <UserCircle className="w-10 h-10" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-800">{student.biodata?.fullName ?? '-'}</h1>
              {student.isActive === false ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <XCircle className="w-3 h-3" /> Nonaktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Aktif
                </span>
              )}
            </div>
            {student.statusHafidz && (
              <p className="mt-1 text-xs font-semibold text-indigo-600">
                {STATUS_HAFIDZ_LABEL[student.statusHafidz] ?? student.statusHafidz}
              </p>
            )}
            <div className="mt-2 space-y-1 text-sm text-slate-500">
              <p className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                {kelas?.name ? `${kelas.name}${kelas.tingkat ? ` (Tingkat ${kelas.tingkat})` : ''}` : 'Belum ada kelas'}
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {student.cabang?.name ?? '-'}
                {student.wilayah?.name ? ` — ${student.wilayah.name}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <History className="w-4 h-4" /> Riwayat Kelas
        </h2>
        {isRiwayatLoading ? (
          <p className="mt-3 text-sm text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
          </p>
        ) : riwayat.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Belum ada riwayat kelas.</p>
        ) : (
          <>
            <p className="mt-3 text-sm text-slate-600">
              Wali kelas saat ini:{' '}
              <span className="font-semibold text-slate-800">{mostRecent.waliKelas?.name ?? '-'}</span>
            </p>
            {riwayat.length > 1 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-2 pr-4">Periode</th>
                      <th className="py-2 pr-4">Kelas</th>
                      <th className="py-2">Wali Kelas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {riwayat.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2 pr-4 text-slate-700">
                          {r.tahunAjaran} - Semester {r.semester}
                        </td>
                        <td className="py-2 pr-4 text-slate-700">{r.kelas.name}</td>
                        <td className="py-2 text-slate-700">{r.waliKelas?.name ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
