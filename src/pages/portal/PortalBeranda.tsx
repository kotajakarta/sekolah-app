import React from 'react';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import { useGetRiwayatKelas } from '../../features/portal/hooks/useGetRiwayatKelas';
import { getStudentFotoUrl } from '../../utils/photo';
import { UserCircle, CheckCircle2, XCircle, GraduationCap, MapPin, History, Loader2, Award, Calendar, BookOpen } from 'lucide-react';

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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-sm text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Memuat data portal santri...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-sm text-rose-600 text-center font-medium">
        Gagal memuat data santri. Silakan muat ulang halaman.
      </div>
    );
  }

  if (!selectedStudentId || !selectedLink) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 text-center text-sm text-slate-500">
        Belum ada santri yang terhubung ke akun walisantri ini.
      </div>
    );
  }

  const student = selectedLink.student;
  const kelas = student.siswaFormal?.kelas;
  const mostRecent = riwayat[0];
  const fotoUrl = getStudentFotoUrl(student.biodata?.fotoUrl);

  return (
    <div className="space-y-6">
      {/* ── CARD UTAMA: PROFIL SANTRI ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50/80 to-transparent rounded-bl-full -z-0 pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
          <div className="shrink-0">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={student.biodata?.fullName ?? 'Santri'}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  (e.target as HTMLElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-400 ${fotoUrl ? 'hidden' : ''}`}>
              <UserCircle className="w-12 h-12" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{student.biodata?.fullName ?? '-'}</h1>
              {student.isActive === false ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <XCircle className="w-3.5 h-3.5" /> Nonaktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aktif Status Santri
                </span>
              )}
            </div>

            {student.statusHafidz && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                {STATUS_HAFIDZ_LABEL[student.statusHafidz] ?? student.statusHafidz}
              </div>
            )}

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
              <p className="flex items-center gap-2 font-medium">
                <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Kelas: <strong className="text-slate-800">{kelas?.name ? `${kelas.name}${kelas.tingkat ? ` (Tingkat ${kelas.tingkat})` : ''}` : 'Belum Terdaftar'}</strong></span>
              </p>
              <p className="flex items-center gap-2 font-medium">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Cabang: <strong className="text-slate-800">{student.cabang?.name ?? '-'}</strong></span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── GRID DESKTOP: SUMMARY & RIWAYAT KELAS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WAKIL WALI KELAS & INFO PERIODE */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-xs text-indigo-600 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Informasi Akademik
            </h2>
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-400 block font-medium">Wali Kelas Saat Ini</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{mostRecent?.waliKelas?.name ?? '-'}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-400 block font-medium">Tahun Ajaran / Semester</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                  {mostRecent ? `${mostRecent.tahunAjaran} — Semester ${mostRecent.semester}` : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIWAYAT KELAS */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-indigo-600" /> Riwayat Kelas Santri
          </h2>

          {isRiwayatLoading ? (
            <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Memuat riwayat...
            </div>
          ) : riwayat.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              Belum ada riwayat kelas tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2.5 pr-4">Periode</th>
                    <th className="py-2.5 pr-4">Kelas</th>
                    <th className="py-2.5">Wali Kelas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {riwayat.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 pr-4 font-semibold text-slate-800">
                        {r.tahunAjaran} — Semester {r.semester}
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-700">{r.kelas.name}</td>
                      <td className="py-3 text-slate-600">{r.waliKelas?.name ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
