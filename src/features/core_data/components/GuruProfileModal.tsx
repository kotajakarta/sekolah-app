import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Calendar,
  GraduationCap,
  Building2,
  School,
  KeyRound,
  CheckCircle2,
  Printer,
  Edit2,
  Eye,
  FileText,
  BookOpen,
  Send,
  Sparkles,
  Award,
} from 'lucide-react';
import { Guru } from '../hooks/usePoolGuru';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../hooks/useAuth';

interface GuruProfileModalProps {
  guru: Guru;
  onClose: () => void;
  onEdit?: () => void;
}

export default function GuruProfileModal({ guru, onClose, onEdit }: GuruProfileModalProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAuditor = user?.scope === 'AUDITOR' || user?.divisi === 'PENGAWAS';

  // Lightbox for document preview
  const [viewDocument, setViewDocument] = useState<{ url: string; title: string } | null>(null);

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate age helper
  const getAge = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const birth = new Date(dateStr);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age > 0 ? `${age} tahun` : null;
    } catch {
      return null;
    }
  };

  const ageText = getAge(guru.tanggalLahir);

  // Format phone for WhatsApp URL
  const getWaLink = (phone?: string) => {
    if (!phone) return '';
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return `https://wa.me/${clean}`;
  };

  const documents = [
    {
      key: 'ifadah',
      title: 'Ifadah / Sertifikat / SK',
      url: guru.ifadahUrl,
      icon: Award,
    },
    {
      key: 'ktp',
      title: 'KTP (Kartu Tanda Penduduk)',
      url: guru.ktpUrl,
      icon: FileText,
    },
    {
      key: 'ijazah',
      title: 'Ijazah Pendidikan Terakhir',
      url: guru.ijazahUrl,
      icon: GraduationCap,
    },
  ];

  const guruMapel = (guru as any).guruMapelKelas || [];

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto print:hidden">
        {/* Lightbox Preview */}
        {viewDocument && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-fadeIn"
            onClick={() => setViewDocument(null)}
          >
            <div
              className="relative max-w-4xl max-h-[92vh] w-full flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between pb-3 text-white">
                <span className="text-sm font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand" />
                  {viewDocument.title} — {guru.name}
                </span>
                <button
                  onClick={() => setViewDocument(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative bg-white rounded-2xl overflow-hidden p-2 shadow-2xl max-h-[85vh] flex items-center justify-center border border-white/20">
                <img
                  src={viewDocument.url}
                  alt={viewDocument.title}
                  className="max-w-full max-h-[80vh] object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />

          <div className="relative transform rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Profil Guru / Tenaga Pendidik
                  </h3>
                  <span className="text-xs text-slate-400">
                    Sistem Informasi Terpadu eSantri
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center px-3 py-1.5 border border-slate-200 shadow-2xs text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  Cetak Biodata
                </button>

                {!isAuditor && onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center px-3 py-1.5 border border-indigo-200 shadow-2xs text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                    Edit Data
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="overflow-y-auto flex-1 custom-scrollbar p-6 space-y-6 bg-slate-50/40">
              {/* Top Hero Card */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-5 items-start">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0 border-2 border-white ring-2 ring-indigo-100">
                  {guru.name ? guru.name.charAt(0).toUpperCase() : 'G'}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 leading-tight">
                        {guru.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {guru.position === 'Kepala Cabang' && user?.scope === 'CABANG'
                            ? 'Pimpinan Pesantren'
                            : guru.position || 'Tenaga Pendidik'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          {guru.statusPool === 'TERSEDIA' ? 'Status Aktif' : guru.statusPool}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lokasi & Unit */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <School className="w-3.5 h-3.5 text-slate-400" />
                      <strong>Cabang:</strong> {guru.cabang?.name || '-'}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <strong>Wilayah:</strong> {guru.wilayah?.name || '-'}
                    </span>
                  </div>

                  {/* Akun Status */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-slate-500 font-medium">Akun eSantri:</span>
                    {guru.user ? (
                      <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-mono font-bold text-slate-800">
                          {guru.user.username}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            guru.user.scope === 'WALI_KELAS'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {guru.user.scope === 'WALI_KELAS' ? 'Wali Kelas' : 'Guru Mapel'}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500">
                        Belum Dibuatkan Akun
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 1: Informasi Pribadi & Kontak */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <User className="w-4 h-4 text-brand" />
                  <span>Informasi Pribadi &amp; Kontak</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="block text-slate-400 font-medium">Nomor Induk Kependudukan (NIK)</span>
                    <span className="text-slate-800 font-bold text-sm font-mono mt-0.5 block">
                      {guru.nik || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-slate-400 font-medium">Jenis Kelamin</span>
                    <span className="text-slate-800 font-semibold text-sm mt-0.5 block">
                      {guru.jenisKelamin === 'L' || guru.jenisKelamin === 'LAKI_LAKI'
                        ? 'Laki-laki'
                        : guru.jenisKelamin === 'P' || guru.jenisKelamin === 'PEREMPUAN'
                        ? 'Perempuan'
                        : guru.jenisKelamin || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-slate-400 font-medium">Tempat, Tanggal Lahir</span>
                    <span className="text-slate-800 font-semibold text-sm mt-0.5 block">
                      {guru.tempatLahir || '-'}, {formatDate(guru.tanggalLahir)}
                      {ageText && (
                        <span className="text-slate-400 text-xs font-normal ml-1">
                          ({ageText})
                        </span>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="block text-slate-400 font-medium">Nomor Handphone / WhatsApp</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-slate-800 font-bold text-sm">
                        {guru.phone || '-'}
                      </span>
                      {guru.phone && (
                        <div className="flex items-center gap-1">
                          <a
                            href={`tel:${guru.phone}`}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Telepon"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={getWaLink(guru.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors flex items-center gap-0.5 text-[10px] font-bold px-1.5"
                            title="Chat WhatsApp"
                          >
                            <Send className="w-3 h-3" />
                            <span>WA</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2: Riwayat Pendidikan */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <GraduationCap className="w-4 h-4 text-brand" />
                  <span>Riwayat Pendidikan Terakhir</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="block text-slate-400 font-medium">Jenjang Pendidikan Terakhir</span>
                    <span className="text-slate-800 font-bold text-sm mt-0.5 block">
                      {guru.pendidikanTerakhir || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-slate-400 font-medium">Tahun Kelulusan</span>
                    <span className="text-slate-800 font-bold text-sm mt-0.5 block">
                      {guru.tahunLulus || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-slate-400 font-medium">Nama Perguruan Tinggi / Universitas</span>
                    <span className="text-slate-800 font-semibold text-sm mt-0.5 block">
                      {guru.perguruanTinggi || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-slate-400 font-medium">Program Studi / Jurusan</span>
                    <span className="text-slate-800 font-semibold text-sm mt-0.5 block">
                      {guru.programStudi || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 3: Penugasan Akademik & Rombel */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <BookOpen className="w-4 h-4 text-brand" />
                  <span>Penugasan Akademik &amp; Mengajar</span>
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="block text-slate-400 font-medium mb-1">Tugas Wali Kelas:</span>
                    {guru.waliKelas || (guru.kelasWali && guru.kelasWali.length > 0) ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {guru.kelasWali && guru.kelasWali.length > 0
                          ? guru.kelasWali.map((k) => k.name).join(', ')
                          : `Wali Kelas ID: ${guru.waliKelas}`}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Bukan Wali Kelas</span>
                    )}
                  </div>

                  <div>
                    <span className="block text-slate-400 font-medium mb-1.5">Penugasan Mata Pelajaran &amp; Kelas:</span>
                    {guruMapel && guruMapel.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {guruMapel.map((asg: any) => (
                          <span
                            key={asg.id}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            {asg.mataPelajaran?.name || 'Mapel'} ({asg.kelas?.name || 'Kelas'})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Belum ada penugasan kelas formal</span>
                    )}
                  </div>

                  {guru.mapelUmum && guru.mapelUmum.length > 0 && (
                    <div>
                      <span className="block text-slate-400 font-medium mb-1.5">Mata Pelajaran Umum:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {guru.mapelUmum.map((m, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Grid 4: Berkas & Dokumen Pendukung */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="w-4 h-4 text-brand" />
                  <span>Berkas &amp; Dokumen Pendukung</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {documents.map((doc) => {
                    const hasUrl = !!doc.url;
                    const DocIcon = doc.icon;

                    return (
                      <div
                        key={doc.key}
                        className={`rounded-xl p-3.5 border transition-all flex flex-col justify-between ${
                          hasUrl
                            ? 'bg-slate-50 border-slate-200/90'
                            : 'bg-slate-50/50 border-dashed border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                              <DocIcon className="w-4 h-4 text-brand" />
                            </div>
                            {hasUrl ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Terunggah
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400 italic">
                                Belum Ada
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-slate-800 leading-tight">
                            {doc.title}
                          </h5>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/60">
                          {hasUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setViewDocument({ url: doc.url!, title: doc.title })
                              }
                              className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 shadow-2xs transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Lihat Berkas</span>
                            </button>
                          ) : (
                            <span className="block text-center text-[11px] text-slate-400 italic py-1">
                              Berkas belum diunggah
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
