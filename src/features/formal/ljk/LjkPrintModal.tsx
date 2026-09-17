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
  // 1. Fetch Pengaturan Akademik Aktif (agar Sem & TA otomatis mengikuti kalender aktif)
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

  // State Konfigurasi Ujian
  const [examTitle, setExamTitle] = useState<string>(
    officialBankTitle || 'PENILAIAN AKHIR SEMESTER (PAS)',
  );
  const [kodeCabang, setKodeCabang] = useState<string>('1001');
  const [spareBlankCount, setSpareBlankCount] = useState<number>(1);
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  // Auto-update kode cabang jika kelas memiliki cabang kode
  useEffect(() => {
    if (currentKelasObj?.cabang?.kode) {
      setKodeCabang(currentKelasObj.cabang.kode);
    }
  }, [currentKelasObj]);

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

  // Siapkan data untuk halaman cetak
  const allPrintPages = [
    ...studentsToPrint,
    ...Array.from({ length: spareBlankCount }).map((_, i) => ({
      id: `blank-${i + 1}`,
      namaLengkap: '',
      nisn: '',
      isBlank: true,
    })),
  ];

  const currentPreviewStudent =
    allPrintPages[previewIndex] || allPrintPages[0] || null;

  // Ekstraksi nomor kelas (7, 8, 9, 10, 11, 12)
  const kelasNum =
    (currentKelasObj?.tingkat || currentKelasObj?.name || '7').replace(
      /\D/g,
      '',
    ) || '7';
  const isGanjil = activeSemester.toLowerCase().includes('ganjil');

  return (
    <>
      {/* ── CSS PRINT KHUSUS PRESISI A4 & COLOR ADJUSTMENT ── */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 6mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
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
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .ljk-single-page {
            width: 198mm !important;
            max-width: 198mm !important;
            height: 284mm !important;
            max-height: 284mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            background: #ffffff !important;
            border: 2px solid #000000 !important;
          }
          .ljk-single-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ── MODAL DIALOG PRATINJAU & KONTROL (LAYAR SAJA) ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-5 bg-slate-950/75 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden">
          {/* Top Bar Header */}
          <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>LJK Builder: Lembar Jawaban Pre-Filled Siswa</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                    Mode 2: Per Rombel
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Data santri, NISN, kode cabang & bulatan arsir otomatis tercetak di kertas A4 standar OMR
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                disabled={allPrintPages.length === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak {allPrintPages.length} Lembar LJK (Ctrl + P)</span>
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
            <div className="lg:col-span-4 p-5 border-r border-slate-200 overflow-y-auto space-y-4 bg-slate-50/60">
              {/* Box 1: Dropdown Pilihan Kelas & Mapel */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Target Kelas & Mata Pelajaran
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
                        {m.name} {m.kodeMapel ? `(${m.kodeMapel})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Periode Akademik Aktif */}
                <div className="p-3 bg-indigo-50/80 border border-indigo-200/80 rounded-xl text-[11px] text-indigo-950 flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Periode Akademik Aktif:</span>
                  </span>
                  <span className="font-black px-2 py-0.5 bg-white rounded-lg border border-indigo-200 text-indigo-900 shadow-xs">
                    T.A. {activeTahunAjaran} • Sem. {activeSemester}
                  </span>
                </div>
              </div>

              {/* Box 2: Detail Kop Ujian & Lembar Cadangan */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Pengaturan Tambahan Lembar LJK
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600">Judul Ujian</label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600">Kode Cabang (4 Digit)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={kodeCabang}
                      onChange={(e) => setKodeCabang(e.target.value)}
                      className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600">Lembar Cadangan Kosong</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={spareBlankCount}
                      onChange={(e) =>
                        setSpareBlankCount(
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                      className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Box 3: Daftar Santri di Kelas Terpilih */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>
                      Daftar Santri ({selectedIds.size} / {activeSiswaList.length})
                    </span>
                  </h4>

                  {activeSiswaList.length > 0 && (
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {selectedIds.size === activeSiswaList.length ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Batal Semua</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          <span>Pilih Semua</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* List Siswa Checkbox */}
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
                  {isLoadingStudents ? (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Memuat data santri rombel...</span>
                    </div>
                  ) : activeSiswaList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Tidak ada data santri pada kelas ini.
                    </div>
                  ) : (
                    activeSiswaList.map((s, idx) => {
                      const isChecked = selectedIds.has(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2.5 p-2 px-3 text-xs cursor-pointer hover:bg-slate-50 transition ${
                            isChecked ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleStudent(s.id)}
                            className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          />
                          <span className="text-[11px] text-slate-400 font-mono w-5">
                            {idx + 1}.
                          </span>
                          <div className="truncate flex-1">
                            <p className="font-bold text-slate-800 truncate">
                              {s.namaLengkap}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              NISN: {s.nisn || '-'}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: PRATINJAU HALAMAN LJK A4 PRESISI (8 / 12) */}
            <div className="lg:col-span-8 p-4 md:p-6 bg-slate-200/80 overflow-y-auto flex flex-col items-center justify-start space-y-4">
              {/* Preview Pagination Toolbar */}
              <div className="w-full max-w-xl bg-white p-2.5 px-4 rounded-2xl border border-slate-300 shadow-xs flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>
                    Pratinjau Lembar {allPrintPages.length > 0 ? previewIndex + 1 : 0} dari{' '}
                    {allPrintPages.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={previewIndex <= 0}
                    onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-600 px-2">
                    {previewIndex + 1}
                  </span>
                  <button
                    type="button"
                    disabled={previewIndex >= allPrintPages.length - 1}
                    onClick={() =>
                      setPreviewIndex((i) =>
                        Math.min(allPrintPages.length - 1, i + 1),
                      )
                    }
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Render Lembar LJK (Ukuran A4 Presisi) */}
              {currentPreviewStudent ? (
                <div className="scale-[0.82] sm:scale-[0.88] md:scale-[0.92] lg:scale-[0.95] origin-top shadow-2xl transition-all">
                  <LjkSingleSheetView
                    student={currentPreviewStudent}
                    examTitle={examTitle}
                    kodeCabang={kodeCabang}
                    mapelName={currentMapelObj?.name || 'Pendidikan Agama Islam'}
                    kelasNum={kelasNum}
                    semesterName={activeSemester}
                    isGanjil={isGanjil}
                    tahunAjaran={activeTahunAjaran}
                  />
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-300">
                  Pilih minimal 1 santri untuk melihat pratinjau lembar LJK.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── AREA CETAK TERSEMBUNYI (HANYA AKTIF SAAT WINDOW.PRINT) ── */}
      <div id="ljk-print-area" className="hidden print:block">
        {allPrintPages.map((st) => (
          <div key={st.id} className="ljk-single-page">
            <LjkSingleSheetView
              student={st}
              examTitle={examTitle}
              kodeCabang={kodeCabang}
              mapelName={currentMapelObj?.name || 'Pendidikan Agama Islam'}
              kelasNum={kelasNum}
              semesterName={activeSemester}
              isGanjil={isGanjil}
              tahunAjaran={activeTahunAjaran}
            />
          </div>
        ))}
      </div>
    </>
  );
};

// ===================================================================================
// KOMPONEN LEMBAR LJK SATUAN (PRESISI A4 STANDAR OMR VECTOR SVG 25 BUTIR)
// ===================================================================================

interface LjkSingleSheetViewProps {
  student: {
    id: string;
    namaLengkap: string;
    nisn: string;
    isBlank?: boolean;
  };
  examTitle: string;
  kodeCabang: string;
  mapelName: string;
  kelasNum: string;
  semesterName: string;
  isGanjil: boolean;
  tahunAjaran: string;
}

const LjkSingleSheetView: React.FC<LjkSingleSheetViewProps> = ({
  student,
  examTitle,
  kodeCabang,
  mapelName,
  kelasNum,
  semesterName,
  isGanjil,
  tahunAjaran,
}) => {
  // Format 4 digit kode cabang
  const cabangDigits = kodeCabang.padEnd(4, '0').slice(0, 4).split('');

  // Format 10 digit NISN
  const nisnDigits = (student.nisn || '')
    .replace(/\D/g, '')
    .padEnd(10, ' ')
    .slice(0, 10)
    .split('');

  return (
    <div
      style={{
        width: '198mm',
        height: '282mm',
        maxHeight: '282mm',
        padding: '3.5mm 4mm',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="border-2 border-black flex flex-col justify-between"
    >
      {/* ── 4 CORNER TIMING MARKERS (VECTOR SVG: SELALU HITAM MESKI BACKGROUND GRAPHICS MATI) ── */}
      <svg
        style={{ position: 'absolute', top: '2mm', left: '2mm', width: '7mm', height: '7mm' }}
        viewBox="0 0 24 24"
      >
        <rect width="24" height="24" fill="#000000" />
      </svg>
      <svg
        style={{ position: 'absolute', top: '2mm', right: '2mm', width: '7mm', height: '7mm' }}
        viewBox="0 0 24 24"
      >
        <rect width="24" height="24" fill="#000000" />
      </svg>
      <svg
        style={{ position: 'absolute', bottom: '2mm', left: '2mm', width: '7mm', height: '7mm' }}
        viewBox="0 0 24 24"
      >
        <rect width="24" height="24" fill="#000000" />
      </svg>
      <svg
        style={{ position: 'absolute', bottom: '2mm', right: '2mm', width: '7mm', height: '7mm' }}
        viewBox="0 0 24 24"
      >
        <rect width="24" height="24" fill="#000000" />
      </svg>

      {/* ── 1. KOP LEMBAR JAWABAN KOMPUTER ── */}
      <div className="border-b-2 border-black pb-1 mb-1 text-center">
        <h2 className="text-xs font-black tracking-wider uppercase m-0 leading-tight">
          LEMBAR JAWABAN KOMPUTER (LJK)
        </h2>
        <h3 className="text-[11px] font-black uppercase m-0 leading-tight text-slate-800">
          {examTitle}
        </h3>
        <p className="text-[9px] font-bold text-slate-700 m-0 pt-0.5">
          Tahun Ajaran: {tahunAjaran} &bull; Semester: {semesterName}
        </p>
      </div>

      {/* ── 2. BARIS IDENTITAS SISWA & KODE CABANG ── */}
      <div className="grid grid-cols-12 gap-2 text-[9.5px] mb-1">
        {/* Kiri: Kotak Nama Siswa, Mapel, & Tanda Tangan (7 Kolom) */}
        <div className="col-span-7 border border-black p-1.5 flex flex-col justify-between space-y-1">
          <div>
            <span className="font-bold text-[8.5px] uppercase tracking-wider block text-slate-600">
              NAMA LENGKAP SANTRI / SISWA:
            </span>
            <div className="font-black text-xs uppercase tracking-wide border-b border-black pb-0.5 min-h-[18px]">
              {student.namaLengkap ||
                (student.isBlank
                  ? '............................................................'
                  : '-')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-bold text-[8.5px] uppercase block text-slate-600">
                MATA PELAJARAN:
              </span>
              <div className="font-extrabold text-[10.5px] truncate leading-tight">
                {mapelName}
              </div>
            </div>

            <div>
              <span className="font-bold text-[8.5px] uppercase block text-slate-600">
                TINGKAT / KELAS:
              </span>
              <div className="font-extrabold text-[10.5px] leading-tight">
                Kelas {kelasNum}
              </div>
            </div>
          </div>

          {/* Kotak Tanda Tangan */}
          <div className="grid grid-cols-2 gap-2 pt-0.5 border-t border-slate-300 text-[8.5px]">
            <div className="text-center">
              <span className="block text-slate-500">Tanda Tangan Siswa:</span>
              <div className="h-6 border border-dashed border-slate-400 mt-0.5 rounded flex items-center justify-center text-slate-300 text-[8px]">
                ( Paraf )
              </div>
            </div>
            <div className="text-center">
              <span className="block text-slate-500">Tanda Tangan Pengawas:</span>
              <div className="h-6 border border-dashed border-slate-400 mt-0.5 rounded flex items-center justify-center text-slate-300 text-[8px]">
                ( Paraf )
              </div>
            </div>
          </div>
        </div>

        {/* Kanan: Grid Matriks Kode Cabang 4 Digit (5 Kolom) */}
        <div className="col-span-5 border border-black p-1.5 flex flex-col items-center justify-between">
          <span className="font-black text-[8.5px] uppercase tracking-wider block mb-0.5">
            KODE CABANG
          </span>

          {/* Kotak Digit Cabang */}
          <div className="flex gap-1.5 mb-1">
            {cabangDigits.map((d, i) => (
              <div
                key={i}
                className="w-4 h-5 border border-black font-black text-xs flex items-center justify-center bg-slate-50"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Matriks Bulatan 0-9 untuk 4 Digit Cabang (Vector SVG) */}
          <div className="grid grid-cols-4 gap-1.5">
            {cabangDigits.map((targetDigit, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-0.5 items-center">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                  const isFilled =
                    !student.isBlank && targetDigit === digit.toString();
                  return (
                    <DigitBubbleSvg
                      key={digit}
                      digit={digit}
                      isFilled={isFilled}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. BARIS GRID NISN 10 DIGIT & SELEKSI TINGKAT / SEMESTER ── */}
      <div className="border border-black p-1.5 mb-1">
        <div className="flex items-center justify-between border-b border-black pb-0.5 mb-1">
          <span className="font-black text-[8.5px] uppercase tracking-wider">
            NOMOR INDUK SISWA NASIONAL (NISN)
          </span>

          {/* Opsi Kelas & Semester Terarsir Vector */}
          <div className="flex items-center gap-3 text-[8.5px]">
            <div className="flex items-center gap-1">
              <span className="font-bold">Kelas:</span>
              {['7', '8', '9', '10', '11', '12'].map((k) => {
                const isSelected = kelasNum === k;
                return (
                  <KelasBubbleSvg
                    key={k}
                    label={k}
                    isSelected={isSelected}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold">Sem:</span>
              <SemesterPillSvg label="Ganjil" isSelected={isGanjil} />
              <SemesterPillSvg label="Genap" isSelected={!isGanjil} />
            </div>
          </div>
        </div>

        {/* Kotak 10 Digit NISN */}
        <div className="flex justify-center gap-1.5 mb-1">
          {nisnDigits.map((d, i) => (
            <div
              key={i}
              className="w-4 h-5 border border-black font-black text-xs flex items-center justify-center bg-slate-50"
            >
              {d.trim()}
            </div>
          ))}
        </div>

        {/* Matriks Bulatan 10 Kolom x 10 Baris (0-9) Vector */}
        <div className="flex justify-center gap-1.5">
          {nisnDigits.map((targetDigit, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-0.5 items-center">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                const isFilled =
                  !student.isBlank && targetDigit === digit.toString();
                return (
                  <DigitBubbleSvg
                    key={digit}
                    digit={digit}
                    isFilled={isFilled}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. MATRIKS JAWABAN PILIHAN GANDA (25 BUTIR SOAL - 2 KOLOM) ── */}
      <div className="border border-black p-2 mb-1 flex-1 flex flex-col justify-between">
        <div className="text-center font-black text-[9px] uppercase tracking-wider border-b border-black pb-0.5 mb-1">
          LEMBAR JAWABAN PILIHAN GANDA (HITAMKAN BULATAN A, B, C, ATAU D)
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Kolom Kiri: Soal Nomor 1 s.d 13 */}
          <div className="space-y-0.5">
            {Array.from({ length: 13 }).map((_, i) => {
              const qNum = i + 1;
              return (
                <div
                  key={qNum}
                  className="flex items-center justify-between px-1.5 py-0.5 border-b border-slate-200"
                >
                  <span className="font-black text-xs w-6 text-right font-mono">
                    {qNum}.
                  </span>
                  <div className="flex items-center gap-2.5">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <OptionBubbleSvg key={opt} opt={opt} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kolom Kanan: Soal Nomor 14 s.d 25 */}
          <div className="space-y-0.5">
            {Array.from({ length: 12 }).map((_, i) => {
              const qNum = i + 14;
              return (
                <div
                  key={qNum}
                  className="flex items-center justify-between px-1.5 py-0.5 border-b border-slate-200"
                >
                  <span className="font-black text-xs w-6 text-right font-mono">
                    {qNum}.
                  </span>
                  <div className="flex items-center gap-2.5">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <OptionBubbleSvg key={opt} opt={opt} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 5. PETUNJUK TEKNIS PENGISIAN LJK (FOOTER) ── */}
      <div className="border border-black p-1.5 text-[8px] leading-tight text-slate-800 bg-slate-50">
        <span className="font-bold uppercase tracking-wider block mb-0.5">
          PETUNJUK PENGISIAN LEMBAR JAWABAN:
        </span>
        <div className="grid grid-cols-3 gap-2">
          <div>1. Gunakan pensil 2B atau pulpen hitam pekat.</div>
          <div>
            2. Hitamkan bulatan:
            <span className="inline-flex items-center gap-1 font-bold ml-1">
              [ <span className="inline-block w-2 h-2 bg-black rounded-full" /> Benar ]
              [ ✗ Salah ] [ ✓ Salah ]
            </span>
          </div>
          <div>3. Lembar jawaban tidak boleh kotor, terlipat, atau robek.</div>
        </div>
      </div>
    </div>
  );
};

// ===================================================================================
// SUB-KOMPONEN VECTOR SVG AGAR SELALU TERCETAK HITAM MESKI BACKGROUND GRAPHICS OFF
// ===================================================================================

const DigitBubbleSvg: React.FC<{ digit: number; isFilled: boolean }> = ({
  digit,
  isFilled,
}) => {
  if (isFilled) {
    return (
      <svg width="13" height="13" viewBox="0 0 16 16" className="shrink-0">
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
    <svg width="13" height="13" viewBox="0 0 16 16" className="shrink-0">
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

const KelasBubbleSvg: React.FC<{ label: string; isSelected: boolean }> = ({
  label,
  isSelected,
}) => {
  if (isSelected) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" className="shrink-0">
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
    <svg width="14" height="14" viewBox="0 0 16 16" className="shrink-0">
      <circle cx="8" cy="8" r="7" fill="#ffffff" stroke="#000000" strokeWidth="1.2" />
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

const SemesterPillSvg: React.FC<{ label: string; isSelected: boolean }> = ({
  label,
  isSelected,
}) => {
  const width = label === 'Ganjil' ? 30 : 28;
  if (isSelected) {
    return (
      <svg width={width} height="13" viewBox={`0 0 ${width} 14`} className="shrink-0">
        <rect width={width} height="14" rx="3" fill="#000000" stroke="#000000" strokeWidth="1" />
        <text
          x={width / 2}
          y="10.5"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="8"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          {label}
        </text>
      </svg>
    );
  }
  return (
    <svg width={width} height="13" viewBox={`0 0 ${width} 14`} className="shrink-0">
      <rect width={width} height="14" rx="3" fill="#ffffff" stroke="#000000" strokeWidth="1.2" />
      <text
        x={width / 2}
        y="10.5"
        textAnchor="middle"
        fill="#000000"
        fontSize="8"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
};

const OptionBubbleSvg: React.FC<{ opt: string }> = ({ opt }) => (
  <svg width="17" height="17" viewBox="0 0 20 20" className="shrink-0">
    <circle cx="10" cy="10" r="8.5" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
    <text
      x="10"
      y="14"
      textAnchor="middle"
      fill="#000000"
      fontSize="11"
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      {opt}
    </text>
  </svg>
);
