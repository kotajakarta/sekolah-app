import React, { useState, useEffect } from 'react';
import { Stethoscope, Home, Building2, UserX, AlertCircle, Check, X } from 'lucide-react';

export interface SakitDetail {
  namaPenyakit: string;
  posisiSantri: 'Di Asrama' | 'Di Rumah Sakit' | 'Di Rumah Orang Tua' | '';
  keteranganTambahan?: string;
}

interface ModalSakitSantriProps {
  isOpen: boolean;
  studentName: string;
  nisLokal?: string | null;
  initialCatatan?: string;
  onSave: (catatan: string, detail: SakitDetail) => void;
  onCancel: () => void;
}

const QUICK_PENYAKIT_TAGS = [
  'Demam',
  'Flu / Batuk',
  'Tipes',
  'Maag',
  'Sakit Gigi',
  'Pusing / Vertigo',
  'Diare',
  'Cedera / Keseleo',
];

const POSISI_OPTIONS: Array<{
  key: 'Di Asrama' | 'Di Rumah Sakit' | 'Di Rumah Orang Tua';
  title: string;
  desc: string;
  icon: React.ReactNode;
  activeColor: string;
  borderColor: string;
}> = [
  {
    key: 'Di Asrama',
    title: 'Di Asrama',
    desc: 'Istirahat di kamar / UKS asrama cabang',
    icon: <Home className="w-5 h-5 text-indigo-600" />,
    activeColor: 'bg-indigo-50 border-indigo-500 text-indigo-950',
    borderColor: 'border-slate-200 hover:border-indigo-300',
  },
  {
    key: 'Di Rumah Sakit',
    title: 'Di Rumah Sakit',
    desc: 'Rawat inap / rujukan medis di RS atau Klinik',
    icon: <Building2 className="w-5 h-5 text-rose-600" />,
    activeColor: 'bg-rose-50 border-rose-500 text-rose-950',
    borderColor: 'border-slate-200 hover:border-rose-300',
  },
  {
    key: 'Di Rumah Orang Tua',
    title: 'Di Rumah Orang Tua',
    desc: 'Pulang ke keluarga / izin berobat di rumah wali',
    icon: <UserX className="w-5 h-5 text-amber-600" />,
    activeColor: 'bg-amber-50 border-amber-500 text-amber-950',
    borderColor: 'border-slate-200 hover:border-amber-300',
  },
];

/**
 * Parser string catatan terstruktur
 * Contoh: "[Sakit: Demam Tinggi | Posisi: Di Asrama] Sudah diberi paracetamol"
 */
export function parseCatatanSakit(rawCatatan?: string): SakitDetail {
  if (!rawCatatan) {
    return { namaPenyakit: '', posisiSantri: '', keteranganTambahan: '' };
  }

  const match = rawCatatan.match(/\[Sakit:\s*(.*?)\s*\|\s*Posisi:\s*(.*?)\](?:\s*(.*))?/i);
  if (match) {
    const rawPosisi = match[2].trim();
    let posisiSantri: SakitDetail['posisiSantri'] = '';
    if (rawPosisi.toLowerCase().includes('asrama')) posisiSantri = 'Di Asrama';
    else if (rawPosisi.toLowerCase().includes('sakit') || rawPosisi.toLowerCase().includes('rs') || rawPosisi.toLowerCase().includes('klinik')) posisiSantri = 'Di Rumah Sakit';
    else if (rawPosisi.toLowerCase().includes('orang tua') || rawPosisi.toLowerCase().includes('rumah')) posisiSantri = 'Di Rumah Orang Tua';

    return {
      namaPenyakit: match[1].trim(),
      posisiSantri: posisiSantri || (rawPosisi as any),
      keteranganTambahan: match[3]?.trim() || '',
    };
  }

  // Jika format belum standar, jadikan catatan awal sebagai namaPenyakit / keterangan
  return {
    namaPenyakit: '',
    posisiSantri: '',
    keteranganTambahan: rawCatatan,
  };
}

/**
 * Formatter string catatan terstruktur
 */
export function formatCatatanSakit(detail: SakitDetail): string {
  const penyakit = detail.namaPenyakit.trim();
  const posisi = detail.posisiSantri.trim();
  const extra = detail.keteranganTambahan?.trim();

  let result = `[Sakit: ${penyakit} | Posisi: ${posisi}]`;
  if (extra) {
    result += ` ${extra}`;
  }
  return result;
}

export default function ModalSakitSantri({
  isOpen,
  studentName,
  nisLokal,
  initialCatatan,
  onSave,
  onCancel,
}: ModalSakitSantriProps) {
  const [namaPenyakit, setNamaPenyakit] = useState('');
  const [posisiSantri, setPosisiSantri] = useState<SakitDetail['posisiSantri']>('');
  const [keteranganTambahan, setKeteranganTambahan] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const parsed = parseCatatanSakit(initialCatatan);
      setNamaPenyakit(parsed.namaPenyakit);
      setPosisiSantri(parsed.posisiSantri);
      setKeteranganTambahan(parsed.keteranganTambahan || '');
      setErrorMsg(null);
    }
  }, [isOpen, initialCatatan]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaPenyakit.trim()) {
      setErrorMsg('Nama penyakit wajib diisi!');
      return;
    }

    if (!posisiSantri) {
      setErrorMsg('Posisi santri wajib dipilih!');
      return;
    }

    const detail: SakitDetail = {
      namaPenyakit: namaPenyakit.trim(),
      posisiSantri,
      keteranganTambahan: keteranganTambahan.trim() || undefined,
    };

    const formatted = formatCatatanSakit(detail);
    onSave(formatted, detail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Keterangan Santri Sakit</h3>
              <p className="text-xs text-slate-500">
                Santri: <strong className="text-slate-800">{studentName}</strong> {nisLokal ? `(NIS: ${nisLokal})` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Field Nama Penyakit */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Penyakit <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Demam, Flu, Tipes, Sakit Perut..."
              value={namaPenyakit}
              onChange={(e) => {
                setNamaPenyakit(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              autoFocus
            />

            {/* Quick tags suggestion */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_PENYAKIT_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setNamaPenyakit(tag);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    namaPenyakit === tag
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Field Posisi Santri (Wajib) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Posisi Santri Saat Ini <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {POSISI_OPTIONS.map((opt) => {
                const isSelected = posisiSantri === opt.key;
                return (
                  <label
                    key={opt.key}
                    onClick={() => {
                      setPosisiSantri(opt.key);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className={`flex items-start gap-3.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? opt.activeColor
                        : `bg-white ${opt.borderColor}`
                    }`}
                  >
                    <input
                      type="radio"
                      name="posisiSantri"
                      value={opt.key}
                      checked={isSelected}
                      onChange={() => setPosisiSantri(opt.key)}
                      className="sr-only"
                    />
                    <div className="p-2 rounded-lg bg-white shadow-xs shrink-0 mt-0.5">
                      {opt.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{opt.title}</span>
                        {isSelected && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 3. Field Keterangan Tambahan (Opsional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Keterangan Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Sudah diperiksa dokter klinik, resep obat telah diminum..."
              value={keteranganTambahan}
              onChange={(e) => setKeteranganTambahan(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Simpan & Terapkan Sakit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
