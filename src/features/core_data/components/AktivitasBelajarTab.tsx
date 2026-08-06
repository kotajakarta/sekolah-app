import React, { useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, CheckCircle2, Clock, GraduationCap, School, Lock } from 'lucide-react';
import { Student } from '../hooks/useGetStudents';
import { useGetRiwayatKelas, useDeleteRiwayatKelas, RiwayatKelasFormal } from '../hooks/useRiwayatKelas';
import FormRiwayatKelasModal from './FormRiwayatKelasModal';
import ConfirmModal from '../../../components/ConfirmModal';
import { useAuth } from '../../../hooks/useAuth';

interface AktivitasBelajarTabProps {
  student: Student;
  onStatusChange: (isActive: boolean) => void;
}

const StatusBadge = ({ isActive }: { isActive?: boolean }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
    isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
    {isActive ? 'Kelas Aktif' : 'Selesai'}
  </span>
);

const SemesterBadge = ({ semester }: { semester: string }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
    Sem. {semester === 'GANJIL' ? '1' : semester === 'GENAP' ? '2' : semester}
  </span>
);

export default function AktivitasBelajarTab({ student, onStatusChange }: AktivitasBelajarTabProps) {
  const { user } = useAuth();
  const { data: histories, isLoading } = useGetRiwayatKelas(student.id);
  const deleteMutation = useDeleteRiwayatKelas();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<RiwayatKelasFormal | undefined>();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [historyIdToDelete, setHistoryIdToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setHistoryIdToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!historyIdToDelete) return;
    deleteMutation.mutate({ id: historyIdToDelete, studentId: student.id });
    setHistoryIdToDelete(null);
  };

  const openForm = (history?: RiwayatKelasFormal) => {
    setSelectedHistory(history);
    setIsFormOpen(true);
  };

  const activeKelasId = (student.siswaFormal as any)?.kelasId || student.siswaFormal?.kelas?.id;

  // Split: "Pendidikan Aktif Saat Ini" strictly refers to the ONE class where the student is currently enrolled
  let currentEnrolments: RiwayatKelasFormal[] = [];
  if (student.siswaFormal?.kelas && student.siswaFormal.kelas.isActive !== false) {
    const existingHistory = histories?.find(h => h.kelasId === activeKelasId);
    if (existingHistory) {
      currentEnrolments = [existingHistory];
    } else {
      currentEnrolments = [
        {
          id: 'current-active-class',
          studentId: student.id,
          kelasId: student.siswaFormal.kelas.id,
          tahunAjaran: student.siswaFormal.kelas.tahunAjaran || 'Saat ini',
          semester: 'AKTIF',
          statusAkhir: 'Siswa Aktif',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          kelas: {
            id: student.siswaFormal.kelas.id,
            name: student.siswaFormal.kelas.name,
            tingkat: student.siswaFormal.kelas.tingkat ? Number(student.siswaFormal.kelas.tingkat) : undefined,
            isActive: true,
            lembagaMuadalah: student.siswaFormal.kelas.lembagaMuadalah ? {
              id: student.siswaFormal.kelas.lembagaMuadalah.id,
              name: student.siswaFormal.kelas.lembagaMuadalah.name
            } : undefined
          }
        }
      ];
    }
  }

  // Riwayat Pendidikan Sebelumnya (Lampau): all other history records not belonging to current active class
  const pastEnrolments = histories?.filter(h => h.kelasId !== activeKelasId) ?? [];

  const canEdit = user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH' || user?.scope === 'CABANG';

  const HistoryTable = ({ items, emptyMsg, isReadonly = false }: { items: RiwayatKelasFormal[]; emptyMsg: string; isReadonly?: boolean }) => (
    items.length === 0 ? (
      <div className="text-center py-10 text-sm text-slate-400">{emptyMsg}</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Tahun Ajaran</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Semester</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Lembaga</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkat</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Rombel / Kelas</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Keterangan</th>
              {canEdit && !isReadonly && <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Aksi</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {items.map((riwayat) => (
              <tr key={riwayat.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{riwayat.tahunAjaran}</td>
                <td className="px-4 py-3">
                  <SemesterBadge semester={riwayat.semester} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{riwayat.kelas?.lembagaMuadalah?.name || '-'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {riwayat.kelas?.tingkat ? `Kelas ${riwayat.kelas.tingkat}` : '-'}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">{riwayat.kelas?.name || '-'}</td>
                <td className="px-4 py-3">
                  <StatusBadge isActive={riwayat.kelas?.isActive} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-500 max-w-[180px] truncate">
                  {riwayat.statusAkhir === 'NAIK_KELAS'
                    ? '↑ Naik Kelas'
                    : riwayat.statusAkhir === 'TINGGAL_KELAS'
                    ? '↔ Tinggal Kelas'
                    : riwayat.catatan || 'Siswa Aktif'}
                </td>
                {canEdit && !isReadonly && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openForm(riwayat)}
                        className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-100 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(riwayat.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );

  return (
    <div className="space-y-5">
      {/* ── Status Card ─────────────────────────────────── */}
      <div className={`relative overflow-hidden rounded-xl border p-4 ${
        student.isActive !== false
          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
          : 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              student.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'
            }`}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-800">
                  {student.isActive !== false ? 'Santri Aktif' : 'Santri Tidak Aktif'}
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  student.isActive !== false
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}>
                  {student.isActive !== false ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {student.isActive !== false
                  ? 'Santri sedang aktif mengikuti kegiatan belajar di pondok'
                  : 'Santri tidak sedang aktif mengikuti kegiatan belajar'}
              </p>
            </div>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => onStatusChange(student.isActive === false ? true : false)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all duration-150 ${
                student.isActive !== false
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
              }`}
            >
              {student.isActive !== false ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          )}
        </div>
      </div>

      {/* ── Pendidikan Aktif Saat Ini ────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-indigo-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-200" />
            <h4 className="text-sm font-bold text-white">Pendidikan Aktif Saat Ini</h4>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
              {isLoading ? '...' : currentEnrolments.length}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-medium flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Readonly (Mengikuti Rombel Aktif)
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Memuat data...</div>
        ) : (
          <HistoryTable
            items={currentEnrolments}
            emptyMsg="Belum terdaftar di Rombel Kelas aktif mana pun. Kelola penempatan di menu Rombongan Belajar (/dashboard/formal/kelas)."
            isReadonly={true}
          />
        )}
      </div>

      {/* ── Riwayat Pendidikan Sebelumnya ────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h4 className="text-sm font-bold text-slate-600">Riwayat Pendidikan Sebelumnya (Lampau)</h4>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 text-xs font-bold">
              {isLoading ? '...' : pastEnrolments.length}
            </span>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => openForm()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Riwayat Lampau
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Memuat data...</div>
        ) : (
          <HistoryTable
            items={pastEnrolments}
            emptyMsg="Belum ada riwayat pendidikan sebelumnya."
            isReadonly={false}
          />
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────── */}
      {isFormOpen && (
        <FormRiwayatKelasModal
          student={student}
          initialData={selectedHistory}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => { setIsConfirmDeleteOpen(false); setHistoryIdToDelete(null); }}
        onConfirm={confirmDelete}
        title="Hapus Riwayat Kelas"
        message="Apakah Anda yakin ingin menghapus riwayat kelas ini?"
      />
    </div>
  );
}
