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
  ShieldCheck,
  Radio,
  ExternalLink,
  BookOpen,
  FileText,
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

  // Active Main Tab: matches PortalWalsanPage style
  const [activeTab, setActiveTab] = useState<'overview' | 'banks' | 'projects' | 'my-tasks'>('overview');

  // Filters & State for Tab (Bank Soal)
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
  const { data: myTasks, isLoading: isLoadingMyTasks } = useBankSoalAssignments({ onlyMine: true });

  const isGlobal = user?.scope === 'GLOBAL';
  const isWilayah = user?.scope === 'WILAYAH';
  const isCabang = user?.scope === 'CABANG';

  const totalBanksCount = bankData?.pagination?.totalItems ?? (bankData?.data?.length || 0);
  const totalProjectsCount = projects?.length || 0;
  const totalMyTasksCount = myTasks?.length || 0;

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
    <div className="space-y-6">
      {/* ── HEADER (PORTAL WALSAN STYLE) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bank Soal & Penugasan Naskah</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Pusat repositori butir soal, penugasan bertingkat, dan generator ekspor Microsoft Word (.docx).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isGlobal && (
            <button
              onClick={() => setIsCreateProjectOpen(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Target className="w-4 h-4 text-emerald-600" />
              <span>Buat Proyek Penugasan</span>
            </button>
          )}
          <button
            onClick={() => {
              setBankToEdit(null);
              setActiveAssignmentContext(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Paket Bank Soal</span>
          </button>
        </div>
      </div>

      {/* ── NAVIGATION TABS (PORTAL WALSAN STYLE) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-2xs flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Ringkasan & Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('banks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'banks'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          <span>Koleksi Bank Soal</span>
          {totalBanksCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'banks' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {totalBanksCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'projects'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Proyek Penugasan</span>
          {totalProjectsCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'projects' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {totalProjectsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my-tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'my-tasks'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Tugas Saya (Guru)</span>
          {totalMyTasksCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'my-tasks' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {totalMyTasksCount}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* STATS CARDS (PORTAL WALSAN STYLE) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <FileQuestion className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Total Paket Bank Soal</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{totalBanksCount} Paket</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Proyek Penugasan</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{totalProjectsCount} Proyek</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Tugas Naskah Aktif</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{totalMyTasksCount} Tugas</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Ekspor Word (.docx)</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">Siap Cetak</h3>
              </div>
            </div>
          </div>

          {/* QUICK ACCESS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PAKET SOAL TERBARU */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" /> Paket Bank Soal Terbaru
                </h3>
                <button
                  onClick={() => setActiveTab('banks')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  Lihat Semua <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {!bankData?.data || bankData.data.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500">Belum ada paket soal dibuat.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {bankData.data.slice(0, 4).map((b) => (
                    <div
                      key={b.id}
                      onClick={() => navigate(`/dashboard/bank-soal/${b.id}`)}
                      className="p-3.5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-extrabold border border-indigo-200">
                            {b.subject}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">{b.gradeLevel}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs truncate">{b.title}</h4>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold shrink-0">
                        {b._count?.questions || 0} Soal
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PROYEK PENUGASAN TERBARU */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" /> Proyek Penugasan Naskah
                </h3>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  Lihat Semua <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {!projects || projects.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500">Belum ada proyek penugasan aktif.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {projects.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setActiveTab('projects')}
                      className="p-3.5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                            {p.status}
                          </span>
                          {p.academicYear && (
                            <span className="text-[10px] font-semibold text-slate-500">TA {p.academicYear}</span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs truncate">{p.title}</h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-indigo-600">{p.stats?.percentage || 0}%</span>
                        <p className="text-[10px] text-slate-400">{p.stats?.completed}/{p.stats?.total} Mapel</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: KOLEKSI BANK SOAL ── */}
      {activeTab === 'banks' && (
        <div className="space-y-6">
          {/* FILTER BAR (PORTAL WALSAN STYLE) */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari judul, mapel, lembaga..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  onlyMine
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {onlyMine ? '✓ Soal Buatan Saya' : 'Soal Buatan Saya'}
              </button>
            </div>
          </div>

          {/* CARDS GRID (PORTAL WALSAN STYLE) */}
          {isLoadingBanks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-56 bg-slate-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : !bankData?.data || bankData.data.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
              <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
                <FileQuestion className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Belum Ada Bank Soal</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Mulai buat paket naskah soal baru dengan pilihan ganda, esai, rumus KaTeX, dan ekspor Word.
                </p>
              </div>
              <button
                onClick={() => {
                  setBankToEdit(null);
                  setActiveAssignmentContext(null);
                  setIsCreateModalOpen(true);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
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
                  className="bg-white rounded-3xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-2xs">
                          {bank.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                          {bank.gradeLevel}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-400">
                        {bank._count?.questions || 0} Butir Soal
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => navigate(`/dashboard/bank-soal/${bank.id}`)}
                      className="font-bold text-slate-900 text-base leading-snug hover:text-indigo-600 cursor-pointer transition line-clamp-2"
                    >
                      {bank.title}
                    </h3>

                    {/* Meta info */}
                    <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                      {bank.institution && (
                        <div className="flex items-center gap-1.5 truncate font-medium">
                          <Building className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{bank.institution}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 font-medium">
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
                  <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/dashboard/bank-soal/${bank.id}`)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
                    >
                      <span>Kelola Soal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        title="Unduh Naskah Word (.docx)"
                        onClick={() => setExportModalBank(bank)}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
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
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        title="Duplikat Paket"
                        onClick={() => handleDuplicateBank(bank.id)}
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        title="Hapus Paket"
                        onClick={() => handleDeleteBank(bank.id, bank.title)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
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

      {/* ── TAB 3: PROYEK PENUGASAN (PORTAL WALSAN STYLE) ── */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {isLoadingProjects ? (
            <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
          ) : !projects || projects.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
              <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
                <Target className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Belum Ada Proyek Penugasan</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Admin Global dapat menerbitkan proyek naskah ujian dan mendistribusikan penugasan ke Wilayah, Cabang, dan Guru.
                </p>
              </div>
              {isGlobal && (
                <button
                  onClick={() => setIsCreateProjectOpen(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
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
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {project.status}
                        </span>
                        {project.academicYear && (
                          <span className="text-xs font-bold text-slate-500">
                            TA {project.academicYear} - {project.semester}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">{project.title}</h2>
                      {project.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{project.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      {project.deadline && (
                        <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
                          <Clock className="w-4 h-4" />
                          <span>Deadline: {new Date(project.deadline).toLocaleDateString('id-ID')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-slate-900">
                            {project.stats?.percentage}% Selesai
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {project.stats?.completed} / {project.stats?.total} Mapel
                          </div>
                        </div>
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${project.stats?.percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assignments Table inside project */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3.5">Mata Pelajaran</th>
                          <th className="p-3.5">Tingkat</th>
                          <th className="p-3.5 text-center">Target Soal</th>
                          <th className="p-3.5">Wilayah</th>
                          <th className="p-3.5">Cabang Pelaksana</th>
                          <th className="p-3.5">Guru Pengampu</th>
                          <th className="p-3.5 text-center">Status</th>
                          <th className="p-3.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {project.assignments.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3.5 font-bold text-slate-900">
                              {item.subjectName}
                            </td>
                            <td className="p-3.5 font-medium text-slate-600">{item.gradeLevel}</td>
                            <td className="p-3.5 text-center">
                              <span className="font-bold text-slate-700">
                                {item.targetMcqCount} PG / {item.targetEssayCount} Esai
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-600 font-medium">
                              {item.wilayah?.name || (
                                <span className="text-slate-400 italic">Belum dipilih</span>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-600 font-medium">
                              {item.cabang?.name || (
                                <span className="text-amber-600 font-bold text-[11px]">Menunggu Wilayah</span>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-600 font-medium">
                              {item.teacher?.operatorName || item.teacher?.username || (
                                <span className="text-amber-600 font-bold text-[11px]">Menunggu Cabang</span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                  item.status === 'SELESAI' || item.status === 'DISETUJUI'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : item.status === 'DALAM_PROSES'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : item.status === 'DITUGASKAN'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {item.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {(isGlobal || isWilayah || isCabang) && (
                                  <button
                                    onClick={() => setDelegateAssignment(item)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                  >
                                    {isWilayah
                                      ? 'Delegasikan Cabang'
                                      : isCabang
                                      ? 'Tugaskan Guru'
                                      : 'Kelola Delegasi'}
                                  </button>
                                )}

                                {item.questionBankId ? (
                                  <button
                                    onClick={() => navigate(`/dashboard/bank-soal/${item.questionBankId}`)}
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                                  >
                                    Lihat Naskah ({item.questionBank?._count?.questions || 0})
                                  </button>
                                ) : (
                                  (item.teacherId === user?.id || isCabang) && (
                                    <button
                                      onClick={() => handleStartAssignment(item)}
                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
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

      {/* ── TAB 4: TUGAS SAYA GURU (PORTAL WALSAN STYLE) ── */}
      {activeTab === 'my-tasks' && (
        <div className="space-y-6">
          {isLoadingMyTasks ? (
            <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
          ) : !myTasks || myTasks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Semua Tugas Selesai / Belum Ada Tugas</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Saat Cabang atau Wilayah menugaskan pembuatan naskah soal kepada Anda, tugas akan otomatis tampil di sini.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-3xl border border-slate-200/80 hover:border-indigo-300 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-2xs">
                        {task.subjectName}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                        {task.gradeLevel}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        {task.project?.title || 'Proyek Penugasan Naskah'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Target: <strong className="text-slate-800">{task.targetMcqCount} PG</strong> & <strong className="text-slate-800">{task.targetEssayCount} Esai</strong>
                      </p>
                    </div>

                    {task.project?.deadline && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Deadline: {new Date(task.project.deadline).toLocaleDateString('id-ID')}</span>
                      </div>
                    )}

                    {task.notes && (
                      <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 border border-slate-100">
                        <span className="font-bold block mb-0.5 text-slate-800">Catatan Cabang:</span>
                        {task.notes}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        task.status === 'SELESAI'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {task.status.replace(/_/g, ' ')}
                    </span>

                    <button
                      onClick={() => handleStartAssignment(task)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
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

      {/* ── MODALS ── */}
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
