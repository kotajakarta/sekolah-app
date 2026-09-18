import React, { useState, useEffect, useMemo, useRef } from 'react';
import apiClient from '../../../lib/apiClient';
import { useToast } from '../../../contexts/ToastContext';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
  ZoomIn,
  Trash2,
  Edit3,
  Check,
  CheckCheck,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { extractLjkPdfPages, LjkExtractedPage } from './utils/ljkPdfExtractor';
import { StudentOption } from './LjkScannerTab';

export interface BulkScannedItem {
  id: string;
  pageNumber: number;
  fileName: string;
  file: File;
  previewUrl: string;
  fileUrl?: string;
  // Data Siswa & Mapel
  kodeCabang: string;
  kodeMapelNum?: string;
  nisn: string;
  studentId?: string;
  studentName?: string;
  kelas: string;
  semester: string;
  mapel: string;
  // ID yang terdeteksi dari LJK (bukan dari filter UI)
  mataPelajaranId?: string;
  kelasId?: string;
  jawaban: Record<string, string>;
  totalSoal: number;
  // Skor & Analisis
  skor: number;
  jumlahBenar: number;
  jumlahSalah: number;
  jumlahKosong: number;
  confidence: number;
  ambiguities: number[];
  // Status
  status: 'SUCCESS' | 'AMBIGUOUS' | 'ERROR';
  errorMessage?: string;
  questionBankId?: string;
}

export interface LjkBulkPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfFile: File | null;
  selectedCabangId?: string;
  selectedKelasId?: string;
  selectedKelas?: { id: string; name: string; tingkat?: string | null };
  selectedMapelId?: string;
  selectedMapel?: { id: string; name: string; kodeMapel?: string };
  tahunAjaran?: string;
  semester?: string;
  siswaList?: StudentOption[];
  activeBankSoalId?: string;
  activeBankDetail?: any;
  officialBanks?: any[];
  matchedOfficialBank?: any;
  onSuccessSaveAll: () => void;
}

type Phase = 'IDLE' | 'EXTRACTING' | 'SCANNING' | 'REVIEW' | 'SAVING';

