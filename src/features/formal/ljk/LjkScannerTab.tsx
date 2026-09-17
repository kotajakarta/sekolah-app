import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import {
  UploadCloud,
  Camera,
  Scan,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Trash2,
  FileText,
  Search,
  User,
  Sparkles,
  Award,
  Crown,
  ChevronRight,
  Eye,
  Loader2,
  SlidersHorizontal,
  GraduationCap,
  BookOpen,
  X,
  Printer,
  Layers,
} from 'lucide-react';
import { LjkPrintModal } from './LjkPrintModal';
import { LjkBulkPdfModal } from './LjkBulkPdfModal';

export interface StudentOption {
  id: string;
  namaLengkap: string;
  nisn: string;
}

export interface LjkScannerTabProps {
  selectedCabangId?: string;
  selectedKelasId?: string;
  selectedKelas?: { id: string; name: string; tingkat?: string | null };
  selectedMapelId?: string;
  selectedMapel?: { id: string; name: string; kodeMapel?: string };
  tahunAjaran?: string;
  semester?: string;
  siswaList?: StudentOption[];
}

interface MatchedStudent {
  id: string;
  namaLengkap: string;
  nisn: string;
  cabangName?: string;
}

interface ScanResult {
  kodeCabang: string;
  nisn: string;
  kelas: string;
  semester: string;
  mapel: string;
  jawaban: Record<string, string>;
  confidence: number;
  ambiguities: number[];
  totalSoal: number;
  jumlahBenar?: number;
  jumlahSalah?: number;
  jumlahKosong?: number;
  skor?: number;
  fileUrl: string;
  cabang?: { id: string; name: string; kode?: string } | null;
  student?: MatchedStudent | null;
  questionBank?: {
    id: string;
    title: string;
    subject: string;
    gradeLevel: string;
    academicYear?: string;
    semester?: string;
    totalQuestions: number;
    isOfficial?: boolean;
    answerKey?: Record<string, string>;
  } | null;
  answerKey?: Record<string, string>;
}

interface LjkHistoryItem {
  id: string;
  kodeCabang: string;
  mapel: string;
  semester: string;
  kelas: string;
  nisn: string;
  totalSoal: number;
  jumlahBenar?: number;
  jumlahSalah?: number;
  jumlahKosong?: number;
  skor?: number;
  fileUrl?: string;
  confidence?: number;
  status: string;
  createdAt: string;
  cabang?: { id: string; name: string; kode?: string };
  student?: {
    biodata?: { fullName: string; nisn: string };
  };
  questionBank?: { id: string; title: string; isOfficial?: boolean };
}

