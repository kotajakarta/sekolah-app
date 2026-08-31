import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save,
  RotateCcw,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
  Calendar,
  Clock,
  DollarSign,
  Phone,
  BookOpen,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ChevronRight,
  School,
  Building,
} from 'lucide-react';
import {
  ppdbService,
  DEFAULT_PPDB_CONFIG,
  PpdbFullConfig,
  PpdbBiayaItem,
  PpdbKontakItem,
  PpdbTimelineStep,
  PpdbAlurItem,
} from '../../services/ppdb.service';

export default function KelolaPpdb() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    'umum' | 'syarat' | 'timeline' | 'alur' | 'biaya' | 'kontak'
  >('umum');

  const [formData, setFormData] = useState<PpdbFullConfig>(DEFAULT_PPDB_CONFIG);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Fetch admin settings
  const { data, isLoading, isError } = useQuery<PpdbFullConfig>({
    queryKey: ['ppdb-admin-settings'],
    queryFn: () => ppdbService.getAdmin(),
  });

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (updated: PpdbFullConfig) => ppdbService.update(updated),
    onSuccess: (savedData) => {
      queryClient.setQueryData(['ppdb-admin-settings'], savedData);
      setFormData(savedData);
      setSuccessToast('Pengaturan PPDB berhasil disimpan!');
      setTimeout(() => setSuccessToast(null), 4000);
    },
    onError: (err: any) => {
      setErrorToast(err?.response?.data?.message || 'Gagal menyimpan pengaturan PPDB');
      setTimeout(() => setErrorToast(null), 4000);
    },
  });

  // Reset Mutation
  const resetMutation = useMutation({
    mutationFn: () => ppdbService.reset(),
    onSuccess: (defaultData) => {
      queryClient.setQueryData(['ppdb-admin-settings'], defaultData);
      setFormData(defaultData);
      setIsResetConfirmOpen(false);
      setSuccessToast('Pengaturan PPDB berhasil direset ke template standar PDF!');
      setTimeout(() => setSuccessToast(null), 4000);
    },
    onError: (err: any) => {
      setErrorToast(err?.response?.data?.message || 'Gagal mereset pengaturan');
      setTimeout(() => setErrorToast(null), 4000);
    },
  });

  const handleSave = () => {
    // Recalculate totals before saving
    const totalJadetabek = formData.data.biaya.items.reduce(
      (acc, cur) => acc + (Number(cur.jadetabek) || 0),
      0
    );
    const totalLuarJadetabek = formData.data.biaya.items.reduce(
      (acc, cur) => acc + (Number(cur.luarJadetabek) || 0),
      0
    );

    const payload: PpdbFullConfig = {
      ...formData,
      data: {
        ...formData.data,
        biaya: {
          ...formData.data.biaya,
          total: {
            jadetabek: totalJadetabek,
            luarJadetabek: totalLuarJadetabek,
          },
        },
      },
    };

    saveMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#0369A1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0369A1] uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Manajemen Landing Page & Informasi</span>
          </div>
          <h1 className="text-2xl font-black text-[#0A192F]">
            Kelola Penerimaan Santri Baru (PPDB)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sesuaikan konten informasi, syarat pendaftaran, masa studi, rincian biaya, dan kontak WhatsApp panitia wilayah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/ppdb"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            <span>Lihat Live Preview</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-rose-200 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Template</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-5 py-2.5 bg-[#0369A1] hover:bg-[#025682] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>

      {/* ── TOAST ALERTS ──────────────────────────────────── */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}
      {errorToast && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* ── TABS NAVIGATION ───────────────────────────────── */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 custom-scrollbar">
        {[
          { id: 'umum', label: '1. Info Umum & Portal', icon: Info },
          { id: 'syarat', label: '2. Syarat Pendaftaran', icon: CheckCircle2 },
          { id: 'timeline', label: '3. Timeline Masa Studi', icon: Clock },
          { id: 'alur', label: '4. Alur & Jadwal', icon: Calendar },
          { id: 'biaya', label: '5. Rincian Biaya & SPP', icon: DollarSign },
          { id: 'kontak', label: '6. Kontak Wilayah WhatsApp', icon: Phone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white text-[#0A192F] shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#0369A1]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {/* TAB 1: INFO UMUM */}
        {activeTab === 'umum' && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-lg font-extrabold text-[#0A192F] border-b pb-3">
              Informasi Umum & Identitas PSB
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  value={formData.tahunAjaran}
                  onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0369A1] focus:outline-none"
                  placeholder="Contoh: 2027–2028"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  URL Portal Pendaftaran Online
                </label>
                <input
                  type="url"
                  value={formData.portalUrl}
                  onChange={(e) => setFormData({ ...formData, portalUrl: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0369A1] focus:outline-none font-mono"
                  placeholder="https://pendaftaran.tahfidzsulaimaniyah.org/"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Semboyan / Tagline PSB
                </label>
                <input
                  type="text"
                  value={formData.semboyan}
                  onChange={(e) => setFormData({ ...formData, semboyan: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0369A1] focus:outline-none"
                  placeholder="Dari Indonesia, Untuk Indonesia..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Website Resmi Yayasan
                </label>
                <input
                  type="text"
                  value={formData.websiteResmi}
                  onChange={(e) => setFormData({ ...formData, websiteResmi: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0369A1] focus:outline-none"
                  placeholder="www.tahfidzsulaimaniyah.org"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded text-[#0369A1] focus:ring-[#0369A1]"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-800 cursor-pointer">
                  Aktifkan Halaman Publik PPDB (/ppdb)
                </label>
              </div>
            </div>

            {/* Program & Fasilitas Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
              {/* Program Unggulan */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Daftar Program Unggulan
                  </label>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        data: {
                          ...formData.data,
                          programUnggulan: [...formData.data.programUnggulan, 'Program Baru'],
                        },
                      })
                    }
                    className="text-xs font-bold text-[#0369A1] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.data.programUnggulan.map((prog, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={prog}
                        onChange={(e) => {
                          const updated = [...formData.data.programUnggulan];
                          updated[idx] = e.target.value;
                          setFormData({
                            ...formData,
                            data: { ...formData.data, programUnggulan: updated },
                          });
                        }}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0369A1] focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const updated = formData.data.programUnggulan.filter((_, i) => i !== idx);
                          setFormData({
                            ...formData,
                            data: { ...formData.data, programUnggulan: updated },
                          });
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fasilitas Unggulan */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Daftar Fasilitas Unggulan
                  </label>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        data: {
                          ...formData.data,
                          fasilitasUnggulan: [...formData.data.fasilitasUnggulan, 'Fasilitas Baru'],
                        },
                      })
                    }
                    className="text-xs font-bold text-[#0369A1] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.data.fasilitasUnggulan.map((fas, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={fas}
                        onChange={(e) => {
                          const updated = [...formData.data.fasilitasUnggulan];
                          updated[idx] = e.target.value;
                          setFormData({
                            ...formData,
                            data: { ...formData.data, fasilitasUnggulan: updated },
                          });
                        }}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0369A1] focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const updated = formData.data.fasilitasUnggulan.filter((_, i) => i !== idx);
                          setFormData({
                            ...formData,
                            data: { ...formData.data, fasilitasUnggulan: updated },
                          });
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SYARAT PENDAFTARAN */}
        {activeTab === 'syarat' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Persyaratan Umum */}
            <div>
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#0A192F]">A. Persyaratan Umum</h3>
                  <p className="text-xs text-slate-500">Berlaku untuk seluruh calon santri</p>
                </div>
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      data: {
                        ...formData.data,
                        syarat: {
                          ...formData.data.syarat,
                          umum: [...formData.data.syarat.umum, 'Syarat umum baru'],
                        },
                      },
                    })
                  }
                  className="text-xs font-bold text-[#0369A1] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Poin
                </button>
              </div>

              <div className="space-y-2.5">
                {formData.data.syarat.umum.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...formData.data.syarat.umum];
                        updated[idx] = e.target.value;
                        setFormData({
                          ...formData,
                          data: {
                            ...formData.data,
                            syarat: { ...formData.data.syarat, umum: updated },
                          },
                        });
                      }}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0369A1] focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const updated = formData.data.syarat.umum.filter((_, i) => i !== idx);
                        setFormData({
                          ...formData,
                          data: {
                            ...formData.data,
                            syarat: { ...formData.data.syarat, umum: updated },
                          },
                        });
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Persyaratan Khusus Wustha & Ulya */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
              {/* Wustha / SMP */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-extrabold text-sm text-[#0A192F]">
                    B.1 Jenjang Wustha / SMP
                  </h4>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        data: {
                          ...formData.data,
                          syarat: {
                            ...formData.data.syarat,
                            khusus: {
                              ...formData.data.syarat.khusus,
                              wustha: {
                                ...formData.data.syarat.khusus.wustha,
                                items: [
                                  ...formData.data.syarat.khusus.wustha.items,
                                  'Syarat khusus baru',
                                ],
                              },
                            },
                          },
                        },
                      })
                    }
                    className="text-xs font-bold text-[#0369A1] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tambah
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.data.syarat.khusus.wustha.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={it}
                        onChange={(e) => {
                          const updated = [...formData.data.syarat.khusus.wustha.items];
                          updated[idx] = e.target.value;
                          setFormData({
                            ...formData,
                            data: {
                              ...formData.data,
                              syarat: {
                                ...formData.data.syarat,
                                khusus: {
                                  ...formData.data.syarat.khusus,
                                  wustha: {
                                    ...formData.data.syarat.khusus.wustha,
                                    items: updated,
                                  },
                                },
                              },
                            },
                          });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#0369A1] focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const updated = formData.data.syarat.khusus.wustha.items.filter(
                            (_, i) => i !== idx
                          );
                          setFormData({
                            ...formData,
                            data: {
                              ...formData.data,
                              syarat: {
                                ...formData.data.syarat,
                                khusus: {
                                  ...formData.data.syarat.khusus,
                                  wustha: {
                                    ...formData.data.syarat.khusus.wustha,
                                    items: updated,
                                  },
                                },
                              },
                            },
                          });
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ulya / SMA */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-extrabold text-sm text-[#0A192F]">
                    B.2 Jenjang Ulya / SMA
                  </h4>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        data: {
                          ...formData.data,
                          syarat: {
                            ...formData.data.syarat,
                            khusus: {
                              ...formData.data.syarat.khusus,
                              ulya: {
                                ...formData.data.syarat.khusus.ulya,
                                items: [
                                  ...formData.data.syarat.khusus.ulya.items,
                                  'Syarat khusus baru',
                                ],
                              },
                            },
                          },
                        },
                      })
                    }
                    className="text-xs font-bold text-[#0369A1] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tambah
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.data.syarat.khusus.ulya.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={it}
                        onChange={(e) => {
                          const updated = [...formData.data.syarat.khusus.ulya.items];
                          updated[idx] = e.target.value;
                          setFormData({
                            ...formData,
                            data: {
                              ...formData.data,
                              syarat: {
                                ...formData.data.syarat,
                                khusus: {
                                  ...formData.data.syarat.khusus,
                                  ulya: {
                                    ...formData.data.syarat.khusus.ulya,
                                    items: updated,
                                  },
                                },
                              },
                            },
                          });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#0369A1] focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const updated = formData.data.syarat.khusus.ulya.items.filter(
                            (_, i) => i !== idx
                          );
                          setFormData({
                            ...formData,
                            data: {
                              ...formData.data,
                              syarat: {
                                ...formData.data.syarat,
                                khusus: {
                                  ...formData.data.syarat.khusus,
                                  ulya: {
                                    ...formData.data.syarat.khusus.ulya,
                                    items: updated,
                                  },
                                },
                              },
                            },
                          });
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TIMELINE MASA STUDI */}
        {activeTab === 'timeline' && (
          <div className="space-y-8 animate-in fade-in">
            {(['wusthaPutra', 'ulyaPutra', 'wusthaPutri'] as const).map((trackKey) => {
              const track = formData.data.timelinePendidikan[trackKey];
              return (
                <div key={trackKey} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                    <div>
                      <h3 className="font-extrabold text-base text-[#0A192F]">{track.title}</h3>
                      <span className="text-xs text-sky-700 font-semibold">{track.totalTahun}</span>
                    </div>
                    <button
                      onClick={() => {
                        const updatedTrack = {
                          ...track,
                          steps: [
                            ...track.steps,
                            { periode: 'Tahun Baru', durasi: '1 Tahun', target: 'Target Pembelajaran' },
                          ],
                        };
                        setFormData({
                          ...formData,
                          data: {
                            ...formData.data,
                            timelinePendidikan: {
                              ...formData.data.timelinePendidikan,
                              [trackKey]: updatedTrack,
                            },
                          },
                        });
                      }}
                      className="text-xs font-bold text-[#0369A1] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Tahap
                    </button>
                  </div>

                  <div className="space-y-3">
                    {track.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 bg-white rounded-xl border border-slate-200 items-center"
                      >
                        <div className="sm:col-span-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            Periode & Kelas
                          </label>
                          <input
                            type="text"
                            value={step.periode}
                            onChange={(e) => {
                              const updatedSteps = [...track.steps];
                              updatedSteps[idx] = { ...step, periode: e.target.value };
                              setFormData({
                                ...formData,
                                data: {
                                  ...formData.data,
                                  timelinePendidikan: {
                                    ...formData.data.timelinePendidikan,
                                    [trackKey]: { ...track, steps: updatedSteps },
                                  },
                                },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-[#0369A1]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            Durasi
                          </label>
                          <input
                            type="text"
                            value={step.durasi}
                            onChange={(e) => {
                              const updatedSteps = [...track.steps];
                              updatedSteps[idx] = { ...step, durasi: e.target.value };
                              setFormData({
                                ...formData,
                                data: {
                                  ...formData.data,
                                  timelinePendidikan: {
                                    ...formData.data.timelinePendidikan,
                                    [trackKey]: { ...track, steps: updatedSteps },
                                  },
                                },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-[#0369A1]"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            Target Capaian
                          </label>
                          <input
                            type="text"
                            value={step.target}
                            onChange={(e) => {
                              const updatedSteps = [...track.steps];
                              updatedSteps[idx] = { ...step, target: e.target.value };
                              setFormData({
                                ...formData,
                                data: {
                                  ...formData.data,
                                  timelinePendidikan: {
                                    ...formData.data.timelinePendidikan,
                                    [trackKey]: { ...track, steps: updatedSteps },
                                  },
                                },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-[#0369A1]"
                          />
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            onClick={() => {
                              const updatedSteps = track.steps.filter((_, i) => i !== idx);
                              setFormData({
                                ...formData,
                                data: {
                                  ...formData.data,
                                  timelinePendidikan: {
                                    ...formData.data.timelinePendidikan,
                                    [trackKey]: { ...track, steps: updatedSteps },
                                  },
                                },
                              });
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: ALUR & JADWAL */}
        {activeTab === 'alur' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0A192F]">
                  Alur & Jadwal Pendaftaran PSB
                </h3>
                <p className="text-xs text-slate-500">
                  Tahapan ujian seleksi dan jadwal pelaksanaan
                </p>
              </div>
              <button
                onClick={() => {
                  const nextNo = formData.data.alurPendaftaran.length + 1;
                  setFormData({
                    ...formData,
                    data: {
                      ...formData.data,
                      alurPendaftaran: [
                        ...formData.data.alurPendaftaran,
                        { no: nextNo, tahapan: 'Tahap Baru', jadwal: 'Tanggal Baru', catatan: '' },
                      ],
                    },
                  });
                }}
                className="text-xs font-bold text-[#0369A1] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Tahap
              </button>
            </div>

            <div className="space-y-3">
              {formData.data.alurPendaftaran.map((alur, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 items-center"
                >
                  <div className="sm:col-span-1 flex items-center justify-center">
                    <span className="w-8 h-8 rounded-xl bg-[#0A192F] text-white font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Nama Tahapan
                    </label>
                    <input
                      type="text"
                      value={alur.tahapan}
                      onChange={(e) => {
                        const updated = [...formData.data.alurPendaftaran];
                        updated[idx] = { ...alur, no: idx + 1, tahapan: e.target.value };
                        setFormData({
                          ...formData,
                          data: { ...formData.data, alurPendaftaran: updated },
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-[#0369A1]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Jadwal Pelaksanaan
                    </label>
                    <input
                      type="text"
                      value={alur.jadwal}
                      onChange={(e) => {
                        const updated = [...formData.data.alurPendaftaran];
                        updated[idx] = { ...alur, no: idx + 1, jadwal: e.target.value };
                        setFormData({
                          ...formData,
                          data: { ...formData.data, alurPendaftaran: updated },
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-[#0369A1]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Catatan / Keterangan
                    </label>
                    <input
                      type="text"
                      value={alur.catatan || ''}
                      onChange={(e) => {
                        const updated = [...formData.data.alurPendaftaran];
                        updated[idx] = { ...alur, no: idx + 1, catatan: e.target.value };
                        setFormData({
                          ...formData,
                          data: { ...formData.data, alurPendaftaran: updated },
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-[#0369A1]"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      onClick={() => {
                        const updated = formData.data.alurPendaftaran
                          .filter((_, i) => i !== idx)
                          .map((item, i) => ({ ...item, no: i + 1 }));
                        setFormData({
                          ...formData,
                          data: { ...formData.data, alurPendaftaran: updated },
                        });
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: RINCIAN BIAYA */}
        {activeTab === 'biaya' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0A192F]">
                  Rincian Biaya Infaq & SPP Bulanan
                </h3>
                <p className="text-xs text-slate-500">
                  Perbandingan nominal wilayah JADETABEK vs LUAR JADETABEK
                </p>
              </div>
              <button
                onClick={() => {
                  setFormData({
                    ...formData,
                    data: {
                      ...formData.data,
                      biaya: {
                        ...formData.data.biaya,
                        items: [
                          ...formData.data.biaya.items,
                          { nama: 'Komponen Baru', jadetabek: 1000000, luarJadetabek: 1000000 },
                        ],
                      },
                    },
                  });
                }}
                className="text-xs font-bold text-[#0369A1] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Komponen
              </button>
            </div>

            {/* List Biaya Items */}
            <div className="space-y-3">
              {formData.data.biaya.items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 items-center"
                >
                  <div className="sm:col-span-5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Nama Komponen
                    </label>
                    <input
                      type="text"
                      value={item.nama}
                      onChange={(e) => {
                        const updated = [...formData.data.biaya.items];
                        updated[idx] = { ...item, nama: e.target.value };
                        setFormData({
                          ...formData,
                          data: {
                            ...formData.data,
                            biaya: { ...formData.data.biaya, items: updated },
                          },
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-[#0369A1]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Nominal JADETABEK (Rp)
                    </label>
                    <input
                      type="number"
                      value={item.jadetabek}
                      onChange={(e) => {
                        const updated = [...formData.data.biaya.items];
                        updated[idx] = { ...item, jadetabek: Number(e.target.value) || 0 };
                        setFormData({
                          ...formData,
                          data: {
                            ...formData.data,
                            biaya: { ...formData.data.biaya, items: updated },
                          },
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-[#0369A1]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Nominal LUAR JADETABEK (Rp)
                    </label>
                    <input
                      type="number"
                      value={item.luarJadetabek}
                      onChange={(e) => {
                        const updated = [...formData.data.biaya.items];
                        updated[idx] = { ...item, luarJadetabek: Number(e.target.value) || 0 };
                        setFormData({
                          ...formData,
                          data: {
                            ...formData.data,
                            biaya: { ...formData.data.biaya, items: updated },
                          },
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-[#0369A1]"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      onClick={() => {
                        const updated = formData.data.biaya.items.filter((_, i) => i !== idx);
                        setFormData({
                          ...formData,
                          data: {
                            ...formData.data,
                            biaya: { ...formData.data.biaya, items: updated },
                          },
                        });
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* SPP Bulanan Section */}
            <div className="pt-6 border-t grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-emerald-900 uppercase block mb-2">
                  SPP Bulanan JADETABEK (Rp)
                </label>
                <input
                  type="number"
                  value={formData.data.biaya.sppBulanan.jadetabek}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      data: {
                        ...formData.data,
                        biaya: {
                          ...formData.data.biaya,
                          sppBulanan: {
                            ...formData.data.biaya.sppBulanan,
                            jadetabek: Number(e.target.value) || 0,
                          },
                        },
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-900 uppercase block mb-2">
                  SPP Bulanan LUAR JADETABEK (Rp)
                </label>
                <input
                  type="number"
                  value={formData.data.biaya.sppBulanan.luarJadetabek}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      data: {
                        ...formData.data,
                        biaya: {
                          ...formData.data.biaya,
                          sppBulanan: {
                            ...formData.data.biaya.sppBulanan,
                            luarJadetabek: Number(e.target.value) || 0,
                          },
                        },
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: KONTAK WILAYAH */}
        {activeTab === 'kontak' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0A192F]">
                  Daftar Kontak Panitia Wilayah
                </h3>
                <p className="text-xs text-slate-500">
                  Nomor telepon & WhatsApp panitia untuk calon santri Putra dan Putri
                </p>
              </div>
              <button
                onClick={() => {
                  setFormData({
                    ...formData,
                    data: {
                      ...formData.data,
                      kontakWilayah: [
                        ...formData.data.kontakWilayah,
                        {
                          wilayah: 'Nama Wilayah Baru',
                          kontakPutra: '+62 8...',
                          waPutra: '628...',
                          kontakPutri: '+62 8...',
                          waPutri: '628...',
                        },
                      ],
                    },
                  });
                }}
                className="text-xs font-bold text-[#0369A1] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Wilayah
              </button>
            </div>

            <div className="space-y-4">
              {formData.data.kontakWilayah.map((kontak, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 max-w-sm">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Nama Wilayah
                      </label>
                      <input
                        type="text"
                        value={kontak.wilayah}
                        onChange={(e) => {
                          const updated = [...formData.data.kontakWilayah];
                          updated[idx] = { ...kontak, wilayah: e.target.value };
                          setFormData({
                            ...formData,
                            data: { ...formData.data, kontakWilayah: updated },
                          });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white focus:ring-1 focus:ring-[#0369A1]"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const updated = formData.data.kontakWilayah.filter((_, i) => i !== idx);
                        setFormData({
                          ...formData,
                          data: { ...formData.data, kontakWilayah: updated },
                        });
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Kontak Putra */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-[#0369A1] block">
                        Kontak Santri Putra
                      </span>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          Teks Tampilan
                        </label>
                        <input
                          type="text"
                          value={kontak.kontakPutra}
                          onChange={(e) => {
                            const updated = [...formData.data.kontakWilayah];
                            updated[idx] = { ...kontak, kontakPutra: e.target.value };
                            setFormData({
                              ...formData,
                              data: { ...formData.data, kontakWilayah: updated },
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                          placeholder="+62 821-..."
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          Nomor WhatsApp (Angka saja, misal: 6282112998521)
                        </label>
                        <input
                          type="text"
                          value={kontak.waPutra || ''}
                          onChange={(e) => {
                            const updated = [...formData.data.kontakWilayah];
                            updated[idx] = {
                              ...kontak,
                              waPutra: e.target.value.replace(/[^0-9]/g, ''),
                            };
                            setFormData({
                              ...formData,
                              data: { ...formData.data, kontakWilayah: updated },
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                          placeholder="62821..."
                        />
                      </div>
                    </div>

                    {/* Kontak Putri */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-purple-700 block">
                        Kontak Santri Putri
                      </span>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          Teks Tampilan
                        </label>
                        <input
                          type="text"
                          value={kontak.kontakPutri}
                          onChange={(e) => {
                            const updated = [...formData.data.kontakWilayah];
                            updated[idx] = { ...kontak, kontakPutri: e.target.value };
                            setFormData({
                              ...formData,
                              data: { ...formData.data, kontakWilayah: updated },
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                          placeholder="+62 859-... atau —"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          Nomor WhatsApp (Angka saja, kosongkan jika tidak ada)
                        </label>
                        <input
                          type="text"
                          value={kontak.waPutri || ''}
                          onChange={(e) => {
                            const updated = [...formData.data.kontakWilayah];
                            updated[idx] = {
                              ...kontak,
                              waPutri: e.target.value.replace(/[^0-9]/g, ''),
                            };
                            setFormData({
                              ...formData,
                              data: { ...formData.data, kontakWilayah: updated },
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                          placeholder="62859..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RESET CONFIRMATION MODAL ───────────────────────── */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Reset ke Template Standar PDF?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tindakan ini akan mengembalikan seluruh data (info umum, timeline studi, syarat, alur seleksi, biaya, dan kontak wilayah) ke data bawaan resmi 2027–2028.
            </p>
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {resetMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>Ya, Reset Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
