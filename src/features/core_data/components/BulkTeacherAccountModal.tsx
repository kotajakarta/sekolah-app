import React, { useState } from 'react';
import { X, Sparkles, Check, Send, Copy, RefreshCw, AlertCircle, Users, Download } from 'lucide-react';
import { Staff, useBulkCreateTeacherAccounts } from '../hooks/useMasterData';
import { useToast } from '../../../contexts/ToastContext';

interface BulkTeacherAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  cabangId?: string;
  cabangName?: string;
  teachersWithoutAccount: Staff[];
  onSuccess?: () => void;
}

export const BulkTeacherAccountModal: React.FC<BulkTeacherAccountModalProps> = ({
  isOpen,
  onClose,
  cabangId,
  cabangName,
  teachersWithoutAccount,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const bulkCreateMutation = useBulkCreateTeacherAccounts();

  const [defaultPassword, setDefaultPassword] = useState('Sulaimaniyah2026!');
  const [createdAccounts, setCreatedAccounts] = useState<any[] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      const res = await bulkCreateMutation.mutateAsync({
        cabangId,
        defaultPassword: defaultPassword.trim() || 'Sulaimaniyah2026!',
      });
      setCreatedAccounts(res.accounts || []);
      showToast('success', `Berhasil membuat ${res.totalCreated} akun guru!`);
      onSuccess?.();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Gagal membuat akun massal.');
    }
  };

  const getCleanPhone = (phone?: string) => {
    if (!phone) return '';
    let p = phone.replace(/[^0-9]/g, '');
    if (p.startsWith('0')) p = '62' + p.substring(1);
    if (p.startsWith('8')) p = '628' + p.substring(1);
    return p;
  };

  const handleSendWhatsApp = (account: any) => {
    const rawPhone = account.phone || '';
    const cleanPhone = getCleanPhone(rawPhone);

    const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nYth. *${account.name}*,\n\nBerikut informasi akun login eSantri untuk akses Bank Soal, Jurnal Pembelajaran, dan Absensi Siswa:\n\n🌐 *Link Login* : https://esantri.yts.sch.id/login\n👤 *Username*   : ${account.username}\n🔑 *Password*   : ${account.password}\n🏢 *Peran*      : ${account.scope === 'WALI_KELAS' ? 'Wali Kelas' : 'Guru Pengampu'}\n\nMohon segera login dan ganti password demi keamanan akun Anda.\nJazakumullah Khairan Katsiran.`;

    const encoded = encodeURIComponent(message);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleCopySingle = (account: any) => {
    const text = `Akun eSantri: ${account.name} | User: ${account.username} | Pass: ${account.password}`;
    navigator.clipboard.writeText(text);
    setCopiedId(account.staffId);
    showToast('success', 'Kredensial disalin!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    if (!createdAccounts || createdAccounts.length === 0) return;
    const lines = createdAccounts.map(
      (a, idx) => `${idx + 1}. ${a.name} | Peran: ${a.scope} | User: ${a.username} | Pass: ${a.password} | HP: ${a.phone || '-'}`
    );
    const allText = `DAFTAR AKUN LOGIN GURU (${cabangName || 'Cabang'})\nLink: https://esantri.yts.sch.id/login\n\n` + lines.join('\n');
    navigator.clipboard.writeText(allText);
    setIsCopiedAll(true);
    showToast('success', 'Daftar seluruh akun berhasil disalin!');
    setTimeout(() => setIsCopiedAll(false), 3000);
  };

  const isLoading = bulkCreateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Generate Akun Massal Guru</h3>
              <p className="text-xs text-teal-100">{cabangName ? `Cabang: ${cabangName}` : 'Semua Guru Cabang'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {createdAccounts ? (
            /* Tampilan Tabel Hasil Akun */
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {createdAccounts.length} Akun Guru Berhasil Dibuat!
                    </h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Daftar kredensial siap dibagikan kepada masing-masing ustadz.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs hover:bg-emerald-100 transition-all cursor-pointer shrink-0"
                >
                  {isCopiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedAll ? 'Semua Tersalin!' : 'Salin Semua Akun'}</span>
                </button>
              </div>

              {/* Tabel Akun */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Nama Ustadz</th>
                      <th className="p-2.5">Peran</th>
                      <th className="p-2.5">Username</th>
                      <th className="p-2.5">Password</th>
                      <th className="p-2.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {createdAccounts.map((acc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-2.5 font-semibold text-slate-800">
                          {acc.name}
                          {acc.phone && <span className="block text-[10px] text-slate-400 font-normal">{acc.phone}</span>}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              acc.scope === 'WALI_KELAS'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {acc.scope}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-slate-700 select-all">{acc.username}</td>
                        <td className="p-2.5 font-mono text-emerald-700 select-all">{acc.password}</td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(acc)}
                              className="p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              title="Kirim Akun via WA"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopySingle(acc)}
                              className="p-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                              title="Salin Data"
                            >
                              {copiedId === acc.staffId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-md transition-all cursor-pointer"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          ) : (
            /* Konfirmasi Pembuatan Akun Massal */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-950 flex items-start gap-3">
                <Users className="w-6 h-6 text-teal-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">
                    {teachersWithoutAccount.length} Guru Siap Dibuatkan Akun
                  </h4>
                  <p className="text-xs text-teal-800 leading-relaxed">
                    Sistem akan secara otomatis membuatkan akun login untuk seluruh guru yang terdaftar aktif di cabang ini dan belum memiliki akun eSantri.
                  </p>
                </div>
              </div>

              {/* Pengaturan Password Default */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Default (untuk guru tanpa NIK)
                </label>
                <input
                  type="text"
                  value={defaultPassword}
                  onChange={(e) => setDefaultPassword(e.target.value)}
                  placeholder="Contoh: Sulaimaniyah2026!"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  *Guru yang memiliki data NIK akan menggunakan format sandi: <code>[6 digit terakhir NIK]@Santri</code>.
                </p>
              </div>

              {/* Preview Guru yang akan dibuatkan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Daftar Guru yang Belum Punya Akun ({teachersWithoutAccount.length}):
                </label>
                <div className="border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto bg-slate-50 divide-y divide-slate-200/60 text-xs">
                  {teachersWithoutAccount.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">Semua guru di cabang ini sudah memiliki akun.</p>
                  ) : (
                    teachersWithoutAccount.map((g, idx) => (
                      <div key={g.id || idx} className="py-1.5 flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{g.name}</span>
                        <span className="text-[10px] text-slate-500">{g.position || 'GURU'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Proteksi Data Alert */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Akun yang dibuat akan langsung aktif dengan scope <strong>GURU</strong> atau <strong>WALI_KELAS</strong> dengan pembatasan hak akses data sensitif.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading || teachersWithoutAccount.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white shadow-md transition-all cursor-pointer"
                >
                  {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate {teachersWithoutAccount.length} Akun Sekarang</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default BulkTeacherAccountModal;