export const LjkBulkPdfModal: React.FC<LjkBulkPdfModalProps> = ({
  isOpen,
  onClose,
  pdfFile,
  selectedCabangId,
  selectedKelasId,
  selectedKelas,
  selectedMapelId,
  selectedMapel,
  tahunAjaran = '2024/2025',
  semester = 'GANJIL',
  siswaList = [],
  activeBankSoalId,
  activeBankDetail,
  officialBanks = [],
  matchedOfficialBank,
  onSuccessSaveAll,
}) => {
  const { showToast } = useToast();

  const [phase, setPhase] = useState<Phase>('IDLE');
  const [extractProgress, setExtractProgress] = useState({ current: 0, total: 0 });
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, currentTitle: '' });
  const [items, setItems] = useState<BulkScannedItem[]>([]);
  const [syncToRapor, setSyncToRapor] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ATTENTION' | 'VALID'>('ALL');
  // Mode format LJK: false = Standar (1 halaman PDF = 1 lembar A5 yang sudah dipotong)
  // true = Khusus jika user scan lembar A4 landscape utuh yang memuat 2 LJK belum dipotong
  const [splitLandscape, setSplitLandscape] = useState<boolean>(false);

  // Preview & Zoom Modal
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  // Edit Single Item Modal
  const [editingItem, setEditingItem] = useState<BulkScannedItem | null>(null);

  // Flag abort jika user membatalkan
  const isAbortedRef = useRef<boolean>(false);

  // Bank Soal resmi aktif untuk acuan kunci jawaban
  const activeBank = useMemo(() => {
    return (
      activeBankDetail ||
      (activeBankSoalId ? officialBanks.find((b: any) => b.id === activeBankSoalId) : null) ||
      matchedOfficialBank
    );
  }, [activeBankDetail, activeBankSoalId, officialBanks, matchedOfficialBank]);

  // Ekstrak Kunci Jawaban Resmi (Map Soal 1..25 -> 'A'..'D')
  const officialKeyMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (activeBank?.questions && activeBank.questions.length > 0) {
      activeBank.questions.forEach((q: any, idx: number) => {
        const qNum = (idx + 1).toString();
        const correctOpt = q.options?.find((o: any) => o.isCorrect);
        if (correctOpt?.label) {
          map[qNum] = correctOpt.label.toUpperCase();
        } else if (q.answerKey) {
          map[qNum] = q.answerKey.toUpperCase();
        }
      });
    }
    return map;
  }, [activeBank]);

  // Reset & Mulai proses saat file PDF dibuka
  useEffect(() => {
    if (isOpen && pdfFile) {
      isAbortedRef.current = false;
      setItems([]);
      startPdfProcessing(pdfFile);
    } else {
      isAbortedRef.current = true;
      setPhase('IDLE');
      setItems([]);
    }
  }, [isOpen, pdfFile]);

  // Ekstraksi & Pemindaian Lembar PDF Berurutan
  const startPdfProcessing = async (file: File) => {
    try {
      setPhase('EXTRACTING');
      setExtractProgress({ current: 0, total: 1 });

      // 1. Ekstrak PDF ke lembaran gambar JPG (scale 2.0)
      // Mode splitLandscape: setiap halaman A4 landscape → 2 gambar A5 portrait
      const extractedPages = await extractLjkPdfPages(
        file,
        (page, idx, total) => { setExtractProgress({ current: idx + 1, total }); },
        { splitLandscape }
      );

      if (isAbortedRef.current) return;

      if (extractedPages.length === 0) {
        showToast('error', 'Berkas PDF kosong atau tidak dapat diekstrak.');
        setPhase('IDLE');
        onClose();
        return;
      }

      // 2. Mulai pemindaian OMR lembar demi lembar
      setPhase('SCANNING');
      setScanProgress({
        current: 0,
        total: extractedPages.length,
        currentTitle: `Mempersiapkan pemindaian ${extractedPages.length} lembar...`,
      });

      const scannedResults: BulkScannedItem[] = [];

      for (let i = 0; i < extractedPages.length; i++) {
        if (isAbortedRef.current) break;

        const page = extractedPages[i];
        const pageNum = i + 1;
        setScanProgress({
          current: pageNum,
          total: extractedPages.length,
          currentTitle: `Memindai lembar halaman ${pageNum} dari ${extractedPages.length}...`,
        });

        try {
          const formData = new FormData();
          formData.append('file', page.file);

          const mapelForScan = activeBank?.subject || selectedMapel?.name || '';
          const kelasForScan = activeBank?.gradeLevel || selectedKelas?.name || '';

          if (activeBank?.id) formData.append('questionBankId', activeBank.id);
          if (mapelForScan) formData.append('mapel', mapelForScan);
          if (selectedMapelId && (!activeBank || activeBank.subject?.toLowerCase() === selectedMapel?.name?.toLowerCase())) {
            formData.append('mataPelajaranId', selectedMapelId);
          }
          if (kelasForScan) formData.append('kelas', kelasForScan);
          if (selectedKelasId && (!activeBank || activeBank.gradeLevel?.toLowerCase() === selectedKelas?.name?.toLowerCase())) {
            formData.append('kelasId', selectedKelasId);
          }
          if (tahunAjaran) formData.append('tahunAjaran', tahunAjaran);
          if (semester) formData.append('semester', semester);
          if (activeBank?.totalQuestions) {
            formData.append('totalSoal', activeBank.totalQuestions.toString());
          }

          const res = await apiClient.post<any>('/formal/ljk/scan', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          const data = res.data;

          // Cocokkan data siswa berdasarkan NISN dari master / siswaList
          let matchedStudent = data.student;
          let studentId = matchedStudent?.id;
          let studentName = matchedStudent?.namaLengkap;

          if (!studentId && data.nisn && siswaList.length > 0) {
            const found = siswaList.find((s) => s.nisn === data.nisn);
            if (found) {
              studentId = found.id;
              studentName = found.namaLengkap;
            }
          }

          // Hitung statistik jawaban dengan officialKeyMap
          const totalSoal = data.totalSoal ?? 25;
          let benar = 0;
          let salah = 0;
          let kosong = 0;
          const jawaban = data.jawaban || {};

          for (let q = 1; q <= totalSoal; q++) {
            const qStr = q.toString();
            const ans = (jawaban[qStr] || '').toUpperCase();
            const key = officialKeyMap[qStr];

            if (!ans) {
              kosong++;
            } else if (key && ans === key) {
              benar++;
            } else {
              salah++;
            }
          }

          const calculatedSkor =
            Object.keys(officialKeyMap).length > 0 ? Math.round((benar / totalSoal) * 100) : data.skor ?? 0;

          const confidence = data.confidence ?? 0;
          const ambiguities = data.ambiguities || [];
          const isAmbiguous = confidence < 0.6 || ambiguities.length > 3 || !studentId;

          scannedResults.push({
            id: `bulk_${Date.now()}_${pageNum}_${Math.random().toString(36).substring(2, 6)}`,
            pageNumber: pageNum,
            fileName: page.file.name,
            file: page.file,
            previewUrl: page.previewUrl,
            fileUrl: data.fileUrl,
            kodeCabang: data.kodeCabang || '1001',
            kodeMapelNum: data.kodeMapelNum || '',
            nisn: data.nisn || '',
            studentId,
            studentName: studentName || (data.nisn ? `NISN ${data.nisn} (Belum Terdaftar)` : 'Tidak Terdeteksi'),
            kelas: data.kelas || kelasForScan || '12',
            semester: data.semester || semester || 'GANJIL',
            mapel: data.mapel || mapelForScan || (data.kodeMapelNum ? `Kode ${data.kodeMapelNum}` : ''),
            // Simpan mataPelajaranId & kelasId DARI SCAN — ini yang dipakai saat confirm, bukan dari filter UI
            mataPelajaranId: data.mataPelajaranId || undefined,
            kelasId: data.kelasId || undefined,
            jawaban,
            totalSoal,
            skor: calculatedSkor,
            jumlahBenar: data.jumlahBenar ?? benar,
            jumlahSalah: data.jumlahSalah ?? salah,
            jumlahKosong: data.jumlahKosong ?? kosong,
            confidence,
            ambiguities,
            status: isAmbiguous ? 'AMBIGUOUS' : 'SUCCESS',
            questionBankId: data.questionBank?.id || activeBank?.id,
          });
        } catch (scanErr: any) {
          console.warn(`Gagal memindai halaman ${pageNum}:`, scanErr);
          scannedResults.push({
            id: `bulk_err_${Date.now()}_${pageNum}`,
            pageNumber: pageNum,
            fileName: page.file.name,
            file: page.file,
            previewUrl: page.previewUrl,
            kodeCabang: '1001',
            kodeMapelNum: '',
            nisn: '',
            kelas: selectedKelas?.name || '',
            semester: semester || 'GANJIL',
            mapel: selectedMapel?.name || '',
            jawaban: {},
            totalSoal: 25,
            skor: 0,
            jumlahBenar: 0,
            jumlahSalah: 0,
            jumlahKosong: 25,
            confidence: 0,
            ambiguities: [],
            status: 'ERROR',
            errorMessage: scanErr.response?.data?.message || scanErr.message || 'Gagal membaca kertas LJK.',
          });
        }

        // Update items real-time agar pengguna melihat hasil bertahap
        setItems([...scannedResults]);
      }

      if (!isAbortedRef.current) {
        setPhase('REVIEW');
        showToast(
          'success',
          `Selesai memproses ${extractedPages.length} lembar LJK dari berkas PDF.`
        );
      }
    } catch (err: any) {
      console.error('Error ekstraksi / pemindaian PDF:', err);
      showToast('error', err.message || 'Terjadi kesalahan saat memproses berkas PDF.');
      setPhase('REVIEW');
    }
  };

  // Batalkan proses berjalan
  const handleCancelProcess = () => {
    isAbortedRef.current = true;
    setPhase('REVIEW');
  };

  // Update Siswa Terpilih pada Baris Tertentu
  const handleSelectStudentForItem = (itemId: string, studentId: string) => {
    const student = siswaList.find((s) => s.id === studentId);
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          return {
            ...it,
            studentId,
            studentName: student?.namaLengkap || it.studentName,
            nisn: student?.nisn || it.nisn,
            status: it.status === 'ERROR' ? 'ERROR' : it.confidence >= 0.6 ? 'SUCCESS' : 'AMBIGUOUS',
          };
        }
        return it;
      })
    );
  };

  // Hapus baris dari daftar review
  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  // Simpan hasil koreksi manual single item dari mini-editor
  const handleSaveEditedItem = (updated: BulkScannedItem) => {
    // Hitung ulang skor & statistik
    let benar = 0;
    let salah = 0;
    let kosong = 0;
    const totalSoal = updated.totalSoal || 25;

    for (let q = 1; q <= totalSoal; q++) {
      const qStr = q.toString();
      const ans = (updated.jawaban[qStr] || '').toUpperCase();
      const key = officialKeyMap[qStr];

      if (!ans) {
        kosong++;
      } else if (key && ans === key) {
        benar++;
      } else {
        salah++;
      }
    }

    const skor = Object.keys(officialKeyMap).length > 0 ? Math.round((benar / totalSoal) * 100) : updated.skor;

    const finalItem: BulkScannedItem = {
      ...updated,
      jumlahBenar: benar,
      jumlahSalah: salah,
      jumlahKosong: kosong,
      skor,
      status: updated.studentId && updated.confidence >= 0.6 ? 'SUCCESS' : updated.status,
    };

    setItems((prev) => prev.map((it) => (it.id === finalItem.id ? finalItem : it)));
    setEditingItem(null);
    showToast('info', `Hasil halaman ${finalItem.pageNumber} berhasil diperbarui.`);
  };

  // Simpan Semua Lembar Terkonfirmasi ke Backend
  const handleSaveAllToDatabase = async () => {
    const validItems = items.filter((it) => it.status !== 'ERROR' && it.nisn);
    if (validItems.length === 0) {
      showToast('error', 'Tidak ada lembar LJK valid yang dapat disimpan. Pastikan minimal ada NISN siswa.');
      return;
    }

    try {
      setPhase('SAVING');

      const payloadItems = validItems.map((it) => ({
        kodeCabang: it.kodeCabang,
        mapel: it.mapel || selectedMapel?.name || '',
        // PENTING: Gunakan mataPelajaranId dari hasil scan LJK per-item, BUKAN dari filter UI
        // Backend akan re-resolve dari it.mapel jika it.mataPelajaranId kosong
        mataPelajaranId: it.mataPelajaranId || undefined,
        semester: it.semester || semester || 'GANJIL',
        kelas: it.kelas || selectedKelas?.name || '12',
        // PENTING: Gunakan kelasId dari hasil scan LJK per-item, BUKAN dari filter UI
        kelasId: it.kelasId || undefined,
        tahunAjaran: tahunAjaran || '2024/2025',
        nisn: it.nisn,
        studentId: it.studentId || undefined,
        cabangId: selectedCabangId || undefined,
        jawaban: it.jawaban,
        totalSoal: it.totalSoal || 25,
        jumlahBenar: it.jumlahBenar,
        jumlahSalah: it.jumlahSalah,
        jumlahKosong: it.jumlahKosong,
        skor: it.skor,
        fileUrl: it.fileUrl || '',
        confidence: it.confidence,
        questionBankId: it.questionBankId || activeBank?.id || undefined,
        syncToNilaiRapor: syncToRapor,
        status: 'VERIFIED',
      }));

      const res = await apiClient.post('/formal/ljk/confirm-bulk', { items: payloadItems });

      showToast(
        'success',
        res.data?.message || `Berhasil menyimpan ${validItems.length} hasil LJK masal ke database & e-Rapor.`
      );

      onSuccessSaveAll();
      onClose();
    } catch (err: any) {
      console.error('Gagal menyimpan hasil masal:', err);
      const msg = err.response?.data?.message || err.message || 'Gagal menyimpan hasil LJK masal.';
      showToast('error', msg);
      setPhase('REVIEW');
    }
  };

  // Filter Items
  const filteredItems = useMemo(() => {
    if (filterTab === 'ATTENTION') {
      return items.filter((it) => it.status === 'AMBIGUOUS' || it.status === 'ERROR' || !it.studentId);
    }
    if (filterTab === 'VALID') {
      return items.filter((it) => it.status === 'SUCCESS' && it.studentId);
    }
    return items;
  }, [items, filterTab]);

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = items.length;
    const valid = items.filter((it) => it.status === 'SUCCESS' && it.studentId).length;
    const attention = items.filter((it) => it.status === 'AMBIGUOUS' || it.status === 'ERROR' || !it.studentId).length;
    const avgScore =
      total > 0
        ? Math.round(
            items.reduce((acc, it) => acc + (it.status !== 'ERROR' ? it.skor : 0), 0) /
              Math.max(1, total - items.filter((it) => it.status === 'ERROR').length)
          )
        : 0;

    return { total, valid, attention, avgScore };
  }, [items]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* ── HEADER MODAL ── */}
        <div className="p-5 md:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
                  Pemindaian LJK Masal (Multi-Page PDF)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  OMR Batch Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate max-w-xl">
                Berkas: <span className="text-indigo-200 font-semibold">{pdfFile?.name}</span> • Mapel:{' '}
                <span className="text-white font-semibold">{activeBank?.subject || selectedMapel?.name || '-'}</span> •
                Kelas: <span className="text-white font-semibold">{activeBank?.gradeLevel || selectedKelas?.name || '-'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={phase === 'SAVING'}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── KETERANGAN WAJIB CAMSCANNER ANDROID (BANNER) ── */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-b border-amber-200/80 px-5 py-3.5 flex items-start gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
            <AlertCircle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xs leading-relaxed text-amber-950">
            <span className="font-bold text-amber-900 block mb-0.5">
              ⚠️ Panduan Scan Lembar LJK A5 (Kertas Sudah Dipotong):
            </span>
            Kertas LJK A5 yang sudah dipotong per-santri dibaca <strong>1 lembar A5 per halaman PDF</strong> secara otomatis.
            Wajib gunakan aplikasi <strong>CamScanner Android</strong> dengan fitur <strong>Auto-Crop</strong> aktif agar 4 kotak
            hitam di sudut lembar terpotong lurus dan presisi sehingga pembacaan OMR 100% akurat.
          </div>
        </div>

        {/* ── BODY KONTEN SESUAI PHASE ── */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 bg-slate-50/50">
          {/* FASE 1: EKSTRAKSI HALAMAN PDF */}
          {phase === 'EXTRACTING' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-indigo-600 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800">Mengekstrak Halaman Berkas PDF...</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Mengonversi lembar halaman {extractProgress.current} dari {extractProgress.total || '...'} ke resolusi tinggi
                </p>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${extractProgress.total > 0 ? (extractProgress.current / extractProgress.total) * 100 : 10}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* FASE 2: PEMINDAIAN OMR REALTIME */}
          {phase === 'SCANNING' && (
            <div className="space-y-6 max-w-2xl mx-auto py-8">
              <div className="bg-white rounded-3xl border border-indigo-100 p-6 shadow-sm text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Memindai Lembar LJK ({scanProgress.current} / {scanProgress.total})
                  </h4>
                  <p className="text-xs text-indigo-600 font-medium mt-1">{scanProgress.currentTitle}</p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/80">
                    <div
                      className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 5}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>Mulai</span>
                    <span>
                      {scanProgress.total > 0
                        ? `${Math.round((scanProgress.current / scanProgress.total) * 100)}% Selesai`
                        : ''}
                    </span>
                    <span>{scanProgress.total} Lembar</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCancelProcess}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Hentikan & Lihat Hasil yang Sudah Dipindai ({items.length})
                  </button>
                </div>
              </div>

              {/* Live Preview Baris yang Sudah Terbaca */}
              {items.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2">
                  <div className="text-xs font-bold text-slate-700">Lembar yang berhasil dipindai sejauh ini:</div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {items.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">Hal. {it.pageNumber}</span>
                          <span className="text-slate-500">• {it.studentName}</span>
                          <span className="text-[10px] text-slate-400">({it.nisn || 'No NISN'})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-indigo-700">Skor: {it.skor}</span>
                          {it.status === 'SUCCESS' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FASE 3: REVIEW MASAL HASIL PEMINDAIAN */}
          {(phase === 'REVIEW' || phase === 'SAVING') && (
            <div className="space-y-5">
              {/* ── KARTU STATISTIK RINGKAS ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-semibold text-slate-500">Total Lembar PDF</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Halaman terbaca</div>
                </div>

                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs">
                  <div className="text-[11px] font-semibold text-emerald-800">Terbaca Valid & Siap</div>
                  <div className="text-xl font-extrabold text-emerald-700 mt-1">{stats.valid}</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">NISN & data cocok</div>
                </div>

                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
                  <div className="text-[11px] font-semibold text-amber-800">Perlu Perhatian</div>
                  <div className="text-xl font-extrabold text-amber-700 mt-1">{stats.attention}</div>
                  <div className="text-[10px] text-amber-600 mt-0.5">Ambigu / data belum pas</div>
                </div>

                <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200/80 shadow-2xs">
                  <div className="text-[11px] font-semibold text-indigo-800">Rata-rata Skor</div>
                  <div className="text-xl font-extrabold text-indigo-700 mt-1">{stats.avgScore}</div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">Skala 100 poin</div>
                </div>
              </div>

              {/* ── FILTER TABS & AKSI MASAL ── */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFilterTab('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      filterTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua ({items.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('ATTENTION')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      filterTab === 'ATTENTION'
                        ? 'bg-amber-100 text-amber-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-amber-800'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Perlu Cek ({stats.attention})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('VALID')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      filterTab === 'VALID'
                        ? 'bg-emerald-100 text-emerald-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-emerald-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Valid ({stats.valid})
                  </button>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none" title="Aktifkan hanya jika scan lembar A4 landscape utuh yang memuat 2 LJK belum dipotong">
                    <input
                      type="checkbox"
                      checked={splitLandscape}
                      onChange={(e) => setSplitLandscape(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Belah A4 (Jika scan 2 LJK per halaman belum dipotong)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncToRapor}
                      onChange={(e) => setSyncToRapor(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Otomatis Sinkronkan Nilai ke e-Rapor Siswa</span>
                  </label>
                </div>
              </div>

              {/* ── TABEL DAFTAR HASIL SCAN ── */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5 w-16">Hal</th>
                        <th className="px-3 py-3.5 w-24">Foto LJK</th>
                        <th className="px-4 py-3.5">Data Siswa (NISN & Nama)</th>
                        <th className="px-4 py-3.5 text-center">Analisis Jawaban</th>
                        <th className="px-4 py-3.5 text-center">Skor</th>
                        <th className="px-4 py-3.5 text-center">Tingkat Keyakinan</th>
                        <th className="px-4 py-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                            Tidak ada lembar LJK pada kategori filter ini.
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((it) => (
                          <tr key={it.id} className="hover:bg-slate-50/70 transition">
                            {/* Nomor Halaman */}
                            <td className="px-4 py-3 font-bold text-slate-700">
                              <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                                {it.pageNumber}
                              </span>
                            </td>

                            {/* Foto LJK Thumbnail */}
                            <td className="px-3 py-3">
                              <div
                                onClick={() => setPreviewZoomImage(it.previewUrl)}
                                className="relative w-16 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group cursor-pointer shadow-xs hover:border-indigo-400 transition"
                                title="Klik untuk memperbesar tampilan lembar LJK"
                              >
                                <img
                                  src={it.previewUrl}
                                  alt={`Hal ${it.pageNumber}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <ZoomIn className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            </td>

                            {/* Data Siswa */}
                            <td className="px-4 py-3">
                              <div className="space-y-1 max-w-xs">
                                <div className="font-extrabold text-slate-900 text-xs truncate">
                                  {it.studentName}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
                                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">
                                    NISN: {it.nisn || '-'}
                                  </span>
                                  {it.kodeMapelNum && (
                                    <span
                                      className="font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-indigo-200"
                                      title={`Kode Mapel terdeteksi dari LJK: ${it.kodeMapelNum}`}
                                    >
                                      Mapel {it.kodeMapelNum}: {it.mapel || 'Terdeteksi'}
                                    </span>
                                  )}
                                  {it.studentId ? (
                                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      Terdaftar
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      Pilih Manual
                                    </span>
                                  )}
                                </div>

                                {/* Dropdown Cepat Ganti Siswa jika Belum Cocok */}
                                {siswaList.length > 0 && (
                                  <div className="pt-1">
                                    <select
                                      value={it.studentId || ''}
                                      onChange={(e) => handleSelectStudentForItem(it.id, e.target.value)}
                                      className="w-full text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                      <option value="">-- Hubungkan ke Siswa Kelas --</option>
                                      {siswaList.map((s) => (
                                        <option key={s.id} value={s.id}>
                                          {s.namaLengkap} ({s.nisn})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Analisis Jawaban */}
                            <td className="px-4 py-3 text-center">
                              {it.status === 'ERROR' ? (
                                <span className="text-rose-600 font-medium text-[11px]">
                                  {it.errorMessage || 'Gagal dibaca'}
                                </span>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl">
                                  <span className="text-emerald-700 font-bold" title="Jawaban Benar">
                                    ✓ {it.jumlahBenar}
                                  </span>
                                  <span className="text-slate-300">|</span>
                                  <span className="text-rose-700 font-bold" title="Jawaban Salah">
                                    ✗ {it.jumlahSalah}
                                  </span>
                                  <span className="text-slate-300">|</span>
                                  <span className="text-slate-500 font-medium" title="Jawaban Kosong">
                                    ○ {it.jumlahKosong}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Skor */}
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-block px-3 py-1 rounded-xl text-xs font-black shadow-2xs ${
                                  it.status === 'ERROR'
                                    ? 'bg-slate-100 text-slate-400'
                                    : it.skor >= 75
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                                }`}
                              >
                                {it.status === 'ERROR' ? '-' : it.skor}
                              </span>
                            </td>

                            {/* Tingkat Keyakinan OMR */}
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    it.confidence >= 0.85
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : it.confidence >= 0.6
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {(it.confidence * 100).toFixed(0)}%
                                </span>
                                {it.ambiguities.length > 0 && (
                                  <span className="text-[10px] text-amber-600 font-medium">
                                    {it.ambiguities.length} butir ambigu
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Aksi Per Baris */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingItem(it)}
                                  className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200/60 transition cursor-pointer"
                                  title="Periksa & Edit Kunci Jawaban / Nilai Lembar Ini"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(it.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer"
                                  title="Hapus lembar ini dari daftar simpan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER MODAL ── */}
        <div className="p-4 md:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {phase === 'REVIEW' && (
              <span>
                Total <strong>{stats.valid}</strong> lembar valid siap disimpan ke database dan nilai e-Rapor.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={phase === 'SAVING'}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200 disabled:opacity-50"
            >
              Tutup / Batal
            </button>

            {phase === 'REVIEW' && (
              <button
                type="button"
                onClick={handleSaveAllToDatabase}
                disabled={stats.valid === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Simpan Semua Hasil ({stats.valid} Siswa)</span>
              </button>
            )}

            {phase === 'SAVING' && (
              <button
                disabled
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-2 opacity-75"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Seluruh Hasil ke Database...</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── ZOOM PREVIEW MODAL FOTO LJK ── */}
      {previewZoomImage && (
        <div
          onClick={() => setPreviewZoomImage(null)}
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-3xl p-3 shadow-2xl overflow-hidden flex flex-col items-center"
          >
            <button
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/60 text-white flex items-center justify-center hover:bg-slate-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewZoomImage}
              alt="Zoom Preview LJK"
              className="max-h-[82vh] w-auto object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* ── EDIT MINI MODAL UNTUK KOREKSI BUTIR JAWABAN LEMBAR INI ── */}
      {editingItem && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Periksa / Edit Lembar Jawaban (Hal. {editingItem.pageNumber})
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{editingItem.studentName}</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid 25 Butir Jawaban */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">Matriks 25 Butir Pilihan Ganda:</div>
              <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1 text-xs">
                {Array.from({ length: 25 }, (_, i) => i + 1).map((qNum) => {
                  const qStr = qNum.toString();
                  const currentAns = (editingItem.jawaban[qStr] || '').toUpperCase();
                  const officialKey = officialKeyMap[qStr];
                  const isCorrect = officialKey && currentAns === officialKey;

                  return (
                    <div
                      key={qNum}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : currentAns
                          ? 'border-rose-200 bg-rose-50/50'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-500">
                        <span>No. {qNum}</span>
                        {officialKey && <span className="text-emerald-700">Kunci: {officialKey}</span>}
                      </div>

                      <div className="flex items-center gap-1">
                        {['A', 'B', 'C', 'D'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setEditingItem({
                                ...editingItem,
                                jawaban: {
                                  ...editingItem.jawaban,
                                  [qStr]: currentAns === opt ? '' : opt,
                                },
                              });
                            }}
                            className={`w-6 h-6 rounded-lg text-[10px] font-extrabold flex items-center justify-center transition cursor-pointer ${
                              currentAns === opt
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditedItem(editingItem)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