export const LjkScannerTab: React.FC<LjkScannerTabProps> = ({
  selectedCabangId,
  selectedKelasId,
  selectedKelas,
  selectedMapelId,
  selectedMapel,
  tahunAjaran = '2024/2025',
  semester = 'Ganjil',
  siswaList = [],
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  // Upload & Scan state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');

  // Print LJK Builder Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Bulk PDF Upload State
  const [bulkPdfFile, setBulkPdfFile] = useState<File | null>(null);
  const [isBulkPdfModalOpen, setIsBulkPdfModalOpen] = useState(false);
  const bulkPdfInputRef = useRef<HTMLInputElement>(null);

  // Dual-view Preview & Edit State
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [editForm, setEditForm] = useState<{
    kodeCabang: string;
    nisn: string;
    studentId?: string;
    kelas: string;
    semester: string;
    mapel: string;
    jawaban: Record<string, string>;
    questionBankId?: string;
  } | null>(null);

  // Persistent User Selected Bank Soal
  const [userSelectedBankId, setUserSelectedBankId] = useState<string>('');

  // Sync to e-Rapor Checkbox
  const [syncToRapor, setSyncToRapor] = useState<boolean>(true);

  // Zoom control for scan preview
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // History Filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyKelas, setHistoryKelas] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  // 1. Fetch riwayat scan LJK
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['formal-ljk-history', historySearch, historyKelas, historyPage],
    queryFn: async () => {
      const res = await apiClient.get('/formal/ljk', {
        params: {
          search: historySearch || undefined,
          kelas: historyKelas || undefined,
          page: historyPage,
          limit: 10,
        },
      });
      return res.data;
    },
  });

  // 2. Fetch Bank Soal resmi untuk pencocokan kunci jawaban & acuan penilaian
  const { data: officialBanks = [], isLoading: isLoadingBanks } = useQuery({
    queryKey: ['formal-ljk-official-banks', selectedMapel?.name, selectedKelas?.name],
    queryFn: async () => {
      const res = await apiClient.get('/bank-soal', {
        params: {
          isOfficial: 'true',
          limit: 50,
        },
      });
      return (res.data?.data || []).filter((b: any) => b.isOfficial);
    },
  });

  // Auto-detect bank soal resmi yang cocok dengan Mapel & Kelas saat ini
  // Priority: 1) match by selectedMapel name, 2) first official bank, 3) null
  const matchedOfficialBank = useMemo(() => {
    if (!officialBanks.length) return null;
    if (selectedMapel?.name) {
      const found = officialBanks.find(
        (b: any) =>
          b.subject?.toLowerCase().includes(selectedMapel.name.toLowerCase()) ||
          selectedMapel.name.toLowerCase().includes(b.subject?.toLowerCase()),
      );
      if (found) return found;
    }
    // Only fallback to [0] if there's exactly 1 official bank,
    // otherwise return null to avoid silently picking wrong subject
    return officialBanks.length === 1 ? officialBanks[0] : null;
  }, [officialBanks, selectedMapel]);

  // Active official bank soal ID (prioritize user choice from dropdown)
  const activeBankSoalId = userSelectedBankId || editForm?.questionBankId || scanResult?.questionBank?.id || matchedOfficialBank?.id;

  // 3. Fetch detail bank soal yang sedang aktif (termasuk butir soal & opsi kunci jawaban resmi)
  const { data: activeBankDetail } = useQuery({
    queryKey: ['bank-soal-detail-benchmark', activeBankSoalId],
    queryFn: async () => {
      if (!activeBankSoalId) return null;
      const res = await apiClient.get(`/bank-soal/${activeBankSoalId}`);
      return res.data;
    },
    enabled: !!activeBankSoalId,
  });

  // Ekstrak Kunci Jawaban Resmi dari Bank Soal
  const officialKeyMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (activeBankDetail?.questions && activeBankDetail.questions.length > 0) {
      activeBankDetail.questions.forEach((q: any, idx: number) => {
        const qNum = (idx + 1).toString();
        const correctOpt = q.options?.find((o: any) => o.isCorrect);
        if (correctOpt?.label) {
          map[qNum] = correctOpt.label.toUpperCase();
        } else if (q.answerKey) {
          map[qNum] = q.answerKey.toUpperCase();
        }
      });
    } else if (scanResult?.answerKey) {
      return scanResult.answerKey;
    }
    return map;
  }, [activeBankDetail, scanResult]);

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Harap unggah file gambar (JPG, JPEG, PNG, WEBP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      showToast('error', 'Ukuran gambar maksimal 15 MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    setScanResult(null);
    setEditForm(null);
    setZoomLevel(1);
  };

  // Jalankan OCR/OMR Scanner dengan file tertentu
  const runOmrScanWithFile = async (fileToScan: File) => {
    try {
      setIsScanning(true);
      setScanStep('Normalisasi resolusi & orientasi lembar LJK...');

      const formData = new FormData();
      formData.append('file', fileToScan);

      // Prioritas mapel & kelas: dari bank soal aktif (yang dipilih user di dropdown naskah)
      // bukan dari selectedMapel parent page (yang mungkin berbeda)
      const activeBankForScan = activeBankDetail || (activeBankSoalId ? officialBanks.find((b: any) => b.id === activeBankSoalId) : null) || matchedOfficialBank;
      const mapelForScan = activeBankForScan?.subject || selectedMapel?.name || '';
      const kelasForScan = activeBankForScan?.gradeLevel || selectedKelas?.name || '';

      if (activeBankSoalId) formData.append('questionBankId', activeBankSoalId);
      if (mapelForScan) formData.append('mapel', mapelForScan);
      // Hanya kirim mataPelajaranId jika subjek bank soal cocok dengan mata pelajaran parent
      if (selectedMapelId && (!activeBankForScan || activeBankForScan.subject?.toLowerCase() === selectedMapel?.name?.toLowerCase())) {
        formData.append('mataPelajaranId', selectedMapelId);
      }
      if (kelasForScan) formData.append('kelas', kelasForScan);
      if (selectedKelasId && (!activeBankForScan || activeBankForScan.gradeLevel?.toLowerCase() === selectedKelas?.name?.toLowerCase())) {
        formData.append('kelasId', selectedKelasId);
      }
      if (tahunAjaran) formData.append('tahunAjaran', tahunAjaran);
      if (semester) formData.append('semester', semester);

      setTimeout(() => setScanStep('Mendeteksi grid identitas (Kode Cabang & NISN)...'), 400);
      setTimeout(() => setScanStep('Memindai matriks 25 butir bulatan PG (A, B, C, D)...'), 800);
      setTimeout(() => setScanStep('Mencocokkan kunci jawaban Bank Soal Resmi & kalkulasi skor...'), 1200);

      const res = await apiClient.post<ScanResult>('/formal/ljk/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data;
      setScanResult(data);

      // Mapel & kelas dari bank soal (bukan dari parent page)
      // Bank soal yang dipilih adalah acuan utama, bukan selectedMapel
      const bankSubject = data.questionBank?.subject || activeBankForScan?.subject || mapelForScan;
      const bankGrade = data.questionBank?.gradeLevel || activeBankForScan?.gradeLevel || kelasForScan;

      // Auto-cocokkan siswa berdasarkan NISN dari hasil scan
      // Cek dari: 1) backend matched student, 2) siswaList by NISN
      let autoMatchedStudentId = data.student?.id;
      let autoMatchedNisn = data.nisn || '';

      if (!autoMatchedStudentId && data.nisn && siswaList.length > 0) {
        const found = siswaList.find((s) => s.nisn === data.nisn);
        if (found) autoMatchedStudentId = found.id;
      }

      setEditForm({
        kodeCabang: data.kodeCabang || '1001',
        nisn: autoMatchedNisn,
        studentId: autoMatchedStudentId,
        kelas: bankGrade || data.kelas || selectedKelas?.name || '12',
        semester: data.semester || semester || 'GANJIL',
        // Mapel: WAJIB dari bank soal yang dipilih, bukan dari selectedMapel parent
        mapel: bankSubject || data.mapel || selectedMapel?.name || '',
        jawaban: { ...data.jawaban },
        questionBankId: data.questionBank?.id || activeBankSoalId,
      });

      showToast(
        'success',
        `LJK berhasil dipindai dengan tingkat keyakinan OMR ${(data.confidence * 100).toFixed(0)}%${autoMatchedStudentId ? ' | Siswa teridentifikasi!' : ''}`,
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal memproses gambar LJK.';
      showToast('error', msg);
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  const runOmrScan = () => {
    if (!selectedFile) {
      showToast('error', 'Pilih atau jepret foto LJK terlebih dahulu.');
      return;
    }
    runOmrScanWithFile(selectedFile);
  };

  // Ubah jawaban butir soal manual di form
  const handleAnswerSelect = (qNum: number, opt: string) => {
    if (!editForm) return;
    setEditForm((prev) => ({
      ...prev!,
      jawaban: {
        ...prev!.jawaban,
        [qNum.toString()]: opt,
      },
    }));
  };

  // Hitung ulang skor live di UI berdasarkan Kunci Jawaban Resmi
  // Formula: tiap soal benar = 4 poin (25 soal × 4 = 100 poin maks)
  const liveStats = useMemo(() => {
    if (!editForm) return { benar: 0, salah: 0, kosong: 0, skor: 0, total: 25 };
    const hasKeys = Object.keys(officialKeyMap).length > 0;
    let benar = 0;
    let salah = 0;
    let kosong = 0;
    const total = 25;

    for (let q = 1; q <= total; q++) {
      const studentAns = (editForm.jawaban[q.toString()] || '').toUpperCase().trim();
      const officialKey = (officialKeyMap[q.toString()] || '').toUpperCase().trim();

      if (!studentAns) {
        kosong++;
      } else if (hasKeys) {
        if (officialKey && studentAns === officialKey) {
          benar++;
        } else {
          salah++;
        }
      } else {
        // Fallback jika belum ada kunci resmi: hitung semua yg diisi sebagai benar
        benar++;
      }
    }

    // Skor: benar × 4 (25 soal × 4 = 100 poin maks)
    const skor = benar * 4;
    return { benar, salah, kosong, skor, total };
  }, [editForm?.jawaban, officialKeyMap]);

  // Simpan hasil LJK terkonfirmasi ke database & auto-sync ke e-Rapor
  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!editForm || !scanResult) return;

      const payload = {
        kodeCabang: editForm.kodeCabang,
        mapel: editForm.mapel,
        mataPelajaranId: selectedMapelId || undefined,
        semester: editForm.semester,
        kelas: editForm.kelas,
        kelasId: selectedKelasId || undefined,
        tahunAjaran: tahunAjaran || '2024/2025',
        nisn: editForm.nisn,
        studentId: editForm.studentId || scanResult.student?.id,
        cabangId: scanResult.cabang?.id || selectedCabangId || undefined,
        jawaban: editForm.jawaban,
        totalSoal: 25,
        jumlahBenar: liveStats.benar,
        jumlahSalah: liveStats.salah,
        jumlahKosong: liveStats.kosong,
        skor: liveStats.skor,
        fileUrl: scanResult.fileUrl,
        confidence: scanResult.confidence,
        questionBankId: editForm.questionBankId || activeBankSoalId || undefined,
        syncToNilaiRapor: syncToRapor,
        status: 'VERIFIED',
      };

      const res = await apiClient.post('/formal/ljk/confirm', payload);
      return res.data;
    },
    onSuccess: (data: any) => {
      const msg = data?.message || 'Hasil verifikasi LJK berhasil disimpan!';
      showToast('success', msg);

      // Invalidate query agar nilai di Tab Nilai, Leger, dan Riwayat LJK langsung update
      queryClient.invalidateQueries({ queryKey: ['formal-ljk-history'] });
      queryClient.invalidateQueries({ queryKey: ['erapor-nilai'] });
      queryClient.invalidateQueries({ queryKey: ['erapor-leger'] });
      queryClient.invalidateQueries({ queryKey: ['erapor-cetak-list'] });

      // Reset form
      setScanResult(null);
      setEditForm(null);
      setSelectedFile(null);
      setPreviewImage(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Gagal menyimpan hasil LJK.';
      showToast('error', msg);
    },
  });

  // Hapus riwayat
  const deleteHistoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/formal/ljk/${id}`);
    },
    onSuccess: () => {
      showToast('success', 'Data LJK berhasil dihapus.');
      queryClient.invalidateQueries({ queryKey: ['formal-ljk-history'] });
    },
  });

  const handleDeleteHistory = (id: string, nisn: string) => {
    if (confirm(`Hapus data hasil pemeriksaan LJK untuk NISN ${nisn}?`)) {
      deleteHistoryMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── BANNER HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-900/50">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Scan className="w-3.5 h-3.5" />
              <span>Optical Mark Recognition (OMR) & Camera Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Pindai LJK & Penilaian Otomatis Berbasis Bank Soal Resmi
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Gunakan kamera perangkat (laptop/HP) atau unggah foto kertas LJK 25 butir pilihan ganda. Sistem
              otomatis mencocokkan jawaban dengan <strong>Kunci Bank Soal Resmi</strong> dan langsung
              menyinkronkan nilai ujian ke <strong>e-Rapor Siswa</strong>.
            </p>

            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ Cetak Lembar LJK Siswa (Pre-Filled)</span>
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs space-y-2 shrink-0">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Integrasi Bank Soal Resmi</span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1 font-medium">
              <p className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mapel: <strong>{selectedMapel?.name || 'Semua Mapel'}</strong></span>
              </p>
              <p className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Kelas: <strong>{selectedKelas?.name || 'Semua Kelas'}</strong></span>
              </p>
              <p className="text-[10px] text-slate-400 pt-0.5">
                T.A {tahunAjaran} • Semester {semester}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD ACUAN NASKAH BANK SOAL RESMI ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-slate-50 border border-amber-300/40 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                Acuan Penilaian Resmi
              </span>
              {activeBankDetail && (
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {Object.keys(officialKeyMap).length} Kunci Terpasang
                </span>
              )}
            </div>
            <h4 className="font-bold text-slate-900 text-sm md:text-base">
              {activeBankDetail?.title || matchedOfficialBank?.title || 'Belum Ada Bank Soal Resmi Ditandai'}
            </h4>
            <p className="text-xs text-slate-600">
              {activeBankDetail
                ? `${activeBankDetail.subject} • ${activeBankDetail.gradeLevel} • ${activeBankDetail.questions?.length || 25} Soal PG`
                : 'Pilih bank soal resmi untuk mencocokkan kunci jawaban secara otomatis'}
            </p>
          </div>
        </div>

        {/* Dropdown Pemilihan Bank Soal Resmi */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <select
            value={activeBankSoalId || ''}
            onChange={(e) => {
              const val = e.target.value;
              setUserSelectedBankId(val);
              // Cari bank yang dipilih untuk update mapel & kelas secara otomatis
              const chosenBank = officialBanks.find((b: any) => b.id === val);
              if (editForm) {
                setEditForm((prev) => prev ? {
                  ...prev,
                  questionBankId: val,
                  ...(chosenBank ? {
                    mapel: chosenBank.subject || prev.mapel,
                    kelas: chosenBank.gradeLevel || prev.kelas,
                  } : {}),
                } : null);
              }
            }}
            className="w-full md:w-72 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-xs cursor-pointer"
          >
            <option value="">-- Kunci Jawaban Bebas / Mandiri --</option>
            {officialBanks.map((b: any) => (
              <option key={b.id} value={b.id}>
                👑 {b.title} ({b.subject} {b.gradeLevel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── BAGIAN UTAMA: UPLOAD / CAMERA / DUAL-VIEW PREVIEW & EDIT ── */}
      {!scanResult ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-10 shadow-xs space-y-6">
          <div className="max-w-xl mx-auto space-y-6 text-center">
            {/* Opsi Metode Input: Kamera HP (Utama), Galeri/File, Cetak Lembar LJK, Upload PDF Masal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
              {/* 1. Kamera HP Bawaan (Tombol Utama Terbesar & Paling Mudah untuk Guru) */}
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="px-4 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl text-xs font-bold shadow-lg hover:shadow-indigo-500/25 transition flex items-center justify-center gap-3 cursor-pointer ring-2 ring-indigo-500/30 active:scale-[0.98]"
                title="Buka kamera bawaan HP untuk jepret LJK dengan kualitas foto maksimal"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-xs font-extrabold">Ambil Foto (Kamera HP)</div>
                  <div className="text-[10px] text-blue-100 font-normal">Kamera langsung</div>
                </div>
              </button>

              {/* 2. Upload dari Galeri / File */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-4 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-3 cursor-pointer border border-slate-200 active:scale-[0.98]"
                title="Pilih foto LJK dari galeri foto atau folder file komputer"
              >
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-xs border border-slate-200 shrink-0">
                  <UploadCloud className="w-5 h-5 text-slate-600" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-xs font-extrabold">Pilih Foto / Galeri</div>
                  <div className="text-[10px] text-slate-500 font-normal">Foto dari galeri</div>
                </div>
              </button>

              {/* 3. Upload PDF LJK Masal */}
              <button
                type="button"
                onClick={() => bulkPdfInputRef.current?.click()}
                className="px-4 py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-purple-500/20 transition flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98] ring-2 ring-purple-500/20"
                title="Unggah berkas PDF berisi banyak lembar LJK untuk dipindai secara masal"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-xs font-extrabold flex items-center gap-1">
                    <span>Upload PDF Masal</span>
                    <span className="text-[8px] bg-white/30 px-1 py-0.2 rounded font-black tracking-wider">OMR</span>
                  </div>
                  <div className="text-[10px] text-purple-100 font-normal">Multi-Page LJK</div>
                </div>
              </button>

              {/* 4. Cetak Lembar LJK Siswa */}
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="px-4 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-emerald-500/20 transition flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98]"
                title="Cetak lembar jawaban kosong untuk ujian siswa"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-xs font-extrabold">Cetak Format LJK</div>
                  <div className="text-[10px] text-emerald-100 font-normal">PDF Lembar Jawab</div>
                </div>
              </button>
            </div>

            {/* Banner Keterangan Wajib CamScanner Android (Auto-Crop) */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-200/90 rounded-2xl p-4 text-left flex items-start gap-3 text-amber-950 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
              </div>
              <div className="text-xs leading-relaxed">
                <span className="font-extrabold text-amber-950 block mb-0.5">
                  ⚠️ Petunjuk Upload LJK Masal (Wajib CamScanner Android Auto-Crop):
                </span>
                Jika mengunggah lembar LJK via PDF masal, <strong>wajib menggunakan aplikasi CamScanner Android</strong> (atau document scanner sejenis) dengan fitur <strong>Auto-Crop</strong> aktif. Auto-crop memotong batas 4 kotak hitam di sudut lembar LJK secara presisi dan lurus agar pembacaan OMR akurat.
              </div>
            </div>

            {/* Input Tersembunyi untuk Upload PDF Masal */}
            <input
              ref={bulkPdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
                    showToast('error', 'Harap pilih berkas dokumen format PDF.');
                    return;
                  }
                  setBulkPdfFile(file);
                  setIsBulkPdfModalOpen(true);
                }
                e.target.value = '';
              }}
            />

            {/* Input Tersembunyi untuk Kamera Bawaan HP */}
            <input
              ref={nativeCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  processSelectedFile(file);
                  showToast('info', 'Foto LJK berhasil diambil dari kamera HP. Memindai OMR...');
                  setTimeout(() => {
                    runOmrScanWithFile(file);
                  }, 300);
                }
                e.target.value = '';
              }}
            />

            {/* Dropzone Area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 md:p-10 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
                previewImage
                  ? 'border-indigo-400 bg-indigo-50/20'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {previewImage ? (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="relative max-h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                    <img
                      src={previewImage}
                      alt="Preview LJK"
                      className="max-h-64 object-contain"
                    />
                    {isScanning && (
                      <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
                        <div className="w-full h-1 bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,1)] animate-bounce" />
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                        <p className="text-xs font-bold text-white bg-slate-900/90 px-4 py-1.5 rounded-full shadow border border-indigo-400/40">
                          {scanStep || 'Memindai citra LJK...'}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-700">{selectedFile?.name}</p>
                  <p className="text-[11px] text-slate-400">
                    Klik untuk mengganti foto atau drag file lain ke sini
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                    <Scan className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">
                      Tarik & Letakkan Foto Scan LJK di Sini
                    </h3>
                    <p className="text-xs text-slate-400">
                      Mendukung format JPG, JPEG, PNG, WEBP hingga 15 MB
                    </p>
                  </div>
                  <span className="text-[11px] text-indigo-600 font-bold underline">
                    atau jelajahi file di penyimpanan lokal
                  </span>
                </>
              )}
            </div>

            {/* Tombol Mulai Scan */}
            {selectedFile && !isScanning && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewImage(null);
                  }}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={runOmrScan}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Scan className="w-4 h-4" />
                  <span>Mulai Pindai OMR & Cocokkan Bank Soal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── DUAL-VIEW PREVIEW & EDIT MODE ── */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Top Bar Dual-View */}
          <div className="p-4 px-6 bg-slate-50/90 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Verifikasi Hasil Scan & Sinkronisasi Nilai e-Rapor
                </h3>
                <p className="text-[11px] text-slate-500">
                  Periksa citra kertas LJK di sisi kiri dan konfirmasi kunci jawaban serta identitas siswa di sisi kanan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setScanResult(null);
                  setEditForm(null);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Pindai Ulang</span>
              </button>
              <button
                type="button"
                disabled={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {confirmMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Simpan & Masukkan ke Nilai Rapor</span>
              </button>
            </div>
          </div>

          {/* Grid Dua Kolom */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* KOLOM KIRI: FOTO SCAN LJK ASLI (5 / 12) */}
            <div className="lg:col-span-5 p-6 flex flex-col justify-between bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Citra Lembar Jawaban (Scan Asli)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
                    title="Zoom Out"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono font-bold text-slate-600 px-1">
                    {(zoomLevel * 100).toFixed(0)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                    title="Zoom In"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Box Image Preview */}
              <div className="w-full max-h-[600px] overflow-auto rounded-2xl border border-slate-200 bg-white p-2 flex items-center justify-center custom-scrollbar">
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Scan LJK"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                    className="transition-transform duration-150 max-w-full rounded-lg shadow-xs"
                  />
                )}
              </div>

              {/* Status OMR Metric */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">OMR Confidence:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                      scanResult.confidence >= 0.8
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {(scanResult.confidence * 100).toFixed(0)}% Keyakinan
                  </span>
                </div>
                {scanResult.ambiguities.length > 0 && (
                  <p className="text-amber-700 font-medium text-[11px] flex items-center gap-1 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>
                      Perlu dicek: Nomor {scanResult.ambiguities.join(', ')} (arsiran ganda/tipis)
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* KOLOM KANAN: FORMULIR HASIL EKSTRAKSI & EDIT 25 JAWABAN (7 / 12) */}
            <div className="lg:col-span-7 p-6 space-y-6">
              {/* Card 1: Identitas Header LJK & Siswa */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  Identitas Ujian & Siswa
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600">Kode Cabang *</label>
                    <input
                      type="text"
                      value={editForm?.kodeCabang || ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev!, kodeCabang: e.target.value }))
                      }
                      className="mt-1 w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                    />
                    {scanResult.cabang && (
                      <p className="text-[10px] text-indigo-600 font-bold mt-0.5 truncate">
                        ✓ {scanResult.cabang.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600">NISN Siswa *</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={editForm?.nisn || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Auto-cocokkan siswa dari list ketika NISN diketik/diubah
                        const matched = siswaList.find((s) => s.nisn === val);
                        setEditForm((prev) => ({
                          ...prev!,
                          nisn: val,
                          studentId: matched?.id || (val.length < 10 ? undefined : prev?.studentId),
                        }));
                      }}
                      className={`mt-1 w-full px-3 py-1.5 bg-white border rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono ${
                        editForm?.studentId ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200'
                      }`}
                    />
                    {/* Tampilkan nama siswa yang cocok dengan NISN */}
                    {(() => {
                      const fromList = siswaList.find(s => s.id === editForm?.studentId);
                      const fromScan = scanResult?.student;
                      const displayName = fromList?.namaLengkap || fromScan?.namaLengkap;
                      return displayName ? (
                        <p className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {displayName}
                        </p>
                      ) : editForm?.nisn && editForm.nisn.length === 10 ? (
                        <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                          ⚠ NISN tidak ditemukan di kelas ini
                        </p>
                      ) : null;
                    })()}
                  </div>

                  {/* Dropdown Siswa Terdaftar di Kelas */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600">Pilih Siswa (Master)</label>
                    <select
                      value={editForm?.studentId || ''}
                      onChange={(e) => {
                        const sId = e.target.value;
                        const allStudents = [
                          ...siswaList,
                          ...(scanResult?.student && !siswaList.some(s => s.id === scanResult.student!.id)
                            ? [{ id: scanResult.student.id, namaLengkap: scanResult.student.namaLengkap, nisn: scanResult.student.nisn }]
                            : []),
                        ];
                        const st = allStudents.find((s) => s.id === sId);
                        setEditForm((prev) => ({
                          ...prev!,
                          studentId: sId,
                          nisn: st?.nisn || prev?.nisn || '',
                        }));
                      }}
                      className={`mt-1 w-full px-3 py-1.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                        editForm?.studentId ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200'
                      }`}
                    >
                      <option value="">-- Pilih Nama Siswa --</option>
                      {/* Gabungkan siswa dari kelas dan siswa hasil deteksi OMR */}
                      {[
                        ...(scanResult?.student && !siswaList.some(s => s.id === scanResult.student!.id)
                          ? [{ id: scanResult.student.id, namaLengkap: scanResult.student.namaLengkap, nisn: scanResult.student.nisn, isDetected: true }]
                          : []),
                        ...siswaList,
                      ].map((st: any) => (
                        <option key={st.id} value={st.id}>
                          {st.isDetected ? `✨ [Terdeteksi OMR] ` : ''}{st.namaLengkap} ({st.nisn})
                        </option>
                      ))}
                    </select>
                    {/* Jika student dari scan tidak ada di list (beda kelas), tampilkan info */}
                    {!editForm?.studentId && scanResult?.student && (
                      <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                        📋 Dari DB: {scanResult.student.namaLengkap} ({scanResult.student.nisn})
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600">Tingkat / Kelas</label>
                    <input
                      type="text"
                      value={editForm?.kelas || ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev!, kelas: e.target.value }))
                      }
                      className="mt-1 w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600">Semester</label>
                    <input
                      type="text"
                      value={editForm?.semester || ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev!, semester: e.target.value }))
                      }
                      className="mt-1 w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600">Mata Pelajaran</label>
                    <input
                      type="text"
                      value={editForm?.mapel || ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev!, mapel: e.target.value }))
                      }
                      className="mt-1 w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Ringkasan Nilai Live Berdasarkan Kunci Bank Soal Resmi */}
              <div className="p-4 bg-gradient-to-r from-indigo-50/80 to-amber-50/60 rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider">
                      Hasil Penilaian Live (Kunci Bank Soal):
                    </span>
                    {Object.keys(officialKeyMap).length > 0 ? (
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-md">
                        Menggunakan Kunci Resmi ({Object.keys(officialKeyMap).length} Soal)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 bg-slate-200 font-bold px-2 py-0.5 rounded-md">
                        Kunci Mandiri (Belum ada kunci resmi)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                      ✓ Benar: {liveStats.benar}
                    </span>
                    <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                      ✗ Salah: {liveStats.salah}
                    </span>
                    <span className="text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                      ○ Kosong: {liveStats.kosong}
                    </span>
                    <span className="text-indigo-900 bg-indigo-100 border border-indigo-200 px-3 py-0.5 rounded-lg text-sm">
                      Nilai Ujian: <strong>{liveStats.skor}</strong>
                    </span>
                  </div>
                </div>

                {/* Auto-Sync e-Rapor Switch */}
                <div className="bg-white p-3 rounded-xl border border-indigo-200/80 shadow-xs space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncToRapor}
                      onChange={(e) => setSyncToRapor(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Otomatis Masuk ke e-Rapor
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-500 leading-tight max-w-[200px]">
                    Skor langsung terisi ke Tab 1 (Nilai Mapel) & Leger Nilai siswa.
                  </p>
                </div>
              </div>

              {/* Card 3: Matriks 25 Butir Jawaban PG dengan Kunci Benchmark */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Matriks 25 Butir Jawaban Siswa & Pembanding Kunci Resmi
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Klik bulatan untuk mengubah jawaban jika arsiran salah dibaca
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5 bg-slate-50/40 p-4 rounded-2xl border border-slate-200/80">
                  {[...Array(25)].map((_, i) => {
                    const qNum = i + 1;
                    const studentAns = (editForm?.jawaban[qNum.toString()] || '').toUpperCase().trim();
                    const officialKey = (officialKeyMap[qNum.toString()] || '').toUpperCase().trim();
                    const isAmbiguous = scanResult.ambiguities.includes(qNum);

                    const isCorrect = officialKey && studentAns === officialKey;
                    const isWrong = officialKey && studentAns && studentAns !== officialKey;

                    return (
                      <div
                        key={qNum}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                          isAmbiguous
                            ? 'bg-amber-50/80 border-amber-300'
                            : isCorrect
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : isWrong
                            ? 'bg-rose-50/50 border-rose-200'
                            : !studentAns
                            ? 'bg-slate-100/60 border-slate-200'
                            : 'bg-white border-slate-200/90'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 w-14">
                          <span className="font-bold text-slate-700 text-xs w-6 text-right">
                            #{qNum}
                          </span>
                          {isAmbiguous ? (
                            <span title="Arsiran ambigu, harap cocokkan dengan foto">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          ) : isCorrect ? (
                            <span title="Jawaban Cocok dengan Kunci Resmi">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                          ) : isWrong ? (
                            <span title={`Salah (Kunci: ${officialKey})`}>
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            </span>
                          ) : null}
                        </div>

                        {/* Bulatan Opsi A, B, C, D */}
                        <div className="flex items-center gap-1.5">
                          {['A', 'B', 'C', 'D'].map((opt) => {
                            const isSelected = studentAns === opt;
                            const isKey = officialKey === opt;

                            let btnClass = 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100';
                            if (isSelected) {
                              if (officialKey) {
                                btnClass = isCorrect
                                  ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                                  : 'bg-rose-600 border-rose-700 text-white shadow-xs';
                              } else {
                                btnClass = 'bg-indigo-600 border-indigo-700 text-white shadow-xs';
                              }
                            } else if (isKey) {
                              btnClass = 'bg-emerald-50 border-emerald-400 text-emerald-800 font-black ring-1 ring-emerald-400';
                            }

                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleAnswerSelect(qNum, isSelected ? '' : opt)}
                                className={`w-7 h-7 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center border ${btnClass}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Kunci Badge Preview */}
                        <div className="text-[10px] font-mono font-bold w-12 text-right">
                          {officialKey ? (
                            <span className={isCorrect ? 'text-emerald-700' : isWrong ? 'text-rose-600' : 'text-slate-400'}>
                              [{officialKey}]
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* ── TABEL RIWAYAT HASIL KOREKSI LJK ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Riwayat Pemeriksaan LJK Ujian Siswa</span>
            </h3>
            <p className="text-xs text-slate-500">
              Daftar seluruh lembar jawaban komputer siswa yang telah diproses dan disinkronkan ke sistem
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Cari NISN, nama, cabang..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <select
              value={historyKelas}
              onChange={(e) => setHistoryKelas(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="">Semua Tingkat</option>
              {['7', '8', '9', '10', '11', '12'].map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabel Data */}
        {isLoadingHistory ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !historyData?.data || historyData.data.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <Scan className="w-8 h-8 mx-auto text-slate-300" />
            <p>Belum ada data pemeriksaan LJK.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-3">Siswa & NISN</th>
                  <th className="py-3 px-3">Cabang</th>
                  <th className="py-3 px-3">Mapel & Tingkat</th>
                  <th className="py-3 px-3">Periode</th>
                  <th className="py-3 px-3 text-center">Skor Ujian</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyData.data.map((item: LjkHistoryItem, idx: number) => {
                  const rowNo = (historyPage - 1) * 10 + idx + 1;
                  const studentName = item.student?.biodata?.fullName || 'Siswa Umum';
                  const cabangName = item.cabang?.name || `Cabang #${item.kodeCabang}`;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">{rowNo}</td>

                      <td className="py-3 px-3 font-semibold text-slate-800">
                        <div className="space-y-0.5">
                          <span>{studentName}</span>
                          <p className="text-[11px] font-mono font-normal text-slate-400">
                            NISN: {item.nisn}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-medium">
                        <div className="space-y-0.5">
                          <span>{cabangName}</span>
                          <p className="text-[10px] font-mono text-indigo-600 font-bold">
                            #{item.kodeCabang}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-700">
                        <span className="font-bold">{item.mapel}</span>
                        <p className="text-[11px] text-slate-400">Kelas {item.kelas}</p>
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-medium">
                        <span>Semester {item.semester}</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs">
                          {item.skor !== null && item.skor !== undefined ? item.skor : '-'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteHistory(item.id, item.nisn)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Data LJK"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL LJK BUILDER / CETAK LEMBAR LJK PRE-FILLED ── */}
      <LjkPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        selectedCabangId={selectedCabangId}
        selectedKelas={selectedKelas}
        selectedMapel={selectedMapel}
        tahunAjaran={tahunAjaran}
        semester={semester}
        siswaList={siswaList}
        officialBankTitle={activeBankDetail?.title || matchedOfficialBank?.title}
      />

      {/* ── MODAL UPLOAD & REVIEW LJK MASAL VIA PDF ── */}
      <LjkBulkPdfModal
        isOpen={isBulkPdfModalOpen}
        onClose={() => {
          setIsBulkPdfModalOpen(false);
          setBulkPdfFile(null);
        }}
        pdfFile={bulkPdfFile}
        selectedCabangId={selectedCabangId}
        selectedKelasId={selectedKelasId}
        selectedKelas={selectedKelas}
        selectedMapelId={selectedMapelId}
        selectedMapel={selectedMapel}
        tahunAjaran={tahunAjaran}
        semester={semester}
        siswaList={siswaList}
        activeBankSoalId={activeBankSoalId}
        activeBankDetail={activeBankDetail}
        officialBanks={officialBanks}
        matchedOfficialBank={matchedOfficialBank}
        onSuccessSaveAll={() => {
          queryClient.invalidateQueries({ queryKey: ['formal-ljk-history'] });
          queryClient.invalidateQueries({ queryKey: ['erapor-nilai'] });
          queryClient.invalidateQueries({ queryKey: ['erapor-leger'] });
          queryClient.invalidateQueries({ queryKey: ['erapor-cetak-list'] });
        }}
      />
    </div>
  );
};
