import React, { useState, FormEvent } from 'react';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import {
  useCreatePermohonanIzin,
  useGetPermohonanIzinList,
  JenisIzinSantri,
} from '../../features/portal/hooks/usePermohonanIzin';
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2, FileText, Send, History } from 'lucide-react';

const JENIS_LABEL: Record<JenisIzinSantri, string> = {
  IZIN_PULANG: 'Izin Pulang Ke Rumah',
  SAKIT: 'Izin Berobat / Sakit',
  LAINNYA: 'Izin Keperluan Lainnya',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PortalPermohonanIzin() {
  const { selectedStudentId, isLoading: isStudentLoading, isError: isStudentError } = usePortalStudent();

  const [jenisIzin, setJenisIzin] = useState<JenisIzinSantri>('IZIN_PULANG');
  const [keterangan, setKeterangan] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: list = [], isLoading: isListLoading } = useGetPermohonanIzinList(selectedStudentId ?? undefined);
  const mutation = useCreatePermohonanIzin();

  if (isStudentLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-sm text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Memuat data izin...
      </div>
    );
  }

  if (isStudentError) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-sm text-rose-600 text-center font-medium">
        Gagal memuat data permohonan izin. Silakan muat ulang.
      </div>
    );
  }

  if (!selectedStudentId) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 text-center text-sm text-slate-500">
        Belum ada santri yang terhubung ke akun ini.
      </div>
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!tanggalMulai || !tanggalSelesai) {
      setErrorMsg('Tanggal mulai dan tanggal selesai wajib diisi.');
      return;
    }
    if (tanggalSelesai < tanggalMulai) {
      setErrorMsg('Tanggal selesai tidak boleh sebelum tanggal mulai.');
      return;
    }

    mutation.mutate(
      { studentId: selectedStudentId, jenisIzin, keterangan, tanggalMulai, tanggalSelesai },
      {
        onSuccess: () => {
          setSuccessMsg('Permohonan izin santri berhasil diajukan!');
          setKeterangan('');
          setTanggalMulai('');
          setTanggalSelesai('');
          setJenisIzin('IZIN_PULANG');
          setTimeout(() => setSuccessMsg(''), 5000);
        },
        onError: (err: any) => {
          setErrorMsg(err.response?.data?.message || 'Gagal mengajukan permohonan izin.');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER HALAMAN ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
          <FileText className="w-6 h-6 text-indigo-600" /> Permohonan Izin Santri
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Ajukan permohonan izin perizinan pulang, sakit, atau keperluan keluarga kepada pengurus cabang.
        </p>
      </div>

      {/* ── GRID 2 KOLOM (DESKTOP) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* FORM PENGAJUAN (7 KOLOM) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" /> Formulir Pengajuan
          </h2>

          {successMsg && (
            <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Jenis Izin</label>
              <select
                value={jenisIzin}
                onChange={(e) => setJenisIzin(e.target.value as JenisIzinSantri)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
              >
                {(Object.entries(JENIS_LABEL) as [JenisIzinSantri, string][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Keterangan / Alasan</label>
              <textarea
                required
                rows={3}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Tuliskan keterangan perizinan secara jelas..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mulai Tanggal</label>
                <input
                  type="date"
                  required
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Sampai Tanggal</label>
                <input
                  type="date"
                  required
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 py-2.5 text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Kirim Pengajuan Izin
              </button>
            </div>
          </form>
        </div>

        {/* RIWAYAT PENGAJUAN (7 KOLOM) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" /> Riwayat Permohonan Izin
          </h2>

          {isListLoading ? (
            <div className="p-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Memuat riwayat...
            </div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              Belum ada permohonan izin yang diajukan.
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((item) => (
                <div key={item.id} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 transition-all hover:bg-slate-50">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">{JENIS_LABEL[item.jenisIzin] || item.jenisIzin}</span>
                    {item.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 text-[11px]">
                        <Clock className="w-3 h-3" /> Menunggu Persetujuan
                      </span>
                    )}
                    {item.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> Disetujui
                      </span>
                    )}
                    {item.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200 text-[11px]">
                        <XCircle className="w-3 h-3" /> Ditolak
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1">
                    Rentang Izin: {formatDate(item.tanggalMulai)} — {formatDate(item.tanggalSelesai)}
                  </p>
                  <p className="text-xs text-slate-700 mt-2 bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                    {item.keterangan}
                  </p>
                  {item.catatanAdmin && (
                    <div className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200/60">
                      <span className="font-bold text-indigo-900">Catatan Admin Cabang:</span> {item.catatanAdmin}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
