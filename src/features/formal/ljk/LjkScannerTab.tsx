import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import {
  UploadCloud,
  Scan,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Trash2,
  Edit3,
  FileText,
  Search,
  User,
  Sparkles,
  Award,
  Crown,
  ChevronRight,
  Eye,
  Loader2,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';

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
    totalQuestions: number;
    isOfficial?: boolean;
  } | null;
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

export const LjkScannerTab: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload & Scan state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');

  // Dual-view Preview & Edit State
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [editForm, setEditForm] = useState<{
    kodeCabang: string;
    nisn: string;
    kelas: string;
    semester: string;
    mapel: string;
    jawaban: Record<string, string>;
    questionBankId?: string;
  } | null>(null);

  // Zoom control for scan preview
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // History Filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyKelas, setHistoryKelas] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  // Fetch riwayat scan LJK
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

  // Fetch daftar Bank Soal resmi untuk pencocokan kunci jawaban
  const { data: officialBanks } = useQuery({
    queryKey: ['formal-ljk-official-banks'],
    queryFn: async () => {
      const res = await apiClient.get('/bank-soal', { params: { limit: 50 } });
      return (res.data?.data || []).filter((b: any) => b.isOfficial);
    },
  });

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
    if (file.size > 12 * 1024 * 1024) {
      showToast('error', 'Ukuran gambar maksimal 12 MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    setScanResult(null);
    setEditForm(null);
    setZoomLevel(1);
  };

  // Jalankan OCR/OMR Scanner
  const runOmrScan = async () => {
    if (!selectedFile) {
      showToast('error', 'Pilih atau drop file scan LJK terlebih dahulu.');
      return;
    }

    try {
      setIsScanning(true);
      setScanStep('Normalisasi resolusi dan kontras citra...');

      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulasikan progres step scanning
      setTimeout(() => setScanStep('Mendeteksi grid identitas (Kode Cabang & NISN)...'), 400);
      setTimeout(() => setScanStep('Memindai matriks 25 butir bulatan PG (A, B, C, D)...'), 800);
      setTimeout(() => setScanStep('Menghitung rasio kehitaman arsiran dan skor...'), 1200);

      const res = await apiClient.post<ScanResult>('/formal/ljk/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data;
      setScanResult(data);
      setEditForm({
        kodeCabang: data.kodeCabang || '1001',
        nisn: data.nisn || '',
        kelas: data.kelas || '7',
        semester: data.semester || 'GANJIL',
        mapel: data.mapel || 'Pendidikan Agama Islam',
        jawaban: { ...data.jawaban },
        questionBankId: data.questionBank?.id,
      });

      showToast(
        'success',
        `LJK berhasil diekstrak dengan tingkat keyakinan OMR ${(data.confidence * 100).toFixed(0)}%!`,
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal memproses gambar LJK.';
      showToast('error', msg);
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
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

  // Hitung ulang skor live di UI
  const calculateLiveScore = () => {
    if (!editForm) return { benar: 0, salah: 0, kosong: 0, skor: 0 };
    let benar = 0;
    let salah = 0;
    let kosong = 0;

    for (let q = 1; q <= 25; q++) {
      const ans = editForm.jawaban[q.toString()];
      if (!ans) {
        kosong++;
      } else {
        // Jika ada jawaban terisi
        benar++;
      }
    }
    const scoreVal = Number(((benar / 25) * 100).toFixed(1));
    return { benar, salah, kosong, skor: scoreVal };
  };

  // Simpan hasil LJK terkonfirmasi ke database
  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!editForm || !scanResult) return;
      const payload = {
        kodeCabang: editForm.kodeCabang,
        mapel: editForm.mapel,
        semester: editForm.semester,
        kelas: editForm.kelas,
        nisn: editForm.nisn,
        jawaban: editForm.jawaban,
        totalSoal: 25,
        fileUrl: scanResult.fileUrl,
        confidence: scanResult.confidence,
        questionBankId: editForm.questionBankId || scanResult.questionBank?.id,
        studentId: scanResult.student?.id,
        cabangId: scanResult.cabang?.id,
        status: 'VERIFIED',
      };
      return apiClient.post('/formal/ljk/confirm', payload);
    },
    onSuccess: () => {
      showToast('success', 'Hasil verifikasi LJK berhasil disimpan permanen ke database!');
      queryClient.invalidateQueries({ queryKey: ['formal-ljk-history'] });
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

  const liveStats = calculateLiveScore();

  return (
    <div className="space-y-6">
      {/* ── BANNER HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-900/50">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Scan className="w-3.5 h-3.5" />
              <span>Optical Mark Recognition (OMR) Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Pembaca & Koreksi LJK Siswa Otomatis
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Unggah foto lembar jawaban komputer 25 butir pilihan ganda. Sistem akan mendeteksi Kode Cabang,
              NISN, dan bulatan jawaban siswa, dilengkapi formulir verifikasi sebelum disimpan ke e-Rapor.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs space-y-1.5 shrink-0">
            <div className="flex items-center gap-2 text-indigo-200 font-bold">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Standar Lembar Jawaban (LJK)</span>
            </div>
            <p className="text-[11px] text-slate-300">Format: 25 Soal PG (A, B, C, D)</p>
            <p className="text-[11px] text-slate-300">Kode Cabang (4 Digit, misal: 1001)</p>
            <p className="text-[11px] text-slate-300">NISN Siswa (10 Digit Angka)</p>
          </div>
        </div>
      </div>

      {/* ── BAGIAN UTAMA: UPLOAD / DUAL-VIEW PREVIEW & EDIT ── */}
      {!scanResult ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-10 shadow-xs space-y-6">
          <div className="max-w-xl mx-auto space-y-4 text-center">
            {/* Upload Area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 md:p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
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
                      <div className="absolute inset-0 bg-indigo-900/30 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3">
                        <div className="w-full h-1 bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,1)] animate-bounce" />
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                        <p className="text-xs font-bold text-white bg-slate-900/80 px-3 py-1 rounded-full shadow">
                          {scanStep || 'Memindai citra...'}
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
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">
                      Tarik & Letakkan Foto Scan LJK di Sini
                    </h3>
                    <p className="text-xs text-slate-400">
                      Mendukung format JPG, JPEG, PNG, WEBP hingga 12 MB
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition border border-indigo-200"
                  >
                    Pilih File Gambar
                  </button>
                </>
              )}
            </div>

            {/* Tombol Jalankan OMR */}
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
                  <span>Mulai Pindai OMR & Ekstrak Data</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── DUAL-VIEW PREVIEW & EDIT MODE ── */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Top Bar Dual-View */}
          <div className="p-4 px-6 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Verifikasi Hasil Scan & Koreksi Manual
                </h3>
                <p className="text-[11px] text-slate-500">
                  Periksa foto LJK di sisi kiri dan sesuaikan formulir jawaban di sisi kanan sebelum disimpan
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
                <span>Simpan Hasil Ujian ke Database</span>
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
              {/* Card 1: Identitas Header LJK */}
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
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev!, nisn: e.target.value }))
                      }
                      className="mt-1 w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                    />
                    {scanResult.student ? (
                      <p className="text-[10px] text-emerald-600 font-bold mt-0.5 truncate">
                        ✓ {scanResult.student.namaLengkap}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-0.5">Siswa Umum</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600">Tingkat / Kelas</label>
                    <select
                      value={editForm?.kelas || '7'}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev!, kelas: e.target.value }))
                      }
                      className="mt-1 w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      {['7', '8', '9', '10', '11', '12'].map((k) => (
                        <option key={k} value={k}>
                          Kelas {k}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600">Semester</label>
                    <select
                      value={editForm?.semester || 'GANJIL'}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev!, semester: e.target.value }))
                      }
                      className="mt-1 w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="GANJIL">Ganjil</option>
                      <option value="GENAP">Genap</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
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

              {/* Card 2: Ringkasan Nilai & Paket Soal Resmi Terkait */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider">
                    Ringkasan Hasil Ujian:
                  </span>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-emerald-700">✓ Terisi: {liveStats.benar}</span>
                    <span className="text-slate-500">○ Kosong: {liveStats.kosong}</span>
                    <span className="text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-lg">
                      Skor Proyeksi: {liveStats.skor}
                    </span>
                  </div>
                </div>

                {/* Dropdown pilih naskah resmi jika ada */}
                {officialBanks && officialBanks.length > 0 && (
                  <div className="w-full sm:w-auto">
                    <select
                      value={editForm?.questionBankId || ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev!, questionBankId: e.target.value }))
                      }
                      className="w-full sm:w-64 px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-900 focus:outline-none"
                    >
                      <option value="">-- Kunci Jawaban Bebas / Mandiri --</option>
                      {officialBanks.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          👑 {b.title} ({b.subject} {b.gradeLevel})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Card 3: Matriks 25 Butir Jawaban PG */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Matriks 25 Butir Jawaban Siswa
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Klik bulatan untuk mengubah jika ada koreksi arsiran
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 bg-slate-50/40 p-4 rounded-2xl border border-slate-200/80">
                  {[...Array(25)].map((_, i) => {
                    const qNum = i + 1;
                    const val = editForm?.jawaban[qNum.toString()] || '';
                    const isAmbiguous = scanResult.ambiguities.includes(qNum);

                    return (
                      <div
                        key={qNum}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                          isAmbiguous
                            ? 'bg-amber-50/80 border-amber-300'
                            : !val
                            ? 'bg-slate-100/60 border-slate-200'
                            : 'bg-white border-slate-200/90'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 w-12">
                          <span className="font-bold text-slate-700 text-xs w-6 text-right">
                            #{qNum}
                          </span>
                          {isAmbiguous && (
                            <span title="Arsiran ambigu, harap cocokkan dengan foto">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>

                        {/* Bulatan Opsi A, B, C, D */}
                        <div className="flex items-center gap-1.5">
                          {['A', 'B', 'C', 'D'].map((opt) => {
                            const isSelected = val === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleAnswerSelect(qNum, isSelected ? '' : opt)}
                                className={`w-7 h-7 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center border ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs scale-105'
                                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
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
              <span>Riwayat Pemeriksaan LJK Ujian</span>
            </h3>
            <p className="text-xs text-slate-500">
              Daftar seluruh lembar jawaban komputer siswa yang telah diproses dan disimpan di sistem
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
    </div>
  );
};
