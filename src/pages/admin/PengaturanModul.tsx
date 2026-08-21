import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import {
  Layers,
  HeartHandshake,
  FileText,
  FileQuestion,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export default function PengaturanModul() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Module Settings
  const { data: moduleSettings, isLoading } = useQuery({
    queryKey: ['module-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/pengaturan/modules');
      return res.data;
    },
  });

  const moduleMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.put('/pengaturan/modules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-settings'] });
      showToast('success', 'Status Keaktifan Modul berhasil diperbarui');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan status modul');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isPortalEnabled = moduleSettings?.portalWalsanEnabled !== false;
  const isRaporEnabled = moduleSettings?.raporMuadalahEnabled !== false;
  const isBankSoalEnabled = moduleSettings?.bankSoalEnabled !== false;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Modul</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Kontrol keaktifan modul sistem dan visibilitas menu sidebar untuk seluruh pengguna.
            </p>
          </div>
        </div>
      </div>

      {/* ── BANNER INFO ── */}
      <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-3xl p-5 flex items-start gap-3 text-xs text-indigo-950">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm text-indigo-900">Hak Akses Admin Pusat (Global)</span>
          <p className="text-slate-600 leading-relaxed">
            Menonaktifkan modul akan menyembunyikan tautan menu di sidebar desktop dan mobile navigation secara realtime bagi semua pengguna. Anda dapat mengaktifkannya kembali sewaktu-waktu.
          </p>
        </div>
      </div>

      {/* ── KONTROL KEAKTIFAN MODUL ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Daftar Modul Sistem & Sidebar</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Klik tombol status untuk mengubah status modul menjadi Aktif atau Nonaktif.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {/* 1. MODUL BANK SOAL (DOCX) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 hover:bg-indigo-50/20 hover:border-indigo-200 transition-all">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
                <FileQuestion className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">Modul Bank Soal & Naskah Ujian (DOCX)</h3>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">
                    BARU
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mengontrol repositori bank soal, penugasan berjenjang (Pusat $\rightarrow$ Wilayah $\rightarrow$ Cabang $\rightarrow$ Guru), formula KaTeX, dan ekspor Word (.docx).
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={moduleMutation.isPending}
              onClick={() => {
                moduleMutation.mutate({ bankSoalEnabled: !isBankSoalEnabled });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 shadow-2xs ${
                isBankSoalEnabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {isBankSoalEnabled ? '✓ AKTIF (Tampil di Sidebar)' : '✕ NONAKTIF (Sembunyi)'}
            </button>
          </div>

          {/* 2. MODUL PORTAL WALI SANTRI */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 hover:bg-indigo-50/20 hover:border-indigo-200 transition-all">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">Modul Portal Wali Santri</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mengontrol akses Portal Walsan, monitoring perizinan santri, presensi, syahriyah, serta live streaming CCTV.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={moduleMutation.isPending}
              onClick={() => {
                moduleMutation.mutate({ portalWalsanEnabled: !isPortalEnabled });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 shadow-2xs ${
                isPortalEnabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {isPortalEnabled ? '✓ AKTIF (Tampil di Sidebar)' : '✕ NONAKTIF (Sembunyi)'}
            </button>
          </div>

          {/* 3. MODUL RAPOR MUADALAH */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 hover:bg-indigo-50/20 hover:border-indigo-200 transition-all">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">Modul Rapor Muadalah</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mengontrol input nilai e-rapor santri muadalah, cetak buku rapor digital, dan pembagian hasil belajar.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={moduleMutation.isPending}
              onClick={() => {
                moduleMutation.mutate({ raporMuadalahEnabled: !isRaporEnabled });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 shadow-2xs ${
                isRaporEnabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {isRaporEnabled ? '✓ AKTIF (Tampil di Sidebar)' : '✕ NONAKTIF (Sembunyi)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
