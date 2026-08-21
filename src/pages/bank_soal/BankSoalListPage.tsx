import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileQuestion,
  Plus,
  Search,
  Download,
  Copy,
  Trash2,
  Edit,
  FolderOpen,
  Calendar,
  Clock,
  Layers,
  ChevronRight,
  ListFilter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  UserCheck,
  Target,
  Building,
  Building2,
  User,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useBankSoalList,
  useBankSoalFilterOptions,
  useDeleteBankSoal,
  useDuplicateBankSoal,
  useBankSoalProjects,
  useBankSoalAssignments,
} from '../../features/bank_soal/hooks/useBankSoal';
import { QuestionBankModal } from '../../features/bank_soal/components/QuestionBankModal';
import { DocxExportModal } from '../../features/bank_soal/components/DocxExportModal';
import { CreateProjectModal } from '../../features/bank_soal/components/CreateProjectModal';
import { DelegateModal } from '../../features/bank_soal/components/DelegateModal';
import type { QuestionBank, BankSoalAssignment } from '../../features/bank_soal/types';

export const BankSoalListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'banks' | 'projects' | 'my-tasks'>('banks');

  // Filters & State for Tab 1 (Bank Soal)
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [page, setPage] = useState(1);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [bankToEdit, setBankToEdit] = useState<QuestionBank | null>(null);
  const [exportModalBank, setExportModalBank] = useState<QuestionBank | null>(null);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [delegateAssignment, setDelegateAssignment] = useState<BankSoalAssignment | null>(null);
  const [activeAssignmentContext, setActiveAssignmentContext] = useState<BankSoalAssignment | null>(null);

  // Queries
  const { data: bankData, isLoading: isLoadingBanks } = useBankSoalList({
    search: search || undefined,
    subject: selectedSubject || undefined,
    gradeLevel: selectedGrade || undefined,
    page,
    limit: 12,
    onlyMine,
  });

  const { data: filterOptions } = useBankSoalFilterOptions();
  const deleteMutation = useDeleteBankSoal();
  const duplicateMutation = useDuplicateBankSoal();

  // Project & Assignment Queries
  const { data: projects, isLoading: isLoadingProjects } = useBankSoalProjects();
  const { data: assignments, isLoading: isLoadingAssignments } = useBankSoalAssignments();
  const { data: myTasks, isLoading: isLoadingMyTasks } = useBankSoalAssignments({ onlyMine: true });

  const isGlobal = user?.scope === 'GLOBAL';
  const isWilayah = user?.scope === 'WILAYAH';
  const isCabang = user?.scope === 'CABANG';

  const handleDeleteBank = async (id: string, title: string) => {
    if (confirm(`Hapus paket soal "${title}"? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Gagal menghapus:', err);
      }
    }
  };

  const handleDuplicateBank = async (id: string) => {
    try {
      await duplicateMutation.mutateAsync(id);
    } catch (err) {
      console.error('Gagal menduplikasi:', err);
    }
  };

  const handleStartAssignment = (assignment: BankSoalAssignment) => {
    if (assignment.questionBankId) {
      navigate(`/dashboard/bank-soal/${assignment.questionBankId}`);
    } else {
      setActiveAssignmentContext(assignment);
      setIsCreateModalOpen(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Modul Bank Soal & Generator Naskah DOCX</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bank Soal & Penugasan Naskah Ujian
            </h1>
            <p className="text-sm text-indigo-100/80 mt-1 max-w-2xl">
              Kelola repositori butir soal, penugasan berjenjang (Pusat $\rightarrow$ Wilayah $\rightarrow$ Cabang $\rightarrow$ Guru), formula matematika LaTeX, dan ekspor Microsoft Word siap cetak.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isGlobal && (
              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-xl text-sm font-semibold transition shadow-sm"
              >
                <Target className="w-4 h-4 text-emerald-300" />
                <span>Buat Proyek Penugasan</span>
              </button>
            )}
            <button
              onClick={() => {
                setBankToEdit(null);
                setActiveAssignmentContext(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Paket Bank Soal</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Pattern */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('banks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            activeTab === 'banks'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          <span>Koleksi Bank Soal</span>
          {bankData?.pagination?.totalItems !== undefined && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'banks'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {bankData.pagination.totalItems}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            activeTab === 'projects'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Proyek & Penugasan Soal</span>
          {projects && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'projects'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {projects.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my-tasks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            activeTab === 'my-tasks'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Tugas Saya (Guru)</span>
          {myTasks && myTasks.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white animate-pulse">
              {myTasks.length}
            </span>
          )}
        </button>
      </div>

      {/* ================= TAB 1: KOLEKSI BANK SOAL ================= */}
      {activeTab === 'banks' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari judul, mapel, lembaga..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100"
              >
                <option value="">Semua Mapel</option>
                {filterOptions?.subjects?.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100"
              >
                <option value="">Semua Tingkat</option>
                {Array.from(
                  new Set([
                    'Kelas 7',
                    'Kelas 8',
                    'Kelas 9',
                    'Kelas 10',
                    'Kelas 11',
                    'Kelas 12',
                    ...(filterOptions?.gradeLevels || []),
                  ]),
                ).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOnlyMine(!onlyMine)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                  onlyMine
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                {onlyMine ? '✓ Soal Buatan Saya' : 'Soal Buatan Saya'}
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {isLoadingBanks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-56 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !bankData?.data || bankData.data.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileQuestion className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Belum Ada Bank Soal</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
                Mulai buat paket naskah soal baru dengan pilihan ganda, esai, rumus KaTeX, dan ekspor Word.
              </p>
              <button
                onClick={() => {
                  setBankToEdit(null);
                  setActiveAssignmentContext(null);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Paket Bank Soal</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {bankData.data.map((bank: QuestionBank) => (
                <div
                  key={bank.id}
                  className="group bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500/80 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800/60">
                          {bank.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-medium">
                          {bank.gradeLevel}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {bank._count?.questions || 0} Butir Soal
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => navigate(`/dashboard/bank-soal/${bank.id}`)}
                      className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 cursor-pointer transition line-clamp-2"
                    >
                      {bank.title}
                    </h3>

                    {/* Meta info */}
                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {bank.institution && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Building className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{bank.institution}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        {bank.timeLimit && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{bank.timeLimit} Menit</span>
                          </div>
                        )}
                        {bank.academicYear && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {bank.academicYear} ({bank.semester || 'Ganjil'})
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-1">
                        <span>Oleh: {bank.teacher?.operatorName || bank.teacher?.username || 'Guru'}</span>
                        {bank.cabang && <span>• {bank.cabang.name}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/dashboard/bank-soal/${bank.id}`)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition"
                    >
                      <span>Kelola Soal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        title="Unduh Naskah Word (.docx)"
                        onClick={() => setExportModalBank(bank)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        title="Edit Informasi Paket"
                        onClick={() => {
                          setBankToEdit(bank);
                          setActiveAssignmentContext(null);
                          setIsCreateModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        title="Duplikat Paket"
                        onClick={() => handleDuplicateBank(bank.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        title="Hapus Paket"
                        onClick={() => handleDeleteBank(bank.id, bank.title)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: PROYEK & PENUGASAN (TASK WORKFLOW) ================= */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Projects Table / Overview */}
          {isLoadingProjects ? (
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ) : !projects || projects.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Belum Ada Proyek Penugasan</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
                Admin Global dapat menerbitkan proyek naskah ujian dan mendistribusikan penugasan ke Wilayah, Cabang, dan Guru.
              </p>
              {isGlobal && (
                <button
                  onClick={() => setIsCreateProjectOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Terbitkan Proyek Penugasan</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {project.status}
                        </span>
                        {project.academicYear && (
                          <span className="text-xs font-semibold text-slate-500">
                            TA {project.academicYear} - {project.semester}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{project.title}</h2>
                      {project.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{project.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      {project.deadline && (
                        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                          <Clock className="w-4 h-4" />
                          <span>Deadline: {new Date(project.deadline).toLocaleDateString('id-ID')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {project.stats?.percentage}% Selesai
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {project.stats?.completed} / {project.stats?.total} Mapel
                          </div>
                        </div>
                        <div className="w-16 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${project.stats?.percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assignments Table inside project */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700">
                        <tr>
                          <th className="p-3">Mata Pelajaran</th>
                          <th className="p-3">Tingkat</th>
                          <th className="p-3 text-center">Target Soal</th>
                          <th className="p-3">Wilayah</th>
                          <th className="p-3">Cabang Pelaksana</th>
                          <th className="p-3">Guru Pengampu</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {project.assignments.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                              {item.subjectName}
                            </td>
                            <td className="p-3">{item.gradeLevel}</td>
                            <td className="p-3 text-center">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {item.targetMcqCount} PG / {item.targetEssayCount} Esai
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">
                              {item.wilayah?.name || (
                                <span className="text-slate-400 italic">Belum dipilih</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">
                              {item.cabang?.name || (
                                <span className="text-amber-500 font-medium">Menunggu Wilayah</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">
                              {item.teacher?.operatorName || item.teacher?.username || (
                                <span className="text-amber-500 font-medium">Menunggu Cabang</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.status === 'SELESAI' || item.status === 'DISETUJUI'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : item.status === 'DALAM_PROSES'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                    : item.status === 'DITUGASKAN'
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                }`}
                              >
                                {item.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Tombol Delegasikan / Tugaskan */}
                                {(isGlobal || isWilayah || isCabang) && (
                                  <button
                                    onClick={() => setDelegateAssignment(item)}
                                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition"
                                  >
                                    {isWilayah
                                      ? 'Delegasikan Cabang'
                                      : isCabang
                                      ? 'Tugaskan Guru'
                                      : 'Kelola Delegasi'}
                                  </button>
                                )}

                                {/* Tombol Kerjakan jika ditugaskan ke user atau cabang */}
                                {item.questionBankId ? (
                                  <button
                                    onClick={() => navigate(`/dashboard/bank-soal/${item.questionBankId}`)}
                                    className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition"
                                  >
                                    Lihat Naskah ({item.questionBank?._count?.questions || 0})
                                  </button>
                                ) : (
                                  (item.teacherId === user?.id || isCabang) && (
                                    <button
                                      onClick={() => handleStartAssignment(item)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                                    >
                                      Buat Soal
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: TUGAS SAYA (GURU) ================= */}
      {activeTab === 'my-tasks' && (
        <div className="space-y-6">
          {isLoadingMyTasks ? (
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ) : !myTasks || myTasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Semua Tugas Selesai / Belum Ada Tugas</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
                Saat Cabang atau Wilayah menugaskan pembuatan naskah soal kepada Anda, tugas akan otomatis tampil di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                        {task.subjectName}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium">
                        {task.gradeLevel}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                        {task.project?.title || 'Proyek Penugasan Naskah'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Target: <strong>{task.targetMcqCount} Soal PG</strong> & <strong>{task.targetEssayCount} Soal Esai</strong>
                      </p>
                    </div>

                    {task.project?.deadline && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Deadline: {new Date(task.project.deadline).toLocaleDateString('id-ID')}</span>
                      </div>
                    )}

                    {task.notes && (
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        <span className="font-semibold block mb-0.5 text-slate-700 dark:text-slate-200">Catatan Cabang:</span>
                        {task.notes}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        task.status === 'SELESAI'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {task.status.replace(/_/g, ' ')}
                    </span>

                    <button
                      onClick={() => handleStartAssignment(task)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-500/20"
                    >
                      <span>{task.questionBankId ? 'Lanjutkan Mengisi' : 'Mulai Buat Soal'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODALS ================= */}
      <QuestionBankModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setBankToEdit(null);
          setActiveAssignmentContext(null);
        }}
        bankToEdit={bankToEdit}
        assignmentContext={activeAssignmentContext}
        onSuccess={(created) => {
          navigate(`/dashboard/bank-soal/${created.id}`);
        }}
      />

      {exportModalBank && (
        <DocxExportModal
          isOpen={!!exportModalBank}
          onClose={() => setExportModalBank(null)}
          bank={exportModalBank}
        />
      )}

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />

      {delegateAssignment && (
        <DelegateModal
          isOpen={!!delegateAssignment}
          onClose={() => setDelegateAssignment(null)}
          assignment={delegateAssignment}
        />
      )}
    </div>
  );
};
