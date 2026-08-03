import { useState, FormEvent } from 'react';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import {
  useCreatePermohonanIzin,
  useGetPermohonanIzinList,
  JenisIzinSantri,
} from '../../features/portal/hooks/usePermohonanIzin';
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

const JENIS_LABEL: Record<JenisIzinSantri, string> = {
  IZIN_PULANG: 'Izin Pulang',
  SAKIT: 'Sakit',
  LAINNYA: 'Lainnya',
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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-slate-500 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
      </div>
    );
  }

  if (isStudentError) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-rose-600">
        Gagal memuat data, coba lagi.
      </div>
    );
  }

  if (!selectedStudentId) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-slate-500">
        Belum ada santri yang terhubung ke akun ini.
      </div>
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!tanggalMulai || !tanggalSelesai) {
      setErrorMsg('Tanggal mulai dan tanggal selesai wajib diisi');
      return;
    }
    if (tanggalSelesai < tanggalMulai) {
      setErrorMsg('Tanggal selesai tidak boleh sebelum tanggal mulai');
      return;
    }

    mutation.mutate(
      { studentId: selectedStudentId, jenisIzin, keterangan, tanggalMulai, tanggalSelesai },
      {
        onSuccess: () => {
          setSuccessMsg('Permohonan izin berhasil diajukan.');
          setKeterangan('');
          setTanggalMulai('');
          setTanggalSelesai('');
          setJenisIzin('IZIN_PULANG');
          setTimeout(() => setSuccessMsg(''), 5000);
        },
        onError: (err: any) => {
          setErrorMsg(err.response?.data?.message || 'Gagal mengajukan permohonan izin');
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <h1 className="text-lg font-bold text-slate-800">Ajukan Izin</h1>

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Izin</label>
            <select
              value={jenisIzin}
              onChange={(e) => setJenisIzin(e.target.value as JenisIzinSantri)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {(Object.entries(JENIS_LABEL) as [JenisIzinSantri, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
            <textarea
              required
              rows={3}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Jelaskan alasan izin..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                required
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Selesai</label>
              <input
                type="date"
                required
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 py-2.5 shadow-sm disabled:opacity-50"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Ajukan Izin
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <h2 className="text-sm font-bold text-slate-800 mb-3">Riwayat Permohonan</h2>
        {isListLoading ? (
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
          </p>
        ) : list.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada permohonan izin.</p>
        ) : (
          <div className="space-y-3">
            {list.map((item) => (
              <div key={item.id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-semibold text-slate-800">{JENIS_LABEL[item.jenisIzin]}</span>
                  {item.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 text-xs">
                      <Clock className="w-3 h-3" /> PENDING
                    </span>
                  )}
                  {item.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                      <CheckCircle2 className="w-3 h-3" /> APPROVED
                    </span>
                  )}
                  {item.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                      <XCircle className="w-3 h-3" /> REJECTED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDate(item.tanggalMulai)} - {formatDate(item.tanggalSelesai)}
                </p>
                <p className="text-sm text-slate-600 mt-2">{item.keterangan}</p>
                {item.catatanAdmin && (
                  <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2">
                    <span className="font-semibold">Catatan Admin:</span> {item.catatanAdmin}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
