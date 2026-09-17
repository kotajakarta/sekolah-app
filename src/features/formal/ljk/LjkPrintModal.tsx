import React, { useState, useMemo } from 'react';
import {
  Printer,
  X,
  CheckSquare,
  Square,
  Users,
  Eye,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Award,
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
  tahunAjaran = '2024/2025',
  semester = 'Ganjil',
  siswaList = [],
  officialBankTitle,
}) => {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(siswaList.map((s) => s.id));
  });

  const [examTitle, setExamTitle] = useState<string>(
    officialBankTitle || 'PENILAIAN AKHIR SEMESTER (PAS)',
  );
  const [kodeCabang, setKodeCabang] = useState<string>('1001');
  const [spareBlankCount, setSpareBlankCount] = useState<number>(1);
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  // Filter siswa yang dipilih untuk dicetak
  const studentsToPrint = useMemo(() => {
    return siswaList.filter((s) => selectedIds.has(s.id));
  }, [siswaList, selectedIds]);

  // Handle select all / deselect all
  const handleToggleSelectAll = () => {
    if (selectedIds.size === siswaList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(siswaList.map((s) => s.id)));
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

  const currentPreviewStudent = allPrintPages[previewIndex] || allPrintPages[0] || null;

  // Ekstraksi nomor kelas (7, 8, 9, 10, 11, 12)
  const kelasNum = (selectedKelas?.tingkat || selectedKelas?.name || '7').replace(/\D/g, '') || '7';
  const isGanjil = semester.toLowerCase().includes('ganjil');

  return (
    <>
      {/* CSS @media print terisolasi murni A4 */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        @media print {
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
            background: white !important;
          }
          .ljk-single-page {
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
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

      {/* Modal Dialog (Screen Only) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
          {/* Top Bar Header */}
          <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>LJK Builder: Lembar Jawaban Pre-Filled Siswa</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                    Mode 2: Per Kelas
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Data santri, NISN, kode cabang & bulatan arsir otomatis tercetak di kertas A4 standar OMR
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={allPrintPages.length === 0}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak {allPrintPages.length} Lembar LJK (Ctrl+P)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Konten: 2 Kolom (Sidebar Kontrol & Preview Kertas A4) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* KOLOM KIRI: SETTINGS & DAFTAR SISWA (4 / 12) */}
            <div className="lg:col-span-4 p-5 border-r border-slate-200 overflow-y-auto space-y-5 bg-slate-50/50">
              {/* Box Info Ujian */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Konfigurasi Kop Lembar LJK
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
                      onChange={(e) => setSpareBlankCount(Math.max(0, Number(e.target.value) || 0))}
                      className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                  <p>Mata Pelajaran: <strong>{selectedMapel?.name || '-'}</strong></p>
                  <p>Kelas: <strong>{selectedKelas?.name || '-'}</strong> • Semester: <strong>{semester}</strong></p>
                  <p>Tahun Ajaran: <strong>{tahunAjaran}</strong></p>
                </div>
              </div>

              {/* Box Daftar Siswa Rombel */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Daftar Santri ({selectedIds.size} / {siswaList.length})
                  </h4>

                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {selectedIds.size === siswaList.length ? (
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
                </div>

                {/* List Siswa Checkbox */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
                  {siswaList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Tidak ada data santri pada kelas ini.
                    </div>
                  ) : (
                    siswaList.map((s, idx) => {
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
                            <p className="font-bold text-slate-800 truncate">{s.namaLengkap}</p>
                            <p className="text-[10px] text-slate-400 font-mono">NISN: {s.nisn || '-'}</p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: PRATINJAU HALAMAN LJK A4 (8 / 12) */}
            <div className="lg:col-span-8 p-6 bg-slate-200/70 overflow-y-auto flex flex-col items-center justify-start space-y-4">
              {/* Preview Pagination Toolbar */}
              <div className="w-full max-w-xl bg-white p-2.5 px-4 rounded-2xl border border-slate-300 shadow-xs flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>
                    Pratinjau Halaman {allPrintPages.length > 0 ? previewIndex + 1 : 0} dari {allPrintPages.length}
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
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {previewIndex + 1}
                  </span>
                  <button
                    type="button"
                    disabled={previewIndex >= allPrintPages.length - 1}
                    onClick={() => setPreviewIndex((i) => Math.min(allPrintPages.length - 1, i + 1))}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Render Lembar LJK (Ukuran A4 Presisi) */}
              {currentPreviewStudent ? (
                <div className="scale-[0.85] sm:scale-[0.95] md:scale-100 origin-top shadow-2xl transition-all">
                  <LjkSingleSheetView
                    student={currentPreviewStudent}
                    examTitle={examTitle}
                    kodeCabang={kodeCabang}
                    mapelName={selectedMapel?.name || 'Pendidikan Agama Islam'}
                    kelasNum={kelasNum}
                    semesterName={semester}
                    isGanjil={isGanjil}
                    tahunAjaran={tahunAjaran}
                  />
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Pilih minimal 1 santri untuk melihat pratinjau lembar LJK.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── AREA PRINT TERSEMBUNYI (HANYA MUNCUL SAAT WINDOW.PRINT) ── */}
      <div id="ljk-print-area" className="hidden print:block">
        {allPrintPages.map((st) => (
          <div key={st.id} className="ljk-single-page">
            <LjkSingleSheetView
              student={st}
              examTitle={examTitle}
              kodeCabang={kodeCabang}
              mapelName={selectedMapel?.name || 'Pendidikan Agama Islam'}
              kelasNum={kelasNum}
              semesterName={semester}
              isGanjil={isGanjil}
              tahunAjaran={tahunAjaran}
            />
          </div>
        ))}
      </div>
    </>
  );
};

// ===================================================================================
// KOMPONEN LEMBAR LJK SATUAN (PRESISI A4 STANDAR OMR 25 BUTIR)
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
  const cabangDigits = (kodeCabang.padEnd(4, '0').slice(0, 4)).split('');

  // Format 10 digit NISN
  const nisnDigits = (student.nisn || '').replace(/\D/g, '').padEnd(10, ' ').slice(0, 10).split('');

  return (
    <div
      style={{
        width: '210mm',
        minHeight: '295mm',
        padding: '8mm',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        boxSizing: 'border-box',
        position: 'relative',
      }}
      className="border-2 border-black flex flex-col justify-between"
    >
      {/* ── 4 CORNER TIMING MARKERS (FIDUCIAL MARKS 10mm x 10mm) ── */}
      <div
        style={{
          position: 'absolute',
          top: '3mm',
          left: '3mm',
          width: '8mm',
          height: '8mm',
          backgroundColor: '#000000',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '3mm',
          right: '3mm',
          width: '8mm',
          height: '8mm',
          backgroundColor: '#000000',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '3mm',
          left: '3mm',
          width: '8mm',
          height: '8mm',
          backgroundColor: '#000000',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '3mm',
          right: '3mm',
          width: '8mm',
          height: '8mm',
          backgroundColor: '#000000',
        }}
      />

      {/* ── KOP LEMBAR JAWABAN KOMPUTER ── */}
      <div className="border-b-2 border-black pb-2 mb-2 text-center">
        <h2 className="text-sm font-black tracking-wider uppercase m-0 leading-tight">
          LEMBAR JAWABAN KOMPUTER (LJK)
        </h2>
        <h3 className="text-xs font-extrabold uppercase m-0 leading-tight text-slate-800">
          {examTitle}
        </h3>
        <p className="text-[10px] font-semibold text-slate-700 m-0 pt-0.5">
          Tahun Ajaran: {tahunAjaran} &bull; Semester: {semesterName}
        </p>
      </div>

      {/* ── BARIS IDENTITAS SISWA & KODE CABANG ── */}
      <div className="grid grid-cols-12 gap-2 text-[10px] mb-2">
        {/* Kiri: Kotak Nama Siswa & Mapel (7 Kolom) */}
        <div className="col-span-7 border-2 border-black p-2 flex flex-col justify-between space-y-1.5">
          <div>
            <span className="font-bold text-[9px] uppercase tracking-wider block text-slate-600">
              NAMA LENGKAP SANTRI / SISWA:
            </span>
            <div className="font-black text-xs uppercase tracking-wide border-b border-black pb-0.5 min-h-[20px]">
              {student.namaLengkap || (student.isBlank ? '............................................................' : '-')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="font-bold text-[9px] uppercase block text-slate-600">
                MATA PELAJARAN:
              </span>
              <div className="font-extrabold text-[11px] truncate">{mapelName}</div>
            </div>

            <div>
              <span className="font-bold text-[9px] uppercase block text-slate-600">
                TINGKAT / KELAS:
              </span>
              <div className="font-extrabold text-[11px]">Kelas {kelasNum}</div>
            </div>
          </div>

          {/* Kotak Tanda Tangan */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-300 text-[9px]">
            <div className="text-center">
              <span className="block text-slate-500">Tanda Tangan Santri:</span>
              <div className="h-9 border border-dashed border-slate-400 mt-0.5 rounded flex items-center justify-center text-slate-300">
                ( Paraf )
              </div>
            </div>
            <div className="text-center">
              <span className="block text-slate-500">Tanda Tangan Pengawas:</span>
              <div className="h-9 border border-dashed border-slate-400 mt-0.5 rounded flex items-center justify-center text-slate-300">
                ( Paraf )
              </div>
            </div>
          </div>
        </div>

        {/* Kanan: Grid Matriks Kode Cabang (5 Kolom) */}
        <div className="col-span-5 border-2 border-black p-2 flex flex-col items-center">
          <span className="font-black text-[9px] uppercase tracking-wider block mb-1">
            KODE CABANG
          </span>

          {/* Kotak Digit Cabang */}
          <div className="flex gap-1.5 mb-1.5">
            {cabangDigits.map((d, i) => (
              <div
                key={i}
                className="w-5 h-6 border-2 border-black font-black text-xs flex items-center justify-center bg-slate-50"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Matriks Bulatan 0-9 untuk 4 Digit Cabang */}
          <div className="grid grid-cols-4 gap-1.5">
            {cabangDigits.map((targetDigit, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-1 items-center">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                  const isFilled = !student.isBlank && targetDigit === digit.toString();
                  return (
                    <div
                      key={digit}
                      style={{
                        width: '4.5mm',
                        height: '4.5mm',
                        borderRadius: '50%',
                        border: '1.2px solid #000000',
                        backgroundColor: isFilled ? '#000000' : '#ffffff',
                        color: isFilled ? '#ffffff' : '#000000',
                        fontSize: '7.5px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                      }}
                    >
                      {digit}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BARIS GRID NISN 10 DIGIT & SELEKSI TINGKAT / SEMESTER ── */}
      <div className="border-2 border-black p-2 mb-2">
        <div className="flex items-center justify-between border-b border-black pb-1 mb-1.5">
          <span className="font-black text-[9px] uppercase tracking-wider">
            NOMOR INDUK SISWA NASIONAL (NISN)
          </span>

          {/* Opsi Kelas & Semester Terarsir */}
          <div className="flex items-center gap-4 text-[9px]">
            <div className="flex items-center gap-1">
              <span className="font-bold">Kelas:</span>
              {['7', '8', '9', '10', '11', '12'].map((k) => {
                const isSelected = kelasNum === k;
                return (
                  <span
                    key={k}
                    style={{
                      width: '4.5mm',
                      height: '4.5mm',
                      borderRadius: '50%',
                      border: '1px solid #000000',
                      backgroundColor: isSelected ? '#000000' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#000000',
                      fontSize: '7.5px',
                      fontWeight: 'bold',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {k}
                  </span>
                );
              })}
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold">Sem:</span>
              <span
                style={{
                  padding: '1px 4px',
                  borderRadius: '3px',
                  border: '1px solid #000000',
                  backgroundColor: isGanjil ? '#000000' : '#ffffff',
                  color: isGanjil ? '#ffffff' : '#000000',
                  fontSize: '8px',
                  fontWeight: 'bold',
                }}
              >
                Ganjil
              </span>
              <span
                style={{
                  padding: '1px 4px',
                  borderRadius: '3px',
                  border: '1px solid #000000',
                  backgroundColor: !isGanjil ? '#000000' : '#ffffff',
                  color: !isGanjil ? '#ffffff' : '#000000',
                  fontSize: '8px',
                  fontWeight: 'bold',
                }}
              >
                Genap
              </span>
            </div>
          </div>
        </div>

        {/* Kotak 10 Digit NISN */}
        <div className="flex justify-center gap-2 mb-1.5">
          {nisnDigits.map((d, i) => (
            <div
              key={i}
              className="w-5 h-6 border-2 border-black font-black text-xs flex items-center justify-center bg-slate-50"
            >
              {d.trim()}
            </div>
          ))}
        </div>

        {/* Matriks Bulatan 10 Kolom x 10 Baris (0-9) */}
        <div className="flex justify-center gap-2">
          {nisnDigits.map((targetDigit, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1 items-center">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                const isFilled = !student.isBlank && targetDigit === digit.toString();
                return (
                  <div
                    key={digit}
                    style={{
                      width: '4.5mm',
                      height: '4.5mm',
                      borderRadius: '50%',
                      border: '1.2px solid #000000',
                      backgroundColor: isFilled ? '#000000' : '#ffffff',
                      color: isFilled ? '#ffffff' : '#000000',
                      fontSize: '7.5px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    {digit}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── MATRIKS JAWABAN PILIHAN GANDA (25 BUTIR SOAL - 2 KOLOM) ── */}
      <div className="border-2 border-black p-3 mb-2">
        <div className="text-center font-black text-[10px] uppercase tracking-wider border-b border-black pb-1 mb-2">
          LEMBAR JAWABAN PILIHAN GANDA (HITAMKAN BULATAN A, B, C, ATAU D)
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Kolom Kiri: Soal Nomor 1 s.d 13 */}
          <div className="space-y-1.5">
            {Array.from({ length: 13 }).map((_, i) => {
              const qNum = i + 1;
              return (
                <div key={qNum} className="flex items-center justify-between px-2 py-0.5 border-b border-slate-200">
                  <span className="font-black text-xs w-6 text-right font-mono">
                    {qNum}.
                  </span>
                  <div className="flex items-center gap-3">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <div
                        key={opt}
                        style={{
                          width: '5.5mm',
                          height: '5.5mm',
                          borderRadius: '50%',
                          border: '1.5px solid #000000',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kolom Kanan: Soal Nomor 14 s.d 25 */}
          <div className="space-y-1.5">
            {Array.from({ length: 12 }).map((_, i) => {
              const qNum = i + 14;
              return (
                <div key={qNum} className="flex items-center justify-between px-2 py-0.5 border-b border-slate-200">
                  <span className="font-black text-xs w-6 text-right font-mono">
                    {qNum}.
                  </span>
                  <div className="flex items-center gap-3">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <div
                        key={opt}
                        style={{
                          width: '5.5mm',
                          height: '5.5mm',
                          borderRadius: '50%',
                          border: '1.5px solid #000000',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PETUNJUK TEKNIS PENGISIAN LJK (FOOTER) ── */}
      <div className="border border-black p-2 text-[8.5px] leading-tight text-slate-800 bg-slate-50">
        <span className="font-bold uppercase tracking-wider block mb-0.5">
          PETUNJUK PENGISIAN LEMBAR JAWABAN:
        </span>
        <div className="grid grid-cols-3 gap-2">
          <div>
            1. Gunakan pensil 2B atau pulpen bertinta hitam pekat.
          </div>
          <div>
            2. Hitamkan bulatan penuh:
            <span className="inline-flex items-center gap-1 font-bold ml-1">
              [ <span className="inline-block w-2.5 h-2.5 bg-black rounded-full" /> Benar ]
              [ ✗ Salah ] [ ✓ Salah ]
            </span>
          </div>
          <div>
            3. Lembar jawaban tidak boleh kotor, terlipat, basah, atau robek.
          </div>
        </div>
      </div>
    </div>
  );
};
