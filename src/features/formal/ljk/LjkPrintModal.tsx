import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import {
  Printer,
  X,
  CheckSquare,
  Square,
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sliders,
  BookOpen,
  GraduationCap,
  Calendar,
  Loader2,
  Scissors,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { StudentOption } from './LjkScannerTab';

export interface LjkPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCabangId?: string;
  selectedKelas?: { id: string; name: string; tingkat?: string | null };
  selectedMapel?: { id: string; name: string; kodeMapel?: string };
  tahunAjaran?: string;
  semester?: string;
  siswaList?: StudentOption[];
  officialBankTitle?: string;
}

export const LjkPrintModal: React.FC<LjkPrintModalProps> = ({
  isOpen,
  onClose,
  selectedCabangId,
  selectedKelas,
  selectedMapel,
  tahunAjaran: initialTahunAjaran,
  semester: initialSemester,
  siswaList: initialSiswaList = [],
  officialBankTitle,
}) => {
  // 1. Fetch Pengaturan Akademik Aktif
  const { data: pengaturanAkademik } = useQuery({
    queryKey: ['pengaturan-akademik'],
    queryFn: async () => {
      const res = await apiClient.get('/pengaturan/akademik');
      return res.data;
    },
  });

  const activeTahunAjaran =
    pengaturanAkademik?.tahunAjaran || initialTahunAjaran || '2026/2027';
  const activeSemester =
    pengaturanAkademik?.semesterAktif || initialSemester || 'Ganjil';

  // 2. Fetch Master Kelas/Rombel
  const { data: masterKelasList = [] } = useQuery({
    queryKey: ['kelas-list-ljk-builder'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/formal/kelas');
      return res.data || [];
    },
    enabled: isOpen,
  });

  // 3. Fetch Master Mapel
  const { data: masterMapelList = [] } = useQuery({
    queryKey: ['mapel-list-ljk-builder'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/formal/mapel');
      return res.data || [];
    },
    enabled: isOpen,
  });

  // State Pilihan Kelas & Mapel di Modal
  const [selectedKelasId, setSelectedKelasId] = useState<string>(
    selectedKelas?.id || '',
  );
  const [selectedMapelId, setSelectedMapelId] = useState<string>(
    selectedMapel?.id || '',
  );

  // Sinkronkan inisialisasi saat modal dibuka
  useEffect(() => {
    if (selectedKelas?.id && !selectedKelasId) {
      setSelectedKelasId(selectedKelas.id);
    } else if (!selectedKelasId && masterKelasList.length > 0) {
      setSelectedKelasId(masterKelasList[0].id);
    }
  }, [selectedKelas, masterKelasList, selectedKelasId]);

  useEffect(() => {
    if (selectedMapel?.id && !selectedMapelId) {
      setSelectedMapelId(selectedMapel.id);
    } else if (!selectedMapelId && masterMapelList.length > 0) {
      setSelectedMapelId(masterMapelList[0].id);
    }
  }, [selectedMapel, masterMapelList, selectedMapelId]);

  // Objek Kelas Terpilih
  const currentKelasObj = useMemo(() => {
    return (
      masterKelasList.find((k) => k.id === selectedKelasId) || selectedKelas
    );
  }, [masterKelasList, selectedKelasId, selectedKelas]);

  // Objek Mapel Terpilih
  const currentMapelObj = useMemo(() => {
    return (
      masterMapelList.find((m) => m.id === selectedMapelId) || selectedMapel
    );
  }, [masterMapelList, selectedMapelId, selectedMapel]);

  // 4. Fetch Santri dari kelas yang sedang dipilih
  const { data: fetchedStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['kelas-students-ljk', selectedKelasId],
    queryFn: async () => {
      if (!selectedKelasId) return [];
      const res = await apiClient.get(`/formal/kelas/${selectedKelasId}/students`);
      return (res.data || []).map((s: any) => ({
        id: s.id,
        namaLengkap: s.biodata?.fullName || 'Siswa',
        nisn: s.biodata?.nisn || s.siswaFormal?.nisn || '',
      }));
    },
    enabled: isOpen && !!selectedKelasId,
  });

  // Daftar santri aktif yang siap dipilih
  const activeSiswaList: StudentOption[] = useMemo(() => {
    if (fetchedStudents.length > 0) return fetchedStudents;
    if (selectedKelasId === selectedKelas?.id && initialSiswaList.length > 0)
      return initialSiswaList;
    return [];
  }, [fetchedStudents, selectedKelasId, selectedKelas, initialSiswaList]);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Auto-select all santri saat daftar santri kelas dimuat/berubah
  useEffect(() => {
    if (activeSiswaList.length > 0) {
      setSelectedIds(new Set(activeSiswaList.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [activeSiswaList]);

  // State Konfigurasi Ujian & LJK A5
  const [examTitle, setExamTitle] = useState<string>(
    officialBankTitle || 'PENILAIAN AKHIR SEMESTER (PAS)',
  );
  const [kodeCabang, setKodeCabang] = useState<string>('1001');
  const [kodeMapel, setKodeMapel] = useState<string>('01');
  const [totalSoal, setTotalSoal] = useState<25 | 30 | 40 | 50>(25);
  const [spareBlankCount, setSpareBlankCount] = useState<number>(0);
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);

  // Auto-update kode cabang jika kelas memiliki cabang kode
  useEffect(() => {
    if (currentKelasObj?.cabang?.kode) {
      setKodeCabang(currentKelasObj.cabang.kode);
    }
  }, [currentKelasObj]);

  // Auto-update kode mapel jika mapel memiliki kodeMapel di database
  useEffect(() => {
    if (currentMapelObj?.kodeMapel) {
      const clean = currentMapelObj.kodeMapel.replace(/\D/g, '');
      if (clean) {
        setKodeMapel(clean.padStart(2, '0').slice(-2));
      }
    }
  }, [currentMapelObj]);

  // Filter siswa yang dipilih untuk dicetak
  const studentsToPrint = useMemo(() => {
    return activeSiswaList.filter((s) => selectedIds.has(s.id));
  }, [activeSiswaList, selectedIds]);

  const handleToggleSelectAll = () => {
    if (selectedIds.size === activeSiswaList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeSiswaList.map((s) => s.id)));
    }
  };

  const handleToggleStudent = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Daftar semua siswa & lembar kosong yang akan dicetak
  const allPrintStudents = [
    ...studentsToPrint,
    ...Array.from({ length: spareBlankCount }).map((_, i) => ({
      id: `blank-manual-${i + 1}`,
      namaLengkap: '',
      nisn: '',
      isBlank: true,
    })),
  ];

  // Susun lembar A5 secara berpasangan (kiri & kanan) dalam 1 kertas A4 Landscape
  const a4Pages: Array<{ left: any; right: any }> = [];
  for (let i = 0; i < allPrintStudents.length; i += 2) {
    a4Pages.push({
      left: allPrintStudents[i],
      right: allPrintStudents[i + 1] || {
        id: `blank-auto-${i + 1}`,
        namaLengkap: '',
        nisn: '',
        isBlank: true,
      },
    });
  }

  const currentA4Page = a4Pages[previewPageIndex] || a4Pages[0] || null;

  // Ekstraksi nomor kelas (7, 8, 9, 10, 11, 12)
  const kelasNum =
    (currentKelasObj?.tingkat || currentKelasObj?.name || '7').replace(
      /\D/g,
      '',
    ) || '7';
  const isGanjil = activeSemester.toLowerCase().includes('ganjil');

  return (
    <>
      {/* ── CSS PRINT KHUSUS A4 LANDSCAPE (2 LEMBAR A5 KIRI-KANAN) ── */}
      <style>{`
        @page {
          size: A4 landscape;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #ljk-print-area, #ljk-print-area * {
            visibility: visible !important;
          }
          #ljk-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .ljk-a4-landscape-page {
            width: 297mm !important;
            max-width: 297mm !important;
            min-width: 297mm !important;
            height: 210mm !important;
            max-height: 210mm !important;
            min-height: 210mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            background: #ffffff !important;
            display: flex !important;
            flex-direction: row !important;
          }
          .ljk-a4-landscape-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ── MODAL DIALOG PRATINJAU & KONTROL (LAYAR SAJA) ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-slate-950/80 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden">
          {/* Top Bar Header */}
          <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>LJK Builder: Format A5×2 Landscape</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                    Hemat Kertas 50%
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  2 Lembar LJK A5 tercetak berdampingan di kertas A4 Landscape &bull; Siap potong &amp; scan via CamScanner
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                disabled={allPrintStudents.length === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak {a4Pages.length} Halaman A4 ({allPrintStudents.length} Lembar LJK)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Konten: 2 Kolom (Sidebar Kontrol & Preview Kertas A4) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* KOLOM KIRI: SETTINGS, DROPDOWN KELAS/MAPEL, & DAFTAR SISWA (4 / 12) */}
            <div className="lg:col-span-4 p-4 border-r border-slate-200 overflow-y-auto space-y-4 bg-slate-50/60">
              {/* Box 1: Dropdown Pilihan Kelas & Mapel */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Target Kelas &amp; Mata Pelajaran
                </h4>

                {/* Dropdown Kelas / Rombel */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Pilihan Kelas / Rombel *</span>
                  </label>
                  <select
                    value={selectedKelasId}
                    onChange={(e) => setSelectedKelasId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Pilih Rombel Kelas --</option>
                    {masterKelasList.map((k: any) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k._count?.siswaFormal ?? 0} Santri)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropdown Mata Pelajaran */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Pilihan Mata Pelajaran *</span>
                  </label>
                  <select
                    value={selectedMapelId}
                    onChange={(e) => setSelectedMapelId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {masterMapelList.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.kodeMapel ? `(Kode: ${m.kodeMapel})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Box 2: Konfigurasi LJK A5 (Kode Cabang, Kode Mapel, & Jumlah Soal) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Format LJK A5 &amp; Kode OMR
                </h4>

                {/* Judul Ujian */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Judul Ujian / KOP LJK
                  </label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    placeholder="Contoh: PENILAIAN AKHIR SEMESTER (PAS)"
                  />
                </div>

                {/* Kode Cabang & Kode Mapel */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Kode Cabang (4 Digit)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={kodeCabang}
                      onChange={(e) => setKodeCabang(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                      placeholder="1001"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Kode Mapel (2 Digit)</span>
                      <span className="text-[9px] text-indigo-600 font-bold">Auto-OMR</span>
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={kodeMapel}
                      onChange={(e) => setKodeMapel(e.target.value.replace(/\D/g, '').padStart(2, '0').slice(-2))}
                      className="w-full px-3 py-1.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs font-mono font-black text-indigo-900 text-center"
                      placeholder="01"
                    />
                  </div>
                </div>

                {/* Jumlah Soal Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jumlah Butir Soal (Pilihan Ganda)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([25, 30, 40, 50] as const).map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTotalSoal(num)}
                        className={`py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                          totalSoal === num
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {num} Soal
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lembar Kosong Tambahan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Lembar Blank / Cadangan Tambahan
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={spareBlankCount}
                      onChange={(e) => setSpareBlankCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 text-center"
                    />
                    <span className="text-xs text-slate-500">
                      lembar tanpa nama (diisi manual)
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 3: Daftar Santri & Checkbox */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Pilih Siswa ({selectedIds.size} / {activeSiswaList.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {selectedIds.size === activeSiswaList.length
                      ? 'Batal Semua'
                      : 'Pilih Semua'}
                  </button>
                </div>

                {isLoadingStudents ? (
                  <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Memuat data santri...</span>
                  </div>
                ) : activeSiswaList.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Belum ada santri di kelas ini.
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-1 divide-y divide-slate-50 pr-1">
                    {activeSiswaList.map((s) => {
                      const isChecked = selectedIds.has(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleToggleStudent(s.id)}
                          className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-slate-50 cursor-pointer transition select-none"
                        >
                          <div className="text-indigo-600">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {s.namaLengkap}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              NISN: {s.nisn || '-'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* KOLOM KANAN: PRATINJAU KERTAS A4 LANDSCAPE (8 / 12) */}
            <div className="lg:col-span-8 p-4 bg-slate-100 flex flex-col items-center justify-between overflow-y-auto">
              {/* Toolbar Navigasi Halaman A4 */}
              <div className="w-full flex items-center justify-between pb-3 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    Pratinjau Kertas A4 Landscape:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-extrabold">
                    Halaman {previewPageIndex + 1} dari {a4Pages.length || 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewPageIndex((p) => Math.max(0, p - 1))}
                    disabled={previewPageIndex === 0}
                    className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPageIndex((p) => Math.min(a4Pages.length - 1, p + 1))}
                    disabled={previewPageIndex >= a4Pages.length - 1}
                    className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    title="Halaman Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              </div>

              {/* Tampilan Visual Kertas A4 Landscape (Skala Zoom Responsif) */}
              <div className="w-full flex-1 flex items-center justify-center p-2 overflow-auto">
                {currentA4Page ? (
                  <div
                    style={{
                      transform: 'scale(0.85)',
                      transformOrigin: 'top center',
                    }}
                    className="bg-white shadow-2xl rounded-sm border border-slate-300 flex flex-row shrink-0"
                  >
                    {/* Sisi Kiri: LJK Siswa 1 */}
                    <LjkA5Sheet
                      student={currentA4Page.left}
                      examTitle={examTitle}
                      kodeCabang={kodeCabang}
                      kodeMapel={kodeMapel}
                      mapelName={currentMapelObj?.name || 'Mata Pelajaran'}
                      kelasNum={kelasNum}
                      semesterName={activeSemester}
                      isGanjil={isGanjil}
                      tahunAjaran={activeTahunAjaran}
                      totalSoal={totalSoal}
                      isLeftHalf={true}
                    />

                    {/* Sisi Kanan: LJK Siswa 2 */}
                    <LjkA5Sheet
                      student={currentA4Page.right}
                      examTitle={examTitle}
                      kodeCabang={kodeCabang}
                      kodeMapel={kodeMapel}
                      mapelName={currentMapelObj?.name || 'Mata Pelajaran'}
                      kelasNum={kelasNum}
                      semesterName={activeSemester}
                      isGanjil={isGanjil}
                      tahunAjaran={activeTahunAjaran}
                      totalSoal={totalSoal}
                      isLeftHalf={false}
                    />
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 text-xs">
                    Pilih santri terlebih dahulu untuk menampilkan lembar LJK.
                  </div>
                )}
              </div>

              <div className="w-full text-center text-[11px] text-slate-500 pt-2 flex items-center justify-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-slate-400" />
                <span>Garis putus-putus di tengah adalah panduan pemotong kertas menjadi 2 lembar A5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── AREA CETAK FISIK (HANYA AKTIF SAAT WINDOW.PRINT()) ── */}
      <div id="ljk-print-area" className="hidden print:block">
        {a4Pages.map((pair, pIdx) => (
          <div key={pIdx} className="ljk-a4-landscape-page">
            {/* LJK A5 Sisi Kiri */}
            <LjkA5Sheet
              student={pair.left}
              examTitle={examTitle}
              kodeCabang={kodeCabang}
              kodeMapel={kodeMapel}
              mapelName={currentMapelObj?.name || 'Mata Pelajaran'}
              kelasNum={kelasNum}
              semesterName={activeSemester}
              isGanjil={isGanjil}
              tahunAjaran={activeTahunAjaran}
              totalSoal={totalSoal}
              isLeftHalf={true}
            />

            {/* LJK A5 Sisi Kanan */}
            <LjkA5Sheet
              student={pair.right}
              examTitle={examTitle}
              kodeCabang={kodeCabang}
              kodeMapel={kodeMapel}
              mapelName={currentMapelObj?.name || 'Mata Pelajaran'}
              kelasNum={kelasNum}
              semesterName={activeSemester}
              isGanjil={isGanjil}
              tahunAjaran={activeTahunAjaran}
              totalSoal={totalSoal}
              isLeftHalf={false}
            />
          </div>
        ))}
      </div>
    </>
  );
};

// ===================================================================================
// KOMPONEN LEMBAR LJK A5 SATUAN (PRESISI 148.5mm × 210mm KOORDINAT OMR ENGINE)
// ===================================================================================

interface LjkA5SheetProps {
  student: {
    id: string;
    namaLengkap: string;
    nisn: string;
    isBlank?: boolean;
  };
  examTitle: string;
  kodeCabang: string;
  kodeMapel: string;
  mapelName: string;
  kelasNum: string;
  semesterName: string;
  isGanjil: boolean;
  tahunAjaran: string;
  totalSoal: 25 | 30 | 40 | 50;
  isLeftHalf: boolean;
}

const LjkA5Sheet: React.FC<LjkA5SheetProps> = ({
  student,
  examTitle,
  kodeCabang,
  kodeMapel,
  mapelName,
  kelasNum,
  semesterName,
  isGanjil,
  tahunAjaran,
  totalSoal,
  isLeftHalf,
}) => {
  // Format 4 digit kode cabang
  const cabangDigits = kodeCabang.padEnd(4, '0').slice(0, 4).split('');

  // Format 2 digit kode mapel
  const mapelDigits = kodeMapel.padStart(2, '0').slice(-2).split('');

  // Format 10 digit NISN
  const nisnDigits = (student.nisn || '')
    .replace(/\D/g, '')
    .padEnd(10, ' ')
    .slice(0, 10)
    .split('');

  // Spacing dan baris per kolom jawaban berdasarkan totalSoal
  const config = useMemo(() => {
    switch (totalSoal) {
      case 30:
        return { leftRows: 15, rowSpacing: 3.5 };
      case 40:
        return { leftRows: 20, rowSpacing: 2.8 };
      case 50:
        return { leftRows: 25, rowSpacing: 2.3 };
      case 25:
      default:
        return { leftRows: 13, rowSpacing: 4.0 };
    }
  }, [totalSoal]);

  const { leftRows, rowSpacing } = config;

  return (
    <div
      style={{
        width: '148.5mm',
        maxWidth: '148.5mm',
        minWidth: '148.5mm',
        height: '210mm',
        maxHeight: '210mm',
        minHeight: '210mm',
        position: 'relative',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderRight: isLeftHalf ? '1px dashed #94a3b8' : 'none',
      }}
    >
      {/* ── CUTTING GUIDE MARKER DI TENGAH LEMBAR A4 ── */}
      {isLeftHalf && (
        <div
          style={{
            position: 'absolute',
            right: '-3mm',
            top: '100mm',
            zIndex: 20,
            backgroundColor: '#ffffff',
            fontSize: '8px',
            color: '#64748b',
          }}
          className="no-print flex flex-col items-center select-none"
        >
          <span>✂</span>
        </div>
      )}

      {/* ── 4 SUDUT TIMING MARKERS (5mm × 5mm SOLID BLACK SVG) ── */}
      {/* Top-Left: Center at (4.5mm, 4.5mm) */}
      <svg
        style={{ position: 'absolute', left: '2mm', top: '2mm', width: '5mm', height: '5mm' }}
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#000000" />
      </svg>
      {/* Top-Right: Center at (144mm, 4.5mm) */}
      <svg
        style={{ position: 'absolute', left: '141.5mm', top: '2mm', width: '5mm', height: '5mm' }}
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#000000" />
      </svg>
      {/* Bottom-Left: Center at (4.5mm, 205.5mm) */}
      <svg
        style={{ position: 'absolute', left: '2mm', top: '203mm', width: '5mm', height: '5mm' }}
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#000000" />
      </svg>
      {/* Bottom-Right: Center at (144mm, 205.5mm) */}
      <svg
        style={{ position: 'absolute', left: '141.5mm', top: '203mm', width: '5mm', height: '5mm' }}
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#000000" />
      </svg>

      {/* ── 1. KOP LEMBAR JAWABAN KOMPUTER (TOP: 3.5mm - 19mm) ── */}
      <div
        style={{
          position: 'absolute',
          top: '3.5mm',
          left: '10mm',
          width: '128.5mm',
          textAlign: 'center',
          borderBottom: '1.5px solid #000000',
          paddingBottom: '1mm',
        }}
      >
        <h2 style={{ fontSize: '10px', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          LEMBAR JAWABAN KOMPUTER (LJK)
        </h2>
        <h3 style={{ fontSize: '9px', fontWeight: '800', margin: '0.5mm 0 0 0', textTransform: 'uppercase', color: '#1e293b' }}>
          {examTitle}
        </h3>
        <p style={{ fontSize: '7.5px', fontWeight: 'bold', margin: '0.5mm 0 0 0', color: '#475569' }}>
          Tahun Ajaran: {tahunAjaran} &bull; Semester: {semesterName}
        </p>
      </div>

      {/* ── 2. KODE CABANG (4 DIGIT × 10 BARIS, u=12/148, colSpacing=5.5mm, v=30/210, rowSpacing=4.5mm) ── */}
      <div
        style={{
          position: 'absolute',
          top: '20mm',
          left: '9.5mm',
          width: '21mm',
          textAlign: 'center',
          fontSize: '7px',
          fontWeight: '900',
          letterSpacing: '0.2px',
        }}
      >
        KODE CABANG
      </div>
      {/* Kotak Angka Cabang (y = 23.5mm) */}
      {[0, 1, 2, 3].map((c) => {
        const cx = 12 + c * 5.5;
        return (
          <div
            key={`cab-box-${c}`}
            style={{
              position: 'absolute',
              left: `${cx - 2.25}mm`,
              top: '23.5mm',
              width: '4.5mm',
              height: '4.5mm',
              border: '1px solid #000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              fontWeight: '900',
              backgroundColor: '#f8fafc',
            }}
          >
            {cabangDigits[c]}
          </div>
        );
      })}
      {/* Bulatan OMR Cabang (cy = 30 + d * 4.5 mm) */}
      {[0, 1, 2, 3].map((c) => {
        const cx = 12 + c * 5.5;
        const targetDigit = cabangDigits[c];
        return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
          const cy = 30 + d * 4.5;
          const isFilled = !student.isBlank && targetDigit === d.toString();
          return (
            <div
              key={`cab-b-${c}-${d}`}
              style={{
                position: 'absolute',
                left: `${cx - 1.8}mm`,
                top: `${cy - 1.8}mm`,
              }}
            >
              <DigitBubbleSvg digit={d} isFilled={isFilled} sizeMm={3.6} />
            </div>
          );
        });
      })}

      {/* ── 3. KODE MAPEL (2 DIGIT × 10 BARIS, u=40/148, colSpacing=5.5mm, v=30/210, rowSpacing=4.5mm) ── */}
      <div
        style={{
          position: 'absolute',
          top: '20mm',
          left: '37.5mm',
          width: '10.5mm',
          textAlign: 'center',
          fontSize: '7px',
          fontWeight: '900',
          letterSpacing: '0.2px',
        }}
      >
        MAPEL
      </div>
      {/* Kotak Angka Mapel (y = 23.5mm) */}
      {[0, 1].map((c) => {
        const cx = 40 + c * 5.5;
        return (
          <div
            key={`mapel-box-${c}`}
            style={{
              position: 'absolute',
              left: `${cx - 2.25}mm`,
              top: '23.5mm',
              width: '4.5mm',
              height: '4.5mm',
              border: '1px solid #000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              fontWeight: '900',
              backgroundColor: '#eff6ff',
              color: '#1e3a8a',
            }}
          >
            {mapelDigits[c]}
          </div>
        );
      })}
      {/* Bulatan OMR Mapel */}
      {[0, 1].map((c) => {
        const cx = 40 + c * 5.5;
        const targetDigit = mapelDigits[c];
        return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
          const cy = 30 + d * 4.5;
          const isFilled = targetDigit === d.toString();
          return (
            <div
              key={`mapel-b-${c}-${d}`}
              style={{
                position: 'absolute',
                left: `${cx - 1.8}mm`,
                top: `${cy - 1.8}mm`,
              }}
            >
              <DigitBubbleSvg digit={d} isFilled={isFilled} sizeMm={3.6} />
            </div>
          );
        });
      })}

      {/* ── 4. KELAS / TINGKAT (7-12, y=32mm, x=[64, 70.5, 77, 83.5, 90, 96.5]mm) ── */}
      <div
        style={{
          position: 'absolute',
          top: '25mm',
          left: '60mm',
          fontSize: '7.5px',
          fontWeight: '900',
        }}
      >
        KELAS:
      </div>
      {['7', '8', '9', '10', '11', '12'].map((k, i) => {
        const cx = [64, 70.5, 77, 83.5, 90, 96.5][i];
        const isSelected = kelasNum === k;
        return (
          <div
            key={`kelas-${k}`}
            style={{
              position: 'absolute',
              left: `${cx - 1.8}mm`,
              top: `${32 - 1.8}mm`,
            }}
          >
            <KelasBubbleSvg label={k} isSelected={isSelected} sizeMm={3.6} />
          </div>
        );
      })}

      {/* ── 5. SEMESTER (Ganjil=110mm, Genap=126mm, y=42mm) ── */}
      <div
        style={{
          position: 'absolute',
          top: '36mm',
          left: '104mm',
          fontSize: '7.5px',
          fontWeight: '900',
        }}
      >
        SEMESTER:
      </div>
      <div
        style={{
          position: 'absolute',
          left: `${110 - 7}mm`,
          top: `${42 - 2.5}mm`,
        }}
      >
        <SemesterPillSvg label="Ganjil" isSelected={isGanjil} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: `${126 - 7}mm`,
          top: `${42 - 2.5}mm`,
        }}
      >
        <SemesterPillSvg label="Genap" isSelected={!isGanjil} />
      </div>

      {/* ── 6. KOTAK IDENTITAS SISWA (Nama & Mapel) ── */}
      <div
        style={{
          position: 'absolute',
          left: '54mm',
          top: '47mm',
          width: '86mm',
          height: '16mm',
          border: '1px solid #000000',
          padding: '1mm 1.5mm',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span style={{ fontSize: '6.5px', fontWeight: 'bold', color: '#475569', display: 'block' }}>
            NAMA LENGKAP SANTRI:
          </span>
          <div style={{ fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {student.namaLengkap || (student.isBlank ? '........................................................' : '-')}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', fontWeight: 'bold', borderTop: '0.5px solid #cbd5e1', paddingTop: '0.5mm' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60mm' }}>
            Mapel: {mapelName}
          </span>
          <span style={{ color: '#1e3a8a' }}>Kode: {kodeMapel}</span>
        </div>
      </div>

      {/* ── 7. KOTAK TANDA TANGAN ── */}
      <div
        style={{
          position: 'absolute',
          left: '54mm',
          top: '64.5mm',
          width: '86mm',
          height: '12.5mm',
          border: '1px solid #000000',
          padding: '1mm 1.5mm',
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2mm',
          textAlign: 'center',
        }}
      >
        <div style={{ borderRight: '0.5px dashed #94a3b8', paddingRight: '1mm' }}>
          <span style={{ fontSize: '6.5px', color: '#64748b', display: 'block' }}>Tanda Tangan Siswa:</span>
          <div style={{ height: '5.5mm', border: '0.5px dashed #cbd5e1', marginTop: '0.5mm', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', color: '#cbd5e1' }}>
            ( Paraf )
          </div>
        </div>
        <div>
          <span style={{ fontSize: '6.5px', color: '#64748b', display: 'block' }}>Tanda Tangan Pengawas:</span>
          <div style={{ height: '5.5mm', border: '0.5px dashed #cbd5e1', marginTop: '0.5mm', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', color: '#cbd5e1' }}>
            ( Paraf )
          </div>
        </div>
      </div>

      {/* ── 8. NISN 10 DIGIT (x=11+col*14mm, y=90+n*4.5mm) ── */}
      <div
        style={{
          position: 'absolute',
          top: '78.5mm',
          left: '8mm',
          width: '132.5mm',
          textAlign: 'center',
          fontSize: '7.5px',
          fontWeight: '900',
          letterSpacing: '0.3px',
        }}
      >
        NOMOR INDUK SISWA NASIONAL (NISN)
      </div>
      {/* Kotak Angka NISN (y = 82.5mm) */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => {
        const cx = 11 + col * 14;
        return (
          <div
            key={`nisn-box-${col}`}
            style={{
              position: 'absolute',
              left: `${cx - 3.25}mm`,
              top: '82.5mm',
              width: '6.5mm',
              height: '4.8mm',
              border: '1px solid #000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8.5px',
              fontWeight: '900',
              backgroundColor: '#f8fafc',
            }}
          >
            {nisnDigits[col]?.trim()}
          </div>
        );
      })}
      {/* Bulatan OMR NISN (cy = 90 + d * 4.5 mm) */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => {
        const cx = 11 + col * 14;
        const targetDigit = nisnDigits[col];
        return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
          const cy = 90 + d * 4.5;
          const isFilled = !student.isBlank && targetDigit === d.toString();
          return (
            <div
              key={`nisn-b-${col}-${d}`}
              style={{
                position: 'absolute',
                left: `${cx - 1.8}mm`,
                top: `${cy - 1.8}mm`,
              }}
            >
              <DigitBubbleSvg digit={d} isFilled={isFilled} sizeMm={3.6} />
            </div>
          );
        });
      })}

      {/* ── 9. PILIHAN GANDA (Variable: 25/30/40/50 Butir Soal) ── */}
      <div
        style={{
          position: 'absolute',
          top: '135mm',
          left: '8mm',
          width: '132.5mm',
          textAlign: 'center',
          fontSize: '7.5px',
          fontWeight: '900',
          letterSpacing: '0.2px',
        }}
      >
        LEMBAR JAWABAN PILIHAN GANDA ({totalSoal} BUTIR SOAL)
      </div>

      {/* Header Kolom Kiri & Kanan (A B C D) */}
      <div
        style={{
          position: 'absolute',
          top: '137.5mm',
          left: '14mm',
          fontSize: '7px',
          fontWeight: '900',
          color: '#475569',
        }}
      >
        No. &nbsp;&nbsp;&nbsp; A &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; B &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; C &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; D
      </div>
      <div
        style={{
          position: 'absolute',
          top: '137.5mm',
          left: '75mm',
          fontSize: '7px',
          fontWeight: '900',
          color: '#475569',
        }}
      >
        No. &nbsp;&nbsp;&nbsp; A &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; B &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; C &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; D
      </div>

      {/* Baris Pertanyaan & Bulatan Jawaban */}
      {Array.from({ length: totalSoal }).map((_, i) => {
        const q = i + 1;
        const isLeft = q <= leftRows;
        const rowIdx = isLeft ? q - 1 : q - leftRows - 1;
        const cy = 141 + rowIdx * rowSpacing;

        const qNumX = isLeft ? 17 : 78;
        const startA_X = isLeft ? 24 : 85;

        return (
          <React.Fragment key={`q-${q}`}>
            {/* Nomor Soal */}
            <div
              style={{
                position: 'absolute',
                left: `${qNumX - 4}mm`,
                top: `${cy - 2}mm`,
                width: '4mm',
                textAlign: 'right',
                fontSize: totalSoal > 30 ? '7px' : '8px',
                fontWeight: '900',
                fontFamily: 'monospace',
              }}
            >
              {q}.
            </div>

            {/* Bulatan A, B, C, D (spacing = 9mm, diameter = 4.5mm) */}
            {['A', 'B', 'C', 'D'].map((opt, optIdx) => {
              const cx = startA_X + optIdx * 9;
              return (
                <div
                  key={`q-${q}-${opt}`}
                  style={{
                    position: 'absolute',
                    left: `${cx - 2.25}mm`,
                    top: `${cy - 2.25}mm`,
                  }}
                >
                  <OptionBubbleSvg opt={opt} sizeMm={4.5} />
                </div>
              );
            })}
          </React.Fragment>
        );
      })}

      {/* ── 10. PETUNJUK TEKNIS FOOTER (y = 197mm - 203.5mm) ── */}
      <div
        style={{
          position: 'absolute',
          left: '8mm',
          top: '197mm',
          width: '132.5mm',
          height: '6.5mm',
          border: '0.8px solid #000000',
          padding: '0.5mm 1mm',
          boxSizing: 'border-box',
          fontSize: '6.5px',
          lineHeight: '1.2',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          color: '#334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span>
          <strong>Petunjuk:</strong> 1. Gunakan pensil 2B / pulpen hitam. &bull; 2. Hitamkan bulatan secara penuh [●]. &bull; 3. Lembar tidak boleh kotor, terlipat, atau basah.
        </span>
      </div>
    </div>
  );
};

// ===================================================================================
// SUB-KOMPONEN VECTOR SVG PRESISI TINGGI
// ===================================================================================

const DigitBubbleSvg: React.FC<{
  digit: number | string;
  isFilled: boolean;
  sizeMm?: number;
}> = ({ digit, isFilled, sizeMm = 3.6 }) => {
  if (isFilled) {
    return (
      <svg
        style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm` }}
        viewBox="0 0 16 16"
        className="shrink-0"
      >
        <circle cx="8" cy="8" r="7.5" fill="#000000" stroke="#000000" strokeWidth="1" />
        <text
          x="8"
          y="11.5"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="9"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          {digit}
        </text>
      </svg>
    );
  }
  return (
    <svg
      style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm` }}
      viewBox="0 0 16 16"
      className="shrink-0"
    >
      <circle cx="8" cy="8" r="7" fill="#ffffff" stroke="#000000" strokeWidth="1.2" />
      <text
        x="8"
        y="11.5"
        textAnchor="middle"
        fill="#000000"
        fontSize="9"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {digit}
      </text>
    </svg>
  );
};

const OptionBubbleSvg: React.FC<{
  opt: string;
  isFilled?: boolean;
  sizeMm?: number;
}> = ({ opt, isFilled = false, sizeMm = 4.5 }) => {
  return (
    <svg
      style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm` }}
      viewBox="0 0 18 18"
      className="shrink-0"
    >
      <circle
        cx="9"
        cy="9"
        r="8"
        fill={isFilled ? '#000000' : '#ffffff'}
        stroke="#000000"
        strokeWidth="1.2"
      />
      <text
        x="9"
        y="12.5"
        textAnchor="middle"
        fill={isFilled ? '#ffffff' : '#000000'}
        fontSize="10"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {opt}
      </text>
    </svg>
  );
};

const KelasBubbleSvg: React.FC<{
  label: string;
  isSelected: boolean;
  sizeMm?: number;
}> = ({ label, isSelected, sizeMm = 3.6 }) => {
  if (isSelected) {
    return (
      <svg
        style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm` }}
        viewBox="0 0 16 16"
        className="shrink-0"
      >
        <circle cx="8" cy="8" r="7.5" fill="#000000" stroke="#000000" strokeWidth="1" />
        <text
          x="8"
          y="11.5"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="8.5"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          {label}
        </text>
      </svg>
    );
  }
  return (
    <svg
      style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm` }}
      viewBox="0 0 16 16"
      className="shrink-0"
    >
      <circle cx="8" cy="8" r="7" fill="#ffffff" stroke="#000000" strokeWidth="1" />
      <text
        x="8"
        y="11.5"
        textAnchor="middle"
        fill="#000000"
        fontSize="8.5"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
};

const SemesterPillSvg: React.FC<{
  label: string;
  isSelected: boolean;
}> = ({ label, isSelected }) => {
  if (isSelected) {
    return (
      <svg width="14mm" height="5mm" viewBox="0 0 46 16" className="shrink-0">
        <rect
          x="1"
          y="1"
          width="44"
          height="14"
          rx="7"
          fill="#000000"
          stroke="#000000"
          strokeWidth="1.2"
        />
        <text
          x="23"
          y="11"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="9"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          {label}
        </text>
      </svg>
    );
  }
  return (
    <svg width="14mm" height="5mm" viewBox="0 0 46 16" className="shrink-0">
      <rect
        x="1"
        y="1"
        width="44"
        height="14"
        rx="7"
        fill="#ffffff"
        stroke="#000000"
        strokeWidth="1.2"
      />
      <text
        x="23"
        y="11"
        textAnchor="middle"
        fill="#000000"
        fontSize="9"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
};
