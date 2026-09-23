import React from 'react';
import {
  X,
  AlertTriangle,
  FileWarning,
  LogOut,
  Download,
  Calendar,
  User,
  Building,
  ShieldCheck,
  Printer,
  FileDown,
  Paperclip,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { PelanggaranRecord, SuratPeringatanRecord, PengeluaranSiswaRecord } from './types';
import { downloadSpTemplateDocx, downloadPengeluaranTemplateDocx } from './useIndisipliner';
import { getFileUrl } from '../../utils/photo';

type DetailData =
  | { type: 'pelanggaran'; data: PelanggaranRecord }
  | { type: 'sp'; data: SuratPeringatanRecord }
  | { type: 'pengeluaran'; data: PengeluaranSiswaRecord };

interface DetailIndisiplinerModalProps {
  detail: DetailData | null;
  onClose: () => void;
}

export default function DetailIndisiplinerModal({ detail, onClose }: DetailIndisiplinerModalProps) {
  if (!detail) return null;

  const formatDate = (dateStr: string) => {
    try {
      const dt = new Date(dateStr);
      return isNaN(dt.getTime()) ? dateStr : dt.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {detail.type === 'pelanggaran' && (
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            {detail.type === 'sp' && (
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <FileWarning className="w-5 h-5" />
              </div>
            )}
            {detail.type === 'pengeluaran' && (
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                <LogOut className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {detail.type === 'pelanggaran' && 'Rincian Catatan Pelanggaran'}
                {detail.type === 'sp' && 'Salinan Surat Peringatan (SP)'}
                {detail.type === 'pengeluaran' && 'Surat Keputusan (SK) Pengeluaran Santri'}
              </h3>
              <p className="text-xs text-slate-500">
                {detail.type === 'pelanggaran' && `ID: ${detail.data.id} • Dicatat pada ${formatDate(detail.data.tanggal)}`}
                {detail.type === 'sp' && `No: ${detail.data.nomorSp}`}
                {detail.type === 'pengeluaran' && `No. Dokumen: ${detail.data.nomorSk}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Card Identitas Siswa */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold text-base flex items-center justify-center border border-indigo-200 shrink-0">
                {detail.data.namaSiswa.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{detail.data.namaSiswa}</h4>
                <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 mt-0.5">
                  <span>NIS: <strong className="text-slate-700 font-mono">{detail.data.nisLokal}</strong></span>
                  <span>•</span>
                  <span>Kelas: <span className="font-semibold text-indigo-700">{detail.data.kelas}</span></span>
                  {detail.data.cabangName && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        <Building className="w-3 h-3 text-indigo-500" />
                        {detail.data.cabangName} {detail.data.wilayahName && detail.data.wilayahName !== '-' ? `(${detail.data.wilayahName})` : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {detail.type === 'pelanggaran' && (
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Bobot Poin</span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                  detail.data.poin >= 25
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : detail.data.poin >= 10
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  +{detail.data.poin} Poin
                </span>
              </div>
            )}

            {detail.type === 'sp' && (
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Tingkat Surat</span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                  detail.data.tingkatSp === 'SP 3'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : detail.data.tingkatSp === 'SP 2'
                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {detail.data.tingkatSp}
                </span>
              </div>
            )}

            {detail.type === 'pengeluaran' && (
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Status Santri</span>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-200">
                  Dikeluarkan (DO)
                </span>
              </div>
            )}
          </div>

          {/* Rincian Spesifik Sesuai Tipe Tab */}
          {detail.type === 'pelanggaran' && (
            <div className="space-y-4">
              {/* Status Approval Pelanggaran */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                detail.data.status === 'PENDING'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : detail.data.status === 'DITOLAK'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    detail.data.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-700'
                      : detail.data.status === 'DITOLAK'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {detail.data.status === 'PENDING' && <Clock className="w-4 h-4" />}
                    {detail.data.status === 'DITOLAK' && <XCircle className="w-4 h-4" />}
                    {(!detail.data.status || detail.data.status === 'DISETUJUI') && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm">
                      {detail.data.status === 'PENDING' && 'Status: Menunggu Persetujuan Admin'}
                      {detail.data.status === 'DITOLAK' && 'Status: Pelanggaran Ditolak'}
                      {(!detail.data.status || detail.data.status === 'DISETUJUI') && 'Status: Telah Disetujui (Valid)'}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      {detail.data.status === 'PENDING' && 'Laporan pelanggaran ini masih menunggu verifikasi oleh Admin Yayasan/Pusat.'}
                      {detail.data.status === 'DITOLAK' && `Laporan ditolak ${detail.data.approvedBy ? `oleh ${detail.data.approvedBy}` : 'oleh Admin'}. Poin tidak diakumulasikan ke santri.`}
                      {(!detail.data.status || detail.data.status === 'DISETUJUI') && `Disetujui ${detail.data.approvedBy ? `oleh ${detail.data.approvedBy}` : 'oleh Admin'}${detail.data.approvedAt ? ` pada ${formatDate(detail.data.approvedAt)}` : ''}. Poin aktif terhitung.`}
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border bg-white/90 ${
                  detail.data.status === 'PENDING'
                    ? 'text-amber-700 border-amber-300'
                    : detail.data.status === 'DITOLAK'
                    ? 'text-rose-700 border-rose-300'
                    : 'text-emerald-700 border-emerald-300'
                }`}>
                  {detail.data.status || 'DISETUJUI'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium">Kategori Pelanggaran</span>
                  <p className="font-bold text-slate-900">{detail.data.kategori}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium">Lokasi Kejadian</span>
                  <p className="font-semibold text-slate-800">{detail.data.lokasi || '-'}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium">Tanggal Pelanggaran</span>
                  <p className="font-semibold text-slate-800">{formatDate(detail.data.tanggal)}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium">Dicatat Oleh</span>
                  <p className="font-semibold text-slate-800">{detail.data.dicatatOleh || 'Petugas Disiplin'}</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Jenis & Uraian Pelanggaran:</span>
                <p className="font-semibold text-slate-900 text-sm">{detail.data.jenisPelanggaran}</p>
                {detail.data.keterangan && (
                  <p className="text-slate-600 mt-1 leading-relaxed">{detail.data.keterangan}</p>
                )}
              </div>

              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-1.5">
                <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Tindakan Pembinaan / Sanksi:
                </span>
                <p className="text-emerald-950 font-semibold">{detail.data.tindakanPembinaan || '-'}</p>
              </div>
            </div>
          )}

          {detail.type === 'sp' && (
            <div className="space-y-4">
              {/* Status Approval SP */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                detail.data.statusApproval === 'PENDING'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : detail.data.statusApproval === 'DITOLAK'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    detail.data.statusApproval === 'PENDING'
                      ? 'bg-amber-100 text-amber-700'
                      : detail.data.statusApproval === 'DITOLAK'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {detail.data.statusApproval === 'PENDING' && <Clock className="w-4 h-4" />}
                    {detail.data.statusApproval === 'DITOLAK' && <XCircle className="w-4 h-4" />}
                    {(!detail.data.statusApproval || detail.data.statusApproval === 'DISETUJUI') && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm">
                      {detail.data.statusApproval === 'PENDING' && 'Status: Menunggu Persetujuan Admin'}
                      {detail.data.statusApproval === 'DITOLAK' && 'Status: Penerbitan SP Ditolak'}
                      {(!detail.data.statusApproval || detail.data.statusApproval === 'DISETUJUI') && 'Status: Telah Disetujui Admin (Resmi)'}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      {detail.data.statusApproval === 'PENDING' && 'Surat peringatan ini masih menunggu verifikasi oleh Admin Yayasan/Pusat.'}
                      {detail.data.statusApproval === 'DITOLAK' && `Penerbitan SP ditolak ${detail.data.approvedBy ? `oleh ${detail.data.approvedBy}` : 'oleh Admin'}.`}
                      {(!detail.data.statusApproval || detail.data.statusApproval === 'DISETUJUI') && `Disetujui ${detail.data.approvedBy ? `oleh ${detail.data.approvedBy}` : 'oleh Admin'}${detail.data.approvedAt ? ` pada ${formatDate(detail.data.approvedAt)}` : ''}.`}
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border bg-white/90 ${
                  detail.data.statusApproval === 'PENDING'
                    ? 'text-amber-700 border-amber-300'
                    : detail.data.statusApproval === 'DITOLAK'
                    ? 'text-rose-700 border-rose-300'
                    : 'text-emerald-700 border-emerald-300'
                }`}>
                  {detail.data.statusApproval || 'DISETUJUI'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium">Nomor Surat Peringatan</span>
                  <p className="font-mono font-bold text-slate-900">{detail.data.nomorSp}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium">Status Surat</span>
                  <p className="font-bold text-slate-900">{detail.data.status}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium">Tanggal Diterbitkan</span>
                  <p className="font-semibold text-slate-800">{formatDate(detail.data.tanggalTerbit)}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium">Masa Pembinaan Hingga</span>
                  <p className="font-semibold text-slate-800">{formatDate(detail.data.berlakuHingga)}</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Konsideran / Alasan Penerbitan SP:</span>
                <p className="text-slate-800 leading-relaxed font-medium">{detail.data.alasan}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block text-[11px]">Tembusan Surat:</span>
                  <span className="text-slate-800 font-medium">{detail.data.tembusan || '-'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Akumulasi Poin:</span>
                  <span className="text-rose-600 font-black text-sm">{detail.data.poinAkumulasi} Poin</span>
                </div>
              </div>

              {/* Lampiran Berkas Scan / Upload SP */}
              {detail.data.dokumenSpUrl ? (
                <div className="space-y-2">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">Berkas Peringatan Terlampir</span>
                        <span className="text-[10px] text-slate-500">{detail.data.ukuranDokumen || 'Dokumen'} • PDF/Gambar</span>
                      </div>
                    </div>
                    <a
                      href={getFileUrl(detail.data.dokumenSpUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Buka Berkas
                    </a>
                  </div>
                  {/\.(jpe?g|png|webp|gif)$/i.test(detail.data.dokumenSpUrl) && (
                    <div className="rounded-xl overflow-hidden border border-amber-200 bg-slate-950/5 flex items-center justify-center p-2">
                      <img
                        src={getFileUrl(detail.data.dokumenSpUrl)}
                        alt="Berkas SP"
                        className="max-h-60 max-w-full rounded-lg object-contain shadow-xs"
                      />
                    </div>
                  )}
                </div>
              ) : null}

              {/* Tombol Unduh Format Word DOCX */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <FileDown className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">Surat Peringatan Resmi (DOCX)</span>
                    <span className="text-[10px] text-slate-500">File Microsoft Word berisi data santri lengkap & siap cetak</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadSpTemplateDocx(detail.data.tingkatSp, detail.data.id)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh DOCX
                </button>
              </div>
            </div>
          )}

          {detail.type === 'pengeluaran' && (
            <div className="space-y-4">
              {/* Status Approval Pengeluaran */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                detail.data.status === 'PENDING'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : detail.data.status === 'DITOLAK'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    detail.data.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-700'
                      : detail.data.status === 'DITOLAK'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {detail.data.status === 'PENDING' && <Clock className="w-4 h-4" />}
                    {detail.data.status === 'DITOLAK' && <XCircle className="w-4 h-4" />}
                    {(!detail.data.status || detail.data.status === 'DISETUJUI') && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm">
                      {detail.data.status === 'PENDING' && 'Status: Menunggu Persetujuan Admin (Santri Belum DO)'}
                      {detail.data.status === 'DITOLAK' && 'Status: Pengeluaran Ditolak (Santri Tetap Aktif)'}
                      {(!detail.data.status || detail.data.status === 'DISETUJUI') && 'Status: Telah Disetujui (Santri Resmi Drop Out)'}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      {detail.data.status === 'PENDING' && 'Laporan pengeluaran santri masih diverifikasi oleh Admin Yayasan/Pusat. Santri belum dinonaktifkan.'}
                      {detail.data.status === 'DITOLAK' && `Pengeluaran ditolak ${detail.data.approvedBy ? `oleh ${detail.data.approvedBy}` : 'oleh Admin'}. Santri tetap aktif belajar.`}
                      {(!detail.data.status || detail.data.status === 'DISETUJUI') && `Disetujui ${detail.data.approvedBy ? `oleh ${detail.data.approvedBy}` : 'oleh Admin'}${detail.data.approvedAt ? ` pada ${formatDate(detail.data.approvedAt)}` : ''}. Santri telah dinonaktifkan.`}
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border bg-white/90 ${
                  detail.data.status === 'PENDING'
                    ? 'text-amber-700 border-amber-300'
                    : detail.data.status === 'DITOLAK'
                    ? 'text-rose-700 border-rose-300'
                    : 'text-emerald-700 border-emerald-300'
                }`}>
                  {detail.data.status || 'DISETUJUI'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium">Nomor Dokumen SK</span>
                  <p className="font-mono font-bold text-slate-900">{detail.data.nomorSk}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium">Kategori Alasan</span>
                  <p className="font-bold text-rose-700">{detail.data.kategoriAlasan}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium">Tanggal Efektif Keluar</span>
                  <p className="font-semibold text-slate-800">{formatDate(detail.data.tanggalKeluar)}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 font-medium">Pejabat Pengesah</span>
                  <p className="font-semibold text-slate-800">{detail.data.pejabatTtd}</p>
                </div>
              </div>

              <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl text-xs space-y-1.5">
                <span className="font-bold text-rose-900 uppercase tracking-wider text-[10px]">Alasan Utama Pemberhentian:</span>
                <p className="text-rose-950 leading-relaxed font-semibold">{detail.data.alasanPemberhentian}</p>
              </div>

              {detail.data.keteranganTambahan && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slate-700 text-[10px] uppercase">Keterangan Tambahan / Berita Acara:</span>
                  <p className="text-slate-700">{detail.data.keteranganTambahan}</p>
                </div>
              )}

              {/* Lampiran Dokumen SK (PDF / Gambar) */}
              {detail.data.dokumenSkUrl ? (
                <div className="space-y-2">
                  <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">Berkas Asli SK Terlampir</span>
                        <span className="text-[10px] text-slate-500">{detail.data.ukuranDokumen || 'Dokumen'} • PDF/Gambar</span>
                      </div>
                    </div>
                    <a
                      href={getFileUrl(detail.data.dokumenSkUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Buka Berkas
                    </a>
                  </div>
                  {/\.(jpe?g|png|webp|gif)$/i.test(detail.data.dokumenSkUrl) && (
                    <div className="rounded-xl overflow-hidden border border-red-200 bg-slate-950/5 flex items-center justify-center p-2">
                      <img
                        src={getFileUrl(detail.data.dokumenSkUrl)}
                        alt="Berkas SK"
                        className="max-h-60 max-w-full rounded-lg object-contain shadow-xs"
                      />
                    </div>
                  )}
                </div>
              ) : null}

              {/* Tombol Unduh SK Format Word DOCX */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <FileDown className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">Surat Keputusan Resmi (DOCX)</span>
                    <span className="text-[10px] text-slate-500">File Microsoft Word berisi data santri lengkap & siap cetak</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadPengeluaranTemplateDocx(detail.data.id)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh DOCX
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak Salinan
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
