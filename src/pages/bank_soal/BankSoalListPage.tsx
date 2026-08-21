import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  FileDown,
  Copy,
  Trash2,
  Edit,
  Clock,
  Building2,
  Calendar,
  Layers,
  FileText,
  UserCheck,
  CheckCircle,
  Share2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useBankSoalList,
  useBankSoalFilterOptions,
  useDeleteBankSoal,
  useDuplicateBankSoal,
  downloadBankSoalDocx,
} from '../../features/bank_soal/hooks/useBankSoal';
import { QuestionBankModal } from '../../features/bank_soal/components/QuestionBankModal';
import { DocxExportModal } from '../../features/bank_soal/components/DocxExportModal';
import type { QuestionBank } from '../../features/bank_soal/types';

export const BankSoalListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [bankToEdit, setBankToEdit] = useState<QuestionBank | null>(null);
  const [bankToExport, setBankToExport] = useState<QuestionBank | null>(null);

  const { data: filterOptions } = useBankSoalFilterOptions();
  const { data, isLoading, refetch } = useBankSoalList({
    search,
    subject: selectedSubject || undefined,
    gradeLevel: selectedGrade || undefined,
    onlyMine,
    page,
    limit: 12,
  });

  const deleteMutation = useDeleteBankSoal();
  const duplicateMutation = useDuplicateBankSoal();

  const handleDelete = async (bank: QuestionBank, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Apakah Anda yakin ingin menghapus paket "${bank.title}"? Seluruh butir soal di dalamnya akan ikut terhapus.`)) {
      try {
        await deleteMutation.mutateAsync(bank.id);
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus bank soal');
      }
    }
  };

  const handleDuplicate = async (bank: QuestionBank, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await duplicateMutation.mutateAsync(bank.id);
    } catch (err) {
      console.error(err);
      alert('Gagal menduplikasi bank soal');
    }
  };

  const handleOpenExport = (bank: QuestionBank, e: React.MouseEvent) => {
    e.stopPropagation();
    setBankToExport(bank);
  };

  const handleOpenEdit = (bank: QuestionBank, e: React.MouseEvent) => {
    e.stopPropagation();
    setBankToEdit(bank);
    setIsCreateModalOpen(true);
  };

  const banks = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Modul Pembuatan Soal & Generator DOCX</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Bank Soal & Naskah Ujian
          </h1>
          <p className="text-sm text-indigo-200/90 max-w-2xl">
            Kelola paket soal pilihan ganda (ABCD/ABCDE) dan esai dengan rumus matematika LaTeX, tabel, dan gambar, serta ekspor ke file Microsoft Word (.docx) siap cetak.
          </p>
        </div>

        <button
          onClick={() => {
            setBankToEdit(null);
            setIsCreateModalOpen(true);
          }}
          className="relative z-10 flex items-center gap-2 px-5 py-3 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span>Buat Paket Soal Baru</span>
        </button>

        {/* Decorative background shape */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari judul soal, mata pelajaran, atau lembaga..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mapel Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="">Semua Mata Pelajaran</option>
            {(filterOptions?.subjects || []).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Grade Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => {
              setSelectedGrade(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="">Semua Tingkat / Kelas</option>
            {(filterOptions?.gradeLevels || []).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Toggle Only Mine */}
          <button
            type="button"
            onClick={() => {
              setOnlyMine(!onlyMine);
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition ${
              onlyMine
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Hanya Buatan Saya</span>
          </button>
        </div>
      </div>

      {/* Question Bank Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : banks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Belum Ada Bank Soal</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Mulai buat paket naskah soal pertama Anda untuk memudahkan proses penyusunan dan cetak naskah ujian.
            </p>
          </div>
          <button
            onClick={() => {
              setBankToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Paket Soal Baru</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {banks.map((bank: QuestionBank) => {
            const questionCount = bank._count?.questions || bank.questions?.length || 0;
            const isOwner = bank.teacherId === user?.id || user?.scope === 'GLOBAL';

            return (
              <div
                key={bank.id}
                onClick={() => navigate(`/dashboard/bank-soal/${bank.id}`)}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between cursor-pointer relative"
              >
                <div className="space-y-3">
                  {/* Tags Header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-lg border border-indigo-100 dark:border-indigo-900">
                      {bank.subject}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px] rounded-md">
                        {bank.gradeLevel}
                      </span>
                      {bank.isShared && (
                        <span
                          title="Paket Dibagikan (Public)"
                          className="p-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-md"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-2">
                    {bank.title}
                  </h3>

                  {/* Metadata info */}
                  <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {questionCount} Butir Soal
                      </span>
                      {bank.timeLimit && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {bank.timeLimit} Menit
                          </span>
                        </>
                      )}
                    </div>
                    {bank.academicYear && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          TA {bank.academicYear} {bank.semester ? `(${bank.semester})` : ''}
                        </span>
                      </div>
                    )}
                    {bank.cabang?.name && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{bank.cabang.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer & Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 truncate max-w-[130px]">
                    Oleh: {bank.teacher?.operatorName || bank.teacher?.username || 'Guru'}
                  </span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleOpenExport(bank, e)}
                      title="Ekspor ke Word (.docx)"
                      className="p-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/60 rounded-lg hover:bg-blue-100 transition"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDuplicate(bank, e)}
                      title="Duplikat / Kloning Paket"
                      className="p-1.5 text-slate-600 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {isOwner && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(bank, e)}
                          title="Edit Info Paket"
                          className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(bank, e)}
                          title="Hapus Paket"
                          className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm text-slate-600 dark:text-slate-400">
          <span>
            Halaman {pagination.page} dari {pagination.totalPages} ({pagination.totalItems} Total Paket)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <QuestionBankModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setBankToEdit(null);
        }}
        bankToEdit={bankToEdit}
      />

      {bankToExport && (
        <DocxExportModal
          isOpen={!!bankToExport}
          onClose={() => setBankToExport(null)}
          bank={bankToExport}
        />
      )}
    </div>
  );
};
