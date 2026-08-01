import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import {
  FileText,
  PlusCircle,
  FolderKanban,
  FileSpreadsheet,
  Settings,
  Search,
  Copy,
  Check,
  Download,
  Trash2,
  Upload,
  RefreshCw,
  Info,
  Calendar,
  Building,
  Layers,
  FileCheck,
  X,
  ExternalLink,
  Edit2,
  SlidersHorizontal,
} from 'lucide-react';

export default function SuratPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Active Main Tab: 'dashboard' | 'kelola' | 'template' | 'pengaturan'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kelola' | 'template' | 'pengaturan'>('dashboard');

  // Modal States
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State for Generate Surat
  const [genForm, setGenForm] = useState({
    letterTypeId: '',
    departmentId: '',
    institutionId: '',
    subject: '',
    addressedTo: '',
    letterDate: new Date().toISOString().split('T')[0],
  });
  const [genFile, setGenFile] = useState<File | null>(null);

  // Form State for Upload Template
  const [tmplForm, setTmplForm] = useState({
    title: '',
    description: '',
  });
  const [tmplFile, setTmplFile] = useState<File | null>(null);

  // Filters for Kelola Surat
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterInst, setFilterInst] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Settings Sub-tab: 'format' | 'dept' | 'inst' | 'type'
  const [settingsSubTab, setSettingsSubTab] = useState<'format' | 'dept' | 'inst' | 'type'>('format');

  // Master Data Modal / Form States
  const [masterModal, setMasterModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    target: 'dept' | 'inst' | 'type';
    data?: any;
  }>({ open: false, mode: 'create', target: 'dept' });

  const [masterForm, setMasterForm] = useState({ code: '', name: '' });
  const [formatInput, setFormatInput] = useState('');

  // ================= QUERIES =================
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['surat-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/surat/stats');
      return res.data;
    },
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['surat-departments'],
    queryFn: async () => {
      const res = await apiClient.get('/surat/departments');
      return res.data;
    },
  });

  const { data: institutions = [] } = useQuery<any[]>({
    queryKey: ['surat-institutions'],
    queryFn: async () => {
      const res = await apiClient.get('/surat/institutions');
      return res.data;
    },
  });

  const { data: letterTypes = [] } = useQuery<any[]>({
    queryKey: ['surat-types'],
    queryFn: async () => {
      const res = await apiClient.get('/surat/types');
      return res.data;
    },
  });

  const { data: formatTemplateData } = useQuery({
    queryKey: ['surat-format-template'],
    queryFn: async () => {
      const res = await apiClient.get('/surat/format-template');
      return res.data;
    },
  });

  const { data: letters = [], isLoading: isLettersLoading } = useQuery<any[]>({
    queryKey: ['surat-letters', searchQuery, filterType, filterDept, filterInst, filterMonth, filterYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterType) params.append('letterTypeId', filterType);
      if (filterDept) params.append('departmentId', filterDept);
      if (filterInst) params.append('institutionId', filterInst);
      if (filterMonth) params.append('month', filterMonth);
      if (filterYear) params.append('year', filterYear);

      const res = await apiClient.get(`/surat/letters?${params.toString()}`);
      return res.data;
    },
  });

  const { data: templates = [], isLoading: isTemplatesLoading } = useQuery<any[]>({
    queryKey: ['surat-templates-list'],
    queryFn: async () => {
      const res = await apiClient.get('/surat/templates');
      return res.data;
    },
  });

  // Set initial format input when query finishes
  React.useEffect(() => {
    if (formatTemplateData?.template) {
      setFormatInput(formatTemplateData.template);
    }
  }, [formatTemplateData]);

  // ================= MUTATIONS =================
  const generateMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('letterTypeId', genForm.letterTypeId);
      formData.append('departmentId', genForm.departmentId);
      formData.append('institutionId', genForm.institutionId);
      formData.append('subject', genForm.subject);
      formData.append('addressedTo', genForm.addressedTo);
      formData.append('letterDate', genForm.letterDate);
      if (genFile) formData.append('file', genFile);

      const res = await apiClient.post('/surat/letters/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['surat-letters'] });
      queryClient.invalidateQueries({ queryKey: ['surat-stats'] });
      setGeneratedResult(data);
      setIsGenerateModalOpen(false);
      setGenForm({
        letterTypeId: '',
        departmentId: '',
        institutionId: '',
        subject: '',
        addressedTo: '',
        letterDate: new Date().toISOString().split('T')[0],
      });
      setGenFile(null);
      showToast('success', 'Nomor Surat Berhasil Dibuat!');
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal membuat nomor surat.');
    },
  });

  const uploadTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!tmplFile) throw new Error('Pilih file template terlebih dahulu.');
      const formData = new FormData();
      formData.append('title', tmplForm.title);
      formData.append('description', tmplForm.description);
      formData.append('file', tmplFile);

      const res = await apiClient.post('/surat/templates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-templates-list'] });
      queryClient.invalidateQueries({ queryKey: ['surat-stats'] });
      setIsTemplateModalOpen(false);
      setTmplForm({ title: '', description: '' });
      setTmplFile(null);
      showToast('success', 'Template Surat Berhasil Diunggah!');
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || err?.message || 'Gagal mengunggah template.');
    },
  });

  const deleteLetterMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/surat/letters/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-letters'] });
      queryClient.invalidateQueries({ queryKey: ['surat-stats'] });
      showToast('success', 'Surat berhasil dihapus.');
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menghapus surat.');
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/surat/templates/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-templates-list'] });
      queryClient.invalidateQueries({ queryKey: ['surat-stats'] });
      showToast('success', 'Template berhasil dihapus.');
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menghapus template.');
    },
  });

  const saveFormatMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.put('/surat/format-template', { template: formatInput });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-format-template'] });
      showToast('success', 'Format Nomor Surat Berhasil Diperbarui!');
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menyimpan format.');
    },
  });

  const saveMasterMutation = useMutation({
    mutationFn: async () => {
      const endpoint = masterModal.target === 'dept' ? 'departments' : masterModal.target === 'inst' ? 'institutions' : 'types';
      if (masterModal.mode === 'create') {
        const res = await apiClient.post(`/surat/${endpoint}`, masterForm);
        return res.data;
      } else {
        const res = await apiClient.put(`/surat/${endpoint}/${masterModal.data.id}`, masterForm);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-departments'] });
      queryClient.invalidateQueries({ queryKey: ['surat-institutions'] });
      queryClient.invalidateQueries({ queryKey: ['surat-types'] });
      setMasterModal({ open: false, mode: 'create', target: 'dept' });
      setMasterForm({ code: '', name: '' });
      showToast('success', 'Data master berhasil disimpan.');
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menyimpan data master.');
    },
  });

  const deleteMasterMutation = useMutation({
    mutationFn: async ({ target, id }: { target: 'dept' | 'inst' | 'type'; id: string }) => {
      const endpoint = target === 'dept' ? 'departments' : target === 'inst' ? 'institutions' : 'types';
      const res = await apiClient.delete(`/surat/${endpoint}/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-departments'] });
      queryClient.invalidateQueries({ queryKey: ['surat-institutions'] });
      queryClient.invalidateQueries({ queryKey: ['surat-types'] });
      showToast('success', 'Data master berhasil dihapus.');
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menghapus data master.');
    },
  });

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('info', 'Nomor Surat disalin ke clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Preview live format string in settings
  const previewFormat = useMemo(() => {
    if (!formatInput) return '';
    return formatInput
      .replace(/\{sequence\}/g, '001')
      .replace(/\{seq\}/g, '001')
      .replace(/\{letter_type\}/g, 'SK')
      .replace(/\{type\}/g, 'SK')
      .replace(/\{department\}/g, 'SEKR')
      .replace(/\{dept\}/g, 'SEKR')
      .replace(/\{institution\}/g, 'PUSDATIN')
      .replace(/\{inst\}/g, 'PUSDATIN')
      .replace(/\{month\}/g, 'VIII')
      .replace(/\{month_num\}/g, '08')
      .replace(/\{year\}/g, '2026');
  }, [formatInput]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-100">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Modul Persuratan & Dokumentasi</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Manajemen Surat & Nomor Surat
            </h1>
            <p className="text-indigo-100 text-sm max-w-2xl leading-relaxed">
              Kelola penerbitan nomor surat resmi, pengarsipan surat keluar/masuk, template dokumen, dan pengaturan format surat instansi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 active:scale-95 transition-all shadow-lg text-sm"
            >
              <PlusCircle className="w-4 h-4 text-indigo-700" />
              <span>Buat Nomor Surat Baru</span>
            </button>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-800/60 hover:bg-indigo-800 border border-white/20 text-white font-medium active:scale-95 transition-all text-sm backdrop-blur-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Template</span>
            </button>
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 w-48 h-48 rounded-full bg-indigo-400/20 blur-xl pointer-events-none" />
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('kelola')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'kelola'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Kelola Surat</span>
        </button>

        <button
          onClick={() => setActiveTab('template')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'template'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Template Surat</span>
        </button>

        <button
          onClick={() => setActiveTab('pengaturan')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'pengaturan'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Pengaturan (Admin)</span>
        </button>
      </div>

      {/* ================= TAB 1: DASHBOARD ================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Surat Diterbitkan</p>
                <h3 className="text-2xl font-black text-slate-800">{stats?.totalLetters ?? 0}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Surat Bulan Ini</p>
                <h3 className="text-2xl font-black text-slate-800">{stats?.monthLetters ?? 0}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Template Dokumen</p>
                <h3 className="text-2xl font-black text-slate-800">{stats?.totalTemplates ?? 0}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Kategori Jenis Surat</p>
                <h3 className="text-2xl font-black text-slate-800">{stats?.totalTypes ?? 0}</h3>
              </div>
            </div>
          </div>

          {/* Quick Action & Recent Surat Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Action Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-400/30 inline-block">
                  Generator Nomor Surat
                </span>
                <h2 className="text-xl font-bold">Butuh Nomor Surat Resmi?</h2>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Gunakan fitur auto-generate untuk membuat nomor surat resmi sesuai format standar instansi secara otomatis tanpa risiko duplikasi.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-400 font-medium">
                  <span>Format Aktif:</span>
                  <span className="text-indigo-400 font-mono font-bold">
                    {formatTemplateData?.template || '{sequence}/{letter_type}/{department}/{institution}/{month}/{year}'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Buat Nomor Surat Baru</span>
              </button>
            </div>

            {/* Recent Letters Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Surat Terakhir Diterbitkan</h3>
                  <p className="text-xs text-slate-500">Daftar penerbitan nomor surat terbaru di sistem</p>
                </div>
                <button
                  onClick={() => setActiveTab('kelola')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Semua</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {isLettersLoading ? (
                <div className="py-12 text-center text-slate-400 text-sm">Loading data surat...</div>
              ) : letters.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm space-y-2">
                  <FileText className="w-10 h-10 mx-auto text-slate-300" />
                  <p>Belum ada nomor surat yang diterbitkan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                        <th className="py-3 px-3">Nomor Surat</th>
                        <th className="py-3 px-3">Perihal</th>
                        <th className="py-3 px-3">Tujuan</th>
                        <th className="py-3 px-3">Tanggal</th>
                        <th className="py-3 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {letters.slice(0, 5).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                            <div className="flex items-center gap-1.5">
                              <span>{item.generatedNumber}</span>
                              <button
                                onClick={() => handleCopy(item.generatedNumber, item.id)}
                                className="p-1 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title="Salin Nomor Surat"
                              >
                                {copiedId === item.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800 max-w-[200px] truncate">
                            {item.subject}
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-[150px] truncate">
                            {item.addressedTo}
                          </td>
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                            {item.letterDate}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {item.fileUrl ? (
                              <a
                                href={`${apiClient.defaults.baseURL}/surat/letters/download/${item.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 text-indigo-600 font-medium text-[11px]"
                              >
                                <Download className="w-3 h-3" />
                                <span>File</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: KELOLA SURAT ================= */}
      {activeTab === 'kelola' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nomor surat, perihal, atau tujuan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Buat Surat Baru</span>
              </button>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Semua Jenis Surat</option>
                {letterTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} - {t.name}
                  </option>
                ))}
              </select>

              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Semua Departemen</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>

              <select
                value={filterInst}
                onChange={(e) => setFilterInst(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Semua Institusi</option>
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.code} - {i.name}
                  </option>
                ))}
              </select>

              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Semua Bulan</option>
                {Array.from({ length: 12 }, (_, idx) => (
                  <option key={idx + 1} value={String(idx + 1)}>
                    Bulan {idx + 1}
                  </option>
                ))}
              </select>

              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Semua Tahun</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>

          {/* Table of Surat */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {isLettersLoading ? (
              <div className="py-16 text-center text-slate-400 text-sm">Memuat data surat...</div>
            ) : letters.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm space-y-2">
                <FileText className="w-12 h-12 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">Tidak ada surat ditemukan</p>
                <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter diatas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Nomor Surat</th>
                      <th className="py-3.5 px-4">Perihal & Tujuan</th>
                      <th className="py-3.5 px-4">Jenis / Kategori</th>
                      <th className="py-3.5 px-4">Dept & Institusi</th>
                      <th className="py-3.5 px-4">Tanggal & Pembuat</th>
                      <th className="py-3.5 px-4 text-center">File Dokumen</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {letters.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50/60 px-2.5 py-1 rounded border border-indigo-100">
                              {item.generatedNumber}
                            </span>
                            <button
                              onClick={() => handleCopy(item.generatedNumber, item.id)}
                              className="p-1 hover:bg-indigo-100 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                              title="Salin Nomor Surat"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-4 px-4 align-top max-w-xs space-y-1">
                          <p className="font-bold text-slate-800 text-xs leading-snug">{item.subject}</p>
                          <p className="text-[11px] text-slate-500">
                            Kepada: <span className="font-medium text-slate-700">{item.addressedTo}</span>
                          </p>
                        </td>

                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 font-semibold text-[11px]">
                            {item.letterType?.name || item.letterTypeId}
                          </span>
                        </td>

                        <td className="py-4 px-4 align-top space-y-1 text-[11px]">
                          <p className="text-slate-700 font-medium">{item.department?.name}</p>
                          <p className="text-slate-400">{item.institution?.name}</p>
                        </td>

                        <td className="py-4 px-4 align-top whitespace-nowrap text-[11px]">
                          <p className="font-semibold text-slate-700">{item.letterDate}</p>
                          <p className="text-slate-400">{item.user?.operatorName || item.user?.username || 'System'}</p>
                        </td>

                        <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                          {item.fileUrl ? (
                            <a
                              href={`${apiClient.defaults.baseURL}/surat/letters/download/${item.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] border border-indigo-200/60 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs font-italic">Tanpa file</span>
                          )}
                        </td>

                        <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus surat: ${item.generatedNumber}?`)) {
                                deleteLetterMutation.mutate(item.id);
                              }
                            }}
                            className="p-1.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Hapus Surat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: TEMPLATE SURAT ================= */}
      {activeTab === 'template' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-800">Template Surat Resmi</h3>
              <p className="text-xs text-slate-500">
                Unduh template resmi format Word / PDF untuk pembuatan dokumen instansi.
              </p>
            </div>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              <span>Unggah Template Baru</span>
            </button>
          </div>

          {/* Grid of Templates */}
          {isTemplatesLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Memuat daftar template...</div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200/80 space-y-3">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 text-base">Belum Ada Template Surat</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Silakan klik button "Unggah Template Baru" di atas untuk menambahkan berkas template surat (Docx/PDF).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Yakin hapus template "${tmpl.title}"?`)) {
                            deleteTemplateMutation.mutate(tmpl.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Hapus Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm">{tmpl.title}</h4>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {tmpl.description || 'Tidak ada deskripsi'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <div>
                      <p className="font-medium text-slate-600 truncate max-w-[150px]">{tmpl.originalName}</p>
                      <p>Oleh: {tmpl.user?.operatorName || tmpl.user?.username || 'Admin'}</p>
                    </div>

                    <a
                      href={`${apiClient.defaults.baseURL}/surat/templates/download/${tmpl.fileName}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: PENGATURAN ADMIN ================= */}
      {activeTab === 'pengaturan' && (
        <div className="space-y-6">
          {/* Sub Tab Header */}
          <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-xs overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setSettingsSubTab('format')}
              className={`px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                settingsSubTab === 'format' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Format Nomor Surat
            </button>
            <button
              onClick={() => setSettingsSubTab('type')}
              className={`px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                settingsSubTab === 'type' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Master Jenis Surat
            </button>
            <button
              onClick={() => setSettingsSubTab('dept')}
              className={`px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                settingsSubTab === 'dept' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Master Departemen
            </button>
            <button
              onClick={() => setSettingsSubTab('inst')}
              className={`px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                settingsSubTab === 'inst' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Master Institusi
            </button>
          </div>

          {/* Sub Tab Content: FORMAT NOMOR SURAT */}
          {settingsSubTab === 'format' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Pengaturan Format Nomor Surat</h3>
                <p className="text-xs text-slate-500">
                  Tentukan pola pola string untuk pembuatan nomor surat otomatis.
                </p>
              </div>

              {/* Format input form */}
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pattern Format Surat</label>
                  <input
                    type="text"
                    value={formatInput}
                    onChange={(e) => setFormatInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="{sequence}/{letter_type}/{department}/{institution}/{month}/{year}"
                  />
                </div>

                {/* Live Preview */}
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Contoh Hasil Preview Live:</p>
                  <p className="font-mono text-base font-bold text-emerald-400">{previewFormat}</p>
                </div>

                <button
                  onClick={() => saveFormatMutation.mutate()}
                  disabled={saveFormatMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm cursor-pointer"
                >
                  {saveFormatMutation.isPending ? 'Menyimpan...' : 'Simpan Format Nomor Surat'}
                </button>
              </div>

              {/* Legend guide */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <Info className="w-4 h-4 text-amber-700" />
                  <span>Petunjuk Variabel Tag Format:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div><code className="font-bold bg-amber-100 px-1 py-0.5 rounded text-amber-900">{'{sequence}'}</code> : Nomor urut 3 digit (misal: 001)</div>
                  <div><code className="font-bold bg-amber-100 px-1 py-0.5 rounded text-amber-900">{'{letter_type}'}</code> : Kode jenis surat (misal: SK)</div>
                  <div><code className="font-bold bg-amber-100 px-1 py-0.5 rounded text-amber-900">{'{department}'}</code> : Kode departemen (misal: SEKR)</div>
                  <div><code className="font-bold bg-amber-100 px-1 py-0.5 rounded text-amber-900">{'{institution}'}</code> : Kode institusi (misal: PUSDATIN)</div>
                  <div><code className="font-bold bg-amber-100 px-1 py-0.5 rounded text-amber-900">{'{month}'}</code> : Bulan dalam Romawi (misal: VIII)</div>
                  <div><code className="font-bold bg-amber-100 px-1 py-0.5 rounded text-amber-900">{'{month_num}'}</code> : Bulan angka 2 digit (misal: 08)</div>
                  <div><code className="font-bold bg-amber-100 px-1 py-0.5 rounded text-amber-900">{'{year}'}</code> : Tahun 4 digit (misal: 2026)</div>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab Content: MASTER TABLES (dept, inst, type) */}
          {settingsSubTab !== 'format' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Master Data {settingsSubTab === 'dept' ? 'Departemen' : settingsSubTab === 'inst' ? 'Institusi' : 'Jenis Surat'}
                  </h3>
                  <p className="text-xs text-slate-500">Kelola kode dan nama untuk format penomoran surat.</p>
                </div>
                <button
                  onClick={() => {
                    setMasterModal({
                      open: true,
                      mode: 'create',
                      target: settingsSubTab as any,
                    });
                    setMasterForm({ code: '', name: '' });
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Tambah Baru</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Kode</th>
                      <th className="py-3 px-4">Nama Lengkap</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(settingsSubTab === 'dept' ? departments : settingsSubTab === 'inst' ? institutions : letterTypes).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">{item.code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{item.name}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setMasterModal({
                                open: true,
                                mode: 'edit',
                                target: settingsSubTab as any,
                                data: item,
                              });
                              setMasterForm({ code: item.code, name: item.name });
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus ${item.code}?`)) {
                                deleteMasterMutation.mutate({ target: settingsSubTab as any, id: item.id });
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: GENERATE NOMOR SURAT ================= */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 space-y-6 relative my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Buat Nomor Surat Baru</h3>
                  <p className="text-xs text-slate-500">Isi parameter untuk menerbitkan nomor surat</p>
                </div>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Surat *</label>
                  <select
                    value={genForm.letterTypeId}
                    onChange={(e) => setGenForm({ ...genForm, letterTypeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">-- Pilih Jenis --</option>
                    {letterTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departemen *</label>
                  <select
                    value={genForm.departmentId}
                    onChange={(e) => setGenForm({ ...genForm, departmentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">-- Pilih Dept --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Institusi *</label>
                  <select
                    value={genForm.institutionId}
                    onChange={(e) => setGenForm({ ...genForm, institutionId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">-- Pilih Inst --</option>
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.code} - {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perihal / Judul Surat *</label>
                <input
                  type="text"
                  placeholder="Contoh: Permohonan Izin Penelitian / Surat Tugas Mengajar"
                  value={genForm.subject}
                  onChange={(e) => setGenForm({ ...genForm, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ditujukan Kepada *</label>
                <input
                  type="text"
                  placeholder="Contoh: Kepala Dinas Pendidikan / Ustadz Fulan"
                  value={genForm.addressedTo}
                  onChange={(e) => setGenForm({ ...genForm, addressedTo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Surat *</label>
                  <input
                    type="date"
                    value={genForm.letterDate}
                    onChange={(e) => setGenForm({ ...genForm, letterDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lampiran File (Opsional)</label>
                  <input
                    type="file"
                    onChange={(e) => setGenFile(e.target.files?.[0] || null)}
                    className="w-full px-2 py-1.5 text-xs text-slate-500 rounded-xl border border-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => generateMutation.mutate()}
                disabled={
                  generateMutation.isPending ||
                  !genForm.letterTypeId ||
                  !genForm.departmentId ||
                  !genForm.institutionId ||
                  !genForm.subject ||
                  !genForm.addressedTo
                }
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {generateMutation.isPending ? 'Generating...' : 'Terbitkan Nomor Surat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL RESULT GENERATE ================= */}
      {generatedResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800">Nomor Surat Berhasil Diterbitkan!</h3>
              <p className="text-xs text-slate-500">Nomor berikut telah dicatat ke dalam database sistem.</p>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl space-y-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nomor Surat Resmi:</p>
              <p className="font-mono text-lg font-black text-emerald-400 break-all">
                {generatedResult.generatedNumber}
              </p>

              <button
                onClick={() => handleCopy(generatedResult.generatedNumber, 'modal-result')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Nomor Surat</span>
              </button>
            </div>

            <div className="text-left text-xs bg-slate-50 p-4 rounded-xl space-y-1 text-slate-600">
              <p><span className="font-semibold text-slate-700">Perihal:</span> {generatedResult.subject}</p>
              <p><span className="font-semibold text-slate-700">Tujuan:</span> {generatedResult.addressedTo}</p>
              <p><span className="font-semibold text-slate-700">Tanggal:</span> {generatedResult.letterDate}</p>
            </div>

            <button
              onClick={() => setGeneratedResult(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Tutup & Selesai
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: UPLOAD TEMPLATE ================= */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Unggah Template Surat Baru</h3>
                  <p className="text-xs text-slate-500">Unggah berkas Word (.docx) atau PDF template</p>
                </div>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Template *</label>
                <input
                  type="text"
                  placeholder="Contoh: Template Surat Keputusan (SK) Guru"
                  value={tmplForm.title}
                  onChange={(e) => setTmplForm({ ...tmplForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  placeholder="Keterangan singkat penggunaan template surat..."
                  value={tmplForm.description}
                  onChange={(e) => setTmplForm({ ...tmplForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 h-20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">File Berkas Template *</label>
                <input
                  type="file"
                  onChange={(e) => setTmplFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 text-xs text-slate-500 rounded-xl border border-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => uploadTemplateMutation.mutate()}
                disabled={uploadTemplateMutation.isPending || !tmplForm.title || !tmplFile}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {uploadTemplateMutation.isPending ? 'Uploading...' : 'Unggah Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL MASTER DATA (Dept, Inst, Type) ================= */}
      {masterModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                {masterModal.mode === 'create' ? 'Tambah Data' : 'Edit Data'}{' '}
                {masterModal.target === 'dept' ? 'Departemen' : masterModal.target === 'inst' ? 'Institusi' : 'Jenis Surat'}
              </h3>
              <button
                onClick={() => setMasterModal({ ...masterModal, open: false })}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode *</label>
                <input
                  type="text"
                  placeholder="Contoh: SK / SEKR / PUSDATIN"
                  value={masterForm.code}
                  onChange={(e) => setMasterForm({ ...masterForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  placeholder="Contoh: Surat Keputusan / Sekretariat"
                  value={masterForm.name}
                  onChange={(e) => setMasterForm({ ...masterForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setMasterModal({ ...masterModal, open: false })}
                className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => saveMasterMutation.mutate()}
                disabled={saveMasterMutation.isPending || !masterForm.code || !masterForm.name}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                {saveMasterMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
