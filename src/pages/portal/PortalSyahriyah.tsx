import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import { useToast } from '../../contexts/ToastContext';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Banknote,
  UploadCloud,
  FileCheck,
  Copy,
  Check,
  X,
  Loader2,
  ExternalLink,
  ChevronRight,
  Info,
  Building2,
  Calendar,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';

const BULAN_LABELS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const KATEGORI_LABEL: Record<string, { label: string; color: string }> = {
  BULANAN: { label: 'Iuran Syahriyah Bulanan', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  TAHUNAN: { label: 'Biaya Tahunan', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  SANTRI_BARU: { label: 'Biaya Santri Baru', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  LAINNYA: { label: 'Biaya Lainnya', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function PortalSyahriyah() {
  const { selectedStudentId, selectedLink, isLoading: isStudentLoading } = usePortalStudent();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'BULANAN' | 'TAHUNAN' | 'SANTRI_BARU' | 'ALL'>('BULANAN');
  const [selectedTahun, setSelectedTahun] = useState<number>(new Date().getFullYear());
  const [copiedRekId, setCopiedRekId] = useState<string | null>(null);

  // Pay Modal State
  const [selectedTagihanForPay, setSelectedTagihanForPay] = useState<any | null>(null);
  const [payNominal, setPayNominal] = useState<number>(0);
  const [payMetode, setPayMetode] = useState<'TRANSFER' | 'QRIS'>('TRANSFER');
  const [payBuktiUrl, setPayBuktiUrl] = useState('');
  const [payCatatan, setPayCatatan] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const student = selectedLink?.student;
  const biodata = student?.biodata;

  // ═══════════════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════════════

  const { data: syahriyahData, isLoading: isLoadingTagihan } = useQuery({
    queryKey: ['portal-syahriyah-tagihan', selectedStudentId, selectedTahun],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      const res = await apiClient.get(`/portal/students/${selectedStudentId}/syahriyah?tahun=${selectedTahun}`);
      return res.data;
    },
    enabled: !!selectedStudentId
  });

  const { data: rekeningList = [], isLoading: isLoadingRekening } = useQuery({
    queryKey: ['portal-syahriyah-rekening', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const res = await apiClient.get(`/portal/students/${selectedStudentId}/syahriyah/rekening`);
      return res.data;
    },
    enabled: !!selectedStudentId
  });

  // ═══════════════════════════════════════════════════════════
  // MUTATION
  // ═══════════════════════════════════════════════════════════

  const submitPembayaranMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post(`/portal/students/${selectedStudentId}/syahriyah/bayar`, payload);
      return res.data;
    },
    onSuccess: () => {
      showToast('success', 'Konfirmasi pembayaran berhasil dikirim! Status sedang menunggu verifikasi admin cabang/pusat.');
      setSelectedTagihanForPay(null);
      queryClient.invalidateQueries({ queryKey: ['portal-syahriyah-tagihan'] });
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal mengirim konfirmasi pembayaran');
    }
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const handleCopyRekening = (nomor: string, id: string) => {
    navigator.clipboard.writeText(nomor);
    setCopiedRekId(id);
    showToast('info', `Nomor rekening ${nomor} berhasil disalin!`);
    setTimeout(() => setCopiedRekId(null), 2500);
  };

  // Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('warning', 'Ukuran file bukti transfer maksimal 5 MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPayBuktiUrl(res.data.url || res.data.fileUrl || res.data.path);
      showToast('success', 'Bukti transfer berhasil diunggah!');
    } catch {
      showToast('error', 'Gagal mengunggah file bukti transfer');
    } finally {
      setIsUploading(false);
    }
  };

  if (isStudentLoading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="font-semibold text-slate-700">Memuat data Syahriyah santri...</span>
      </div>
    );
  }

  const tagihanList: any[] = syahriyahData?.tagihan || [];
  const summary = syahriyahData?.summary || { totalTagihan: 0, totalLunas: 0, totalPending: 0, totalBelumLunas: 0 };

  // Filtered list based on active tab
  const filteredTagihan = tagihanList.filter((t) => {
    if (activeTab === 'ALL') return true;
    return t.kategori === activeTab;
  });

  // Bulanan map for 12 months matrix
  const bulananMap: Record<number, any> = {};
  tagihanList.filter((t) => t.kategori === 'BULANAN').forEach((t) => {
    if (t.bulan) bulananMap[t.bulan] = t;
  });

  return (
    <div className="space-y-6">
      {/* ── BANNER HEADER ── */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 backdrop-blur-md">
                <Banknote className="w-3.5 h-3.5" /> Syahriyah & Keuangan Santri
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Iuran Bulanan & Pembayaran Santri
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl leading-relaxed">
              Pantau status pembayaran Syahriyah bulanan, biaya tahunan, serta konfirmasi pembayaran transfer untuk santri <strong>{biodata?.fullName}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 backdrop-blur-md"
            >
              <option value={2026} className="text-slate-900">Tahun 2026</option>
              <option value={2027} className="text-slate-900">Tahun 2027</option>
              <option value={2025} className="text-slate-900">Tahun 2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── KPI STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Tagihan ({summary.count || 0})</span>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
              {formatRupiah(summary.totalTagihan)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Sudah Terbayar (Lunas)</span>
            <h3 className="text-lg font-extrabold text-emerald-700 mt-0.5">
              {formatRupiah(summary.totalLunas)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Menunggu Verifikasi</span>
            <h3 className="text-lg font-extrabold text-amber-700 mt-0.5">
              {formatRupiah(summary.totalPending)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Belum Dibayar</span>
            <h3 className="text-lg font-extrabold text-rose-700 mt-0.5">
              {formatRupiah(summary.totalBelumLunas)}
            </h3>
          </div>
        </div>
      </div>

      {/* ── REKENING PEMBAYARAN RESMI PESANTREN ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Rekening Resmi Pembayaran Pesantren
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Silakan melakukan transfer ke salah satu rekening resmi di bawah ini kemudian unggah bukti transfer.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoadingRekening ? (
            <div className="col-span-full p-6 text-center text-xs text-slate-400">
              Memuat data rekening pembayaran...
            </div>
          ) : rekeningList.length === 0 ? (
            <div className="col-span-full p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
              Belum ada rekening pembayaran yang aktif untuk cabang ini. Silakan hubungi pengurus cabang.
            </div>
          ) : (
            rekeningList.map((rek: any) => (
              <div
                key={rek.id}
                className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-indigo-900/60 relative flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                      {rek.cabang?.name ? `Cabang: ${rek.cabang.name}` : 'Pusat Pesantren'}
                    </span>
                    <h4 className="text-base font-extrabold text-white mt-0.5">{rek.bankName}</h4>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-lg font-mono font-bold tracking-wider text-amber-300 select-all">
                    {rek.nomorRekening}
                  </div>
                  <div className="text-xs text-slate-300">
                    a.n. <strong className="text-white">{rek.atasNama}</strong>
                  </div>
                </div>

                {rek.catatan && (
                  <div className="text-[11px] text-indigo-200/90 bg-white/5 p-2 rounded-xl border border-white/10">
                    {rek.catatan}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleCopyRekening(rek.nomorRekening, rek.id)}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedRekId === rek.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-950" /> Nomor Rekening Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Salin Nomor Rekening
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── TAB PILIHAN KATEGORI & MATRIKS BULANAN ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('BULANAN')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'BULANAN'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Iuran Syahriyah Bulanan ({selectedTahun})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TAHUNAN')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'TAHUNAN'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Biaya Tahunan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SANTRI_BARU')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'SANTRI_BARU'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Biaya Santri Baru
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Semua Tagihan
          </button>
        </div>

        {/* ── 1. MATRIKS 12 BULAN SYAHRIYAH ── */}
        {activeTab === 'BULANAN' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {BULAN_LABELS.map((namaBulan, idx) => {
                const bulanNum = idx + 1;
                const tagihan = bulananMap[bulanNum];

                return (
                  <div
                    key={bulanNum}
                    className={`rounded-3xl p-5 border transition-all relative overflow-hidden flex flex-col justify-between space-y-4 ${
                      tagihan?.status === 'LUNAS'
                        ? 'bg-emerald-50/50 border-emerald-200/80 shadow-xs'
                        : tagihan?.status === 'PENDING'
                        ? 'bg-amber-50/50 border-amber-200/80 shadow-xs'
                        : tagihan
                        ? 'bg-white border-rose-200/80 shadow-xs'
                        : 'bg-slate-50/80 border-slate-200/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Bulan {bulanNum}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{namaBulan} {selectedTahun}</h4>
                      </div>

                      {tagihan?.status === 'LUNAS' ? (
                        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      ) : tagihan?.status === 'PENDING' ? (
                        <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 animate-pulse">
                          <Clock className="w-4 h-4" />
                        </span>
                      ) : tagihan ? (
                        <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center shrink-0 text-xs font-bold">
                          -
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium">Nominal Syahriyah:</span>
                      <div className="text-base font-mono font-extrabold text-slate-900">
                        {tagihan ? formatRupiah(tagihan.nominal) : '-'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      {tagihan?.status === 'LUNAS' ? (
                        <div className="w-full py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-extrabold text-center flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Lunas
                        </div>
                      ) : tagihan?.status === 'PENDING' ? (
                        <div className="w-full py-2 bg-amber-100 text-amber-800 rounded-xl text-xs font-extrabold text-center flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Menunggu Verifikasi
                        </div>
                      ) : tagihan ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTagihanForPay(tagihan);
                            setPayNominal(tagihan.nominal);
                            setPayMetode('TRANSFER');
                            setPayBuktiUrl('');
                            setPayCatatan('');
                          }}
                          className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <UploadCloud className="w-3.5 h-3.5" /> Bayar / Upload Bukti
                        </button>
                      ) : (
                        <div className="w-full py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-medium text-center">
                          Belum Diterbitkan
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 2. LIST VIEW UNTUK TAHUNAN, SANTRI BARU, ATAU SEMUA ── */}
        {activeTab !== 'BULANAN' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {isLoadingTagihan ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-slate-900" /> Memuat data tagihan...
              </div>
            ) : filteredTagihan.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Belum ada tagihan pada kategori ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTagihan.map((t) => (
                  <div key={t.id} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${KATEGORI_LABEL[t.kategori]?.color || 'bg-slate-100 text-slate-600'}`}>
                          {KATEGORI_LABEL[t.kategori]?.label || t.kategori}
                        </span>
                        {t.status === 'LUNAS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> LUNAS
                          </span>
                        ) : t.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> MENUNGGU VERIFIKASI
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> BELUM LUNAS
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-extrabold text-slate-900">{t.judul}</h4>
                      {t.keterangan && <p className="text-xs text-slate-500">{t.keterangan}</p>}
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 font-medium block">Nominal Biaya</span>
                        <span className="text-base sm:text-lg font-mono font-extrabold text-slate-900">
                          {formatRupiah(t.nominal)}
                        </span>
                      </div>

                      {t.status === 'LUNAS' ? (
                        <div className="px-4 py-2 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> Lunas
                        </div>
                      ) : t.status === 'PENDING' ? (
                        <div className="px-4 py-2 bg-amber-100 text-amber-800 font-bold text-xs rounded-xl flex items-center gap-1.5">
                          <Clock className="w-4 h-4" /> Verifikasi
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTagihanForPay(t);
                            setPayNominal(t.nominal);
                            setPayMetode('TRANSFER');
                            setPayBuktiUrl('');
                            setPayCatatan('');
                          }}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <UploadCloud className="w-4 h-4" /> Konfirmasi Bayar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── MODAL: KONFIRMASI BAYAR & UPLOAD BUKTI TRANSFER ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {selectedTagihanForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
                Konfirmasi Pembayaran Transfer
              </h3>
              <button
                onClick={() => setSelectedTagihanForPay(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
              <div className="text-slate-500">Tagihan:</div>
              <div className="font-bold text-slate-900 text-sm">{selectedTagihanForPay.judul}</div>
              <div className="font-mono font-extrabold text-emerald-700 text-base">
                {formatRupiah(selectedTagihanForPay.nominal)}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitPembayaranMutation.mutate({
                  tagihanId: selectedTagihanForPay.id,
                  nominal: payNominal,
                  metode: payMetode,
                  buktiUrl: payBuktiUrl || null,
                  catatanWali: payCatatan || null
                });
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nominal yang Ditransfer (Rp) *</label>
                <input
                  type="number"
                  required
                  value={payNominal}
                  onChange={(e) => setPayNominal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Metode Pembayaran *</label>
                <select
                  value={payMetode}
                  onChange={(e) => setPayMetode(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="TRANSFER">Transfer Antar Bank / M-Banking / ATM</option>
                  <option value="QRIS">QRIS / E-Wallet</option>
                </select>
              </div>

              {/* Upload Foto Bukti Transfer */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Unggah Foto / Bukti Struk Transfer (JPG/PNG/PDF)</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 text-center transition-all bg-slate-50/60 flex flex-col items-center justify-center gap-2 relative">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {isUploading ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <Loader2 className="w-5 h-5 animate-spin" /> Mengunggah bukti transfer...
                    </div>
                  ) : payBuktiUrl ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Bukti transfer berhasil dilampirkan!
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-slate-400" />
                      <span className="text-slate-600 font-semibold">Klik atau seret foto bukti transfer ke sini</span>
                      <span className="text-[10px] text-slate-400">Maksimal 5 MB (JPG, PNG, PDF)</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Catatan dari Orang Tua / Wali (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Ditransfer dari rekening BCA a.n. Fulan"
                  value={payCatatan}
                  onChange={(e) => setPayCatatan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTagihanForPay(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitPembayaranMutation.isPending || isUploading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitPembayaranMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Kirim Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
