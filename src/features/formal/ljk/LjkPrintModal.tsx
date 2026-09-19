import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Lock,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useGetCabang } from '../../core_data/hooks/useMasterData';
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
  const { user } = useAuth();
  const { data: masterCabangList = [] } = useGetCabang();

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
  // Resolusi Cabang aktif untuk LJK:
  // Prioritas 1: Sesuai role cabang akun yang login (user.cabangId / user.cabangKode)
  // Prioritas 2: Dari data cabang kelas yang dipilih
  // Prioritas 3: Dari filter selectedCabangId
  const activeCabangObj = useMemo(() => {
    // 1. Akun login jika terikat cabang
    if (user?.cabangId) {
      const byUser = masterCabangList.find((c) => c.id === user.cabangId);
      if (byUser) return byUser;
      if (user.cabangName) {
        return {
          id: user.cabangId,
          name: user.cabangName,
          kode: user.cabangKode || null,
        };
      }
    }

    // 2. Kelas yang dipilih
    if (currentKelasObj?.cabang) {
      if (currentKelasObj.cabang.kode) return currentKelasObj.cabang;
      const byKelas = masterCabangList.find(
        (c) => c.id === currentKelasObj.cabang?.id || c.id === (currentKelasObj as any).cabangId,
      );
      if (byKelas) return byKelas;
    } else if ((currentKelasObj as any)?.cabangId) {
      const byKelas = masterCabangList.find(
        (c) => c.id === (currentKelasObj as any).cabangId,
      );
      if (byKelas) return byKelas;
    }

    // 3. Prop selectedCabangId
    if (selectedCabangId) {
      const byProp = masterCabangList.find((c) => c.id === selectedCabangId);
      if (byProp) return byProp;
    }

    return null;
  }, [user, masterCabangList, currentKelasObj, selectedCabangId]);

  const [kodeCabang, setKodeCabang] = useState<string>(() => {
    return activeCabangObj?.kode || currentKelasObj?.cabang?.kode || '1001';
  });
  const [kodeMapel, setKodeMapel] = useState<string>('01');
  const [totalSoal, setTotalSoal] = useState<25 | 30 | 40 | 50>(25);
  const [spareBlankCount, setSpareBlankCount] = useState<number>(0);
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);

  // Auto-update kode cabang: terisi otomatis sesuai role cabang akun yang login / kelas terpilih
  useEffect(() => {
    if (activeCabangObj?.kode) {
      setKodeCabang(activeCabangObj.kode);
    } else if (currentKelasObj?.cabang?.kode) {
      setKodeCabang(currentKelasObj.cabang.kode);
    }
  }, [activeCabangObj, currentKelasObj]);

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
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Sembunyikan seluruh elemen lain di body (#root, backdrop modal, dll) */
          body > :not(#ljk-print-area) {
            display: none !important;
          }
          #ljk-print-area {
            display: block !important;
            position: static !important;
            width: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .ljk-a4-landscape-page {
            width: 297mm !important;
            max-width: 297mm !important;
            min-width: 297mm !important;
            height: 209.5mm !important;
            max-height: 209.5mm !important;
            min-height: 209.5mm !important;
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
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Kode Cabang (4 Digit)</span>
                      <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                        <Lock className="w-2.5 h-2.5" /> Terkunci
                      </span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      maxLength={4}
                      value={kodeCabang}
                      className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-extrabold text-slate-800 text-center cursor-not-allowed select-none shadow-inner"
                      placeholder="1001"
                      title="Kode cabang terkunci otomatis sesuai role cabang akun yang login"
                    />
                    {activeCabangObj?.name && (
                      <p className="text-[10px] text-slate-500 font-semibold mt-1 truncate text-center" title={activeCabangObj.name}>
                        {activeCabangObj.name}
                      </p>
                    )}
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

      {/* ── AREA CETAK FISIK (PORTAL LANGSUNG KE DOCUMENT.BODY AGAR MULTI-PAGE PRINT BEKERJA PENUH) ── */}
      {typeof document !== 'undefined' &&
        createPortal(
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
          </div>,
          document.body,
        )}
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

const BUBBLE_SIZE = 3.2; // 3.2mm diameter seragam untuk seluruh bulatan LJK
const DIGIT_ROW_SPACING = 3.8; // 3.8mm jarak vertikal antar baris digit (0-9)
const DIGIT_COL_SPACING = 5.2; // 5.2mm jarak horizontal antar kolom digit
const OPT_HORIZONTAL_SPACING = 5.5; // 5.5mm jarak horizontal antar opsi A, B, C, D
const Q_ROW_SPACING = 4.4; // 4.4mm jarak vertikal antar butir soal di lembar jawaban

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
  // 4 digit kode cabang
  const cabangDigits = (kodeCabang || '1001').padEnd(4, '0').slice(0, 4).split('');

  // 2 digit kode mapel
  const mapelDigits = (kodeMapel || '01').padStart(2, '0').slice(-2).split('');

  // 10 digit NISN
  const nisnDigits = (student.nisn || '')
    .replace(/\D/g, '')
    .padEnd(10, ' ')
    .slice(0, 10)
    .split('');

  // Semester number: 1 = Ganjil, 2 = Genap
  const semNum = isGanjil ? '1' : '2';

  // Kelas display
  const cleanKelas = kelasNum.replace(/\D/g, '') || '10';

  // Pembagian 3 kolom soal
  const colsConfig = useMemo(() => {
    // 3 kolom: col1, col2, col3
    const perCol = Math.ceil(totalSoal / 3);
    return {
      c1Count: perCol,
      c2Count: perCol,
      c3Count: totalSoal - perCol * 2,
    };
  }, [totalSoal]);

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
        borderRight: isLeftHalf ? '1px dashed #cbd5e1' : 'none',
      }}
    >
      {/* ── 4 SUDUT TIMING MARKERS (Hitam Solid 7mm × 5mm seperti di contoh gambar) ── */}
      {/* Top-Left: Center at (9.0mm, 15.0mm) */}
      <div
        style={{
          position: 'absolute',
          left: '5.5mm',
          top: '12.5mm',
          width: '7mm',
          height: '5mm',
          backgroundColor: '#000000',
        }}
      />
      {/* Top-Right: Center at (139.5mm, 15.0mm) */}
      <div
        style={{
          position: 'absolute',
          right: '5.5mm',
          top: '12.5mm',
          width: '7mm',
          height: '5mm',
          backgroundColor: '#000000',
        }}
      />
      {/* Bottom-Left: Center at (9.0mm, 185.0mm) */}
      <div
        style={{
          position: 'absolute',
          left: '5.5mm',
          top: '182.5mm',
          width: '7mm',
          height: '5mm',
          backgroundColor: '#000000',
        }}
      />
      {/* Bottom-Right: Center at (139.5mm, 185.0mm) */}
      <div
        style={{
          position: 'absolute',
          right: '5.5mm',
          top: '182.5mm',
          width: '7mm',
          height: '5mm',
          backgroundColor: '#000000',
        }}
      />

      {/* ── HEADER KOP LJK (CENTERED, MINIMALIS, TANPA BORDER) ── */}
      <div
        style={{
          position: 'absolute',
          top: '10.5mm',
          left: '15mm',
          width: '118.5mm',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: '9px',
            fontWeight: '900',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}
        >
          LEMBAR JAWABAN KOMPUTER (LJK)
        </h2>
        <h3
          style={{
            fontSize: '8px',
            fontWeight: '900',
            margin: '0.4mm 0 0 0',
            textTransform: 'uppercase',
            color: '#000000',
          }}
        >
          {examTitle || 'PENILAIAN AKHIR SEMESTER (PAS)'}
        </h3>
        <p
          style={{
            fontSize: '6.8px',
            fontWeight: '500',
            margin: '0.4mm 0 0 0',
            color: '#000000',
          }}
        >
          Tahun Ajaran : {tahunAjaran} - Semester : {semesterName}
        </p>
      </div>

      {/* ── BARIS DATA IDENTITAS: KODE CABANG, MAPEL, NISN SISWA, KELAS, SEMESTER ── */}
      {/* 1. KODE CABANG (4 Kolom, x = 14.7mm s.d 34.8mm) */}
      <div
        style={{
          position: 'absolute',
          top: '21.5mm',
          left: '14.7mm',
          width: '20.1mm',
          textAlign: 'center',
          fontSize: '6.2px',
          fontWeight: '900',
        }}
      >
        KODE CABANG
      </div>
      {[0, 1, 2, 3].map((c) => {
        const cx = 17.0 + c * DIGIT_COL_SPACING;
        const targetDigit = cabangDigits[c];
        return (
          <React.Fragment key={`cab-col-${c}`}>
            {/* Box Digit */}
            <div
              style={{
                position: 'absolute',
                left: `${cx - 2.3}mm`,
                top: '25.0mm',
                width: '4.6mm',
                height: '4.6mm',
                border: '1px solid #000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: '900',
                backgroundColor: '#ffffff',
              }}
            >
              {cabangDigits[c]}
            </div>
            {/* 10 Bulatan (0-9) */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
              const cy = 33.5 + d * DIGIT_ROW_SPACING;
              const isFilled = !student.isBlank && targetDigit === d.toString();
              return (
                <div
                  key={`cab-${c}-${d}`}
                  style={{
                    position: 'absolute',
                    left: `${cx - BUBBLE_SIZE / 2}mm`,
                    top: `${cy - BUBBLE_SIZE / 2}mm`,
                  }}
                >
                  <DigitBubbleSvg digit={d} isFilled={isFilled} sizeMm={BUBBLE_SIZE} />
                </div>
              );
            })}
          </React.Fragment>
        );
      })}

      {/* 2. MAPEL (2 Kolom, x = 38.3mm s.d 48.0mm) */}
      <div
        style={{
          position: 'absolute',
          top: '21.5mm',
          left: '38.3mm',
          width: '9.7mm',
          textAlign: 'center',
          fontSize: '6.2px',
          fontWeight: '900',
        }}
      >
        MAPEL
      </div>
      {[0, 1].map((c) => {
        const cx = 40.6 + c * DIGIT_COL_SPACING;
        const targetDigit = mapelDigits[c];
        return (
          <React.Fragment key={`mapel-col-${c}`}>
            {/* Box Digit */}
            <div
              style={{
                position: 'absolute',
                left: `${cx - 2.3}mm`,
                top: '25.0mm',
                width: '4.6mm',
                height: '4.6mm',
                border: '1px solid #000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: '900',
                backgroundColor: '#ffffff',
              }}
            >
              {mapelDigits[c]}
            </div>
            {/* 10 Bulatan (0-9) */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
              const cy = 33.5 + d * DIGIT_ROW_SPACING;
              const isFilled = targetDigit === d.toString();
              return (
                <div
                  key={`mapel-${c}-${d}`}
                  style={{
                    position: 'absolute',
                    left: `${cx - BUBBLE_SIZE / 2}mm`,
                    top: `${cy - BUBBLE_SIZE / 2}mm`,
                  }}
                >
                  <DigitBubbleSvg digit={d} isFilled={isFilled} sizeMm={BUBBLE_SIZE} />
                </div>
              );
            })}
          </React.Fragment>
        );
      })}

      {/* 3. NISN SISWA (10 Kolom, x = 52.5mm s.d 103.8mm) */}
      <div
        style={{
          position: 'absolute',
          top: '21.5mm',
          left: '52.5mm',
          width: '51.3mm',
          textAlign: 'center',
          fontSize: '6.2px',
          fontWeight: '900',
        }}
      >
        NISN SISWA
      </div>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((c) => {
        const cx = 54.8 + c * DIGIT_COL_SPACING;
        const targetDigit = nisnDigits[c];
        return (
          <React.Fragment key={`nisn-col-${c}`}>
            {/* Box Digit */}
            <div
              style={{
                position: 'absolute',
                left: `${cx - 2.3}mm`,
                top: '25.0mm',
                width: '4.6mm',
                height: '4.6mm',
                border: '1px solid #000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: '900',
                backgroundColor: '#ffffff',
              }}
            >
              {nisnDigits[c]?.trim()}
            </div>
            {/* 10 Bulatan (0-9) */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
              const cy = 33.5 + d * DIGIT_ROW_SPACING;
              const isFilled = !student.isBlank && targetDigit === d.toString();
              return (
                <div
                  key={`nisn-${c}-${d}`}
                  style={{
                    position: 'absolute',
                    left: `${cx - BUBBLE_SIZE / 2}mm`,
                    top: `${cy - BUBBLE_SIZE / 2}mm`,
                  }}
                >
                  <DigitBubbleSvg digit={d} isFilled={isFilled} sizeMm={BUBBLE_SIZE} />
                </div>
              );
            })}
          </React.Fragment>
        );
      })}

      {/* 4. KELAS (1 Kolom Vertikal, 7 s.d 12, x = 108.3mm) */}
      <div
        style={{
          position: 'absolute',
          top: '21.5mm',
          left: '108.3mm',
          width: '6.5mm',
          textAlign: 'center',
          fontSize: '6.2px',
          fontWeight: '900',
        }}
      >
        KELAS
      </div>
      {/* Box Kelas */}
      <div
        style={{
          position: 'absolute',
          left: '108.3mm',
          top: '25.0mm',
          width: '6.5mm',
          height: '4.6mm',
          border: '1px solid #000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          fontWeight: '900',
          backgroundColor: '#ffffff',
        }}
      >
        {cleanKelas}
      </div>
      {/* Bulatan Kelas 7, 8, 9, 10, 11, 12 secara vertikal */}
      {['7', '8', '9', '10', '11', '12'].map((k, idx) => {
        const cx = 111.55;
        const cy = 33.5 + idx * DIGIT_ROW_SPACING;
        const isSelected = cleanKelas === k;
        return (
          <div
            key={`k-opt-${k}`}
            style={{
              position: 'absolute',
              left: `${cx - BUBBLE_SIZE / 2}mm`,
              top: `${cy - BUBBLE_SIZE / 2}mm`,
            }}
          >
            <KelasBubbleSvg label={k} isSelected={isSelected} sizeMm={BUBBLE_SIZE} />
          </div>
        );
      })}

      {/* 5. SEMESTER (1 Kolom Vertikal, Ganjil=1 & Genap=2, x = 119.3mm) */}
      <div
        style={{
          position: 'absolute',
          top: '21.5mm',
          left: '119.3mm',
          width: '14.5mm',
          textAlign: 'left',
          fontSize: '6.2px',
          fontWeight: '900',
        }}
      >
        SEMESTER
      </div>
      {/* Box Semester */}
      <div
        style={{
          position: 'absolute',
          left: '119.3mm',
          top: '25.0mm',
          width: '5.0mm',
          height: '4.6mm',
          border: '1px solid #000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          fontWeight: '900',
          backgroundColor: '#ffffff',
        }}
      >
        {semNum}
      </div>
      {/* Bulatan & Label 1 GANJIL */}
      <div
        style={{
          position: 'absolute',
          left: `${121.8 - BUBBLE_SIZE / 2}mm`,
          top: `${33.5 - BUBBLE_SIZE / 2}mm`,
        }}
      >
        <DigitBubbleSvg digit="1" isFilled={isGanjil} sizeMm={BUBBLE_SIZE} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: '124.5mm',
          top: '32.0mm',
          fontSize: '6px',
          fontWeight: 'bold',
          lineHeight: '3.2mm',
        }}
      >
        GANJIL
      </div>
      {/* Bulatan & Label 2 GENAP */}
      <div
        style={{
          position: 'absolute',
          left: `${121.8 - BUBBLE_SIZE / 2}mm`,
          top: `${37.3 - BUBBLE_SIZE / 2}mm`,
        }}
      >
        <DigitBubbleSvg digit="2" isFilled={!isGanjil} sizeMm={BUBBLE_SIZE} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: '124.5mm',
          top: '35.8mm',
          fontSize: '6px',
          fontWeight: 'bold',
          lineHeight: '3.2mm',
        }}
      >
        GENAP
      </div>

      {/* ── LEMBAR JAWABAN (3 KOLOM, SAMA PERSIS CONTOH GAMBAR) ── */}
      <div
        style={{
          position: 'absolute',
          top: '75.0mm',
          left: '0',
          width: '148.5mm',
          textAlign: 'center',
          fontSize: '7.5px',
          fontWeight: '900',
          letterSpacing: '0.2px',
        }}
      >
        LEMBAR JAWABAN
      </div>

      {/* 3 Kolom Jawaban: Col 1 (1-10), Col 2 (11-20), Col 3 (21-30) */}
      {[0, 1, 2].map((colIdx) => {
        const startX = [20.0, 59.5, 99.0][colIdx];
        const startQ = colIdx * 10 + 1;
        const count = colIdx === 2 ? Math.min(10, totalSoal - 20) : Math.min(10, Math.max(0, totalSoal - colIdx * 10));
        if (count <= 0) return null;

        return (
          <React.Fragment key={`ans-col-${colIdx}`}>
            {/* Subheader NO  A  B  C  D */}
            <div
              style={{
                position: 'absolute',
                top: '80.5mm',
                left: `${startX}mm`,
                width: '29.5mm',
                height: '4mm',
                display: 'flex',
                alignItems: 'center',
                fontSize: '6.8px',
                fontWeight: '900',
              }}
            >
              <span style={{ width: '6.0mm', textAlign: 'right' }}>NO</span>
              {['A', 'B', 'C', 'D'].map((opt, oIdx) => (
                <span
                  key={`sh-${colIdx}-${opt}`}
                  style={{
                    position: 'absolute',
                    left: `${11.0 + oIdx * OPT_HORIZONTAL_SPACING - 2.5}mm`,
                    width: '5.0mm',
                    textAlign: 'center',
                  }}
                >
                  {opt}
                </span>
              ))}
            </div>

            {/* Butir Soal & Bulatan A, B, C, D */}
            {Array.from({ length: count }).map((_, rIdx) => {
              const q = startQ + rIdx;
              const cy = 87.5 + rIdx * Q_ROW_SPACING;

              return (
                <React.Fragment key={`q-${q}`}>
                  {/* Nomor Soal */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${startX}mm`,
                      top: `${cy - 1.8}mm`,
                      width: '6.0mm',
                      textAlign: 'right',
                      fontSize: '7.5px',
                      fontWeight: 'bold',
                      fontFamily: 'Arial, sans-serif',
                    }}
                  >
                    {q}
                  </div>

                  {/* Bulatan A, B, C, D */}
                  {['A', 'B', 'C', 'D'].map((opt, oIdx) => {
                    const cx = startX + 11.0 + oIdx * OPT_HORIZONTAL_SPACING;
                    return (
                      <div
                        key={`q-${q}-${opt}`}
                        style={{
                          position: 'absolute',
                          left: `${cx - BUBBLE_SIZE / 2}mm`,
                          top: `${cy - BUBBLE_SIZE / 2}mm`,
                        }}
                      >
                        <OptionBubbleSvg opt={opt} sizeMm={BUBBLE_SIZE} />
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}

      {/* ── BAGIAN BAWAH: NAMA LENGKAP & KOTAK TTD SISWA + GURU ── */}
      {/* Nama Lengkap Santri (Kiri) */}
      <div
        style={{
          position: 'absolute',
          left: '17.0mm',
          top: '138.0mm',
          width: '50mm',
        }}
      >
        <div style={{ fontSize: '6.8px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000000' }}>
          NAMA LENGKAP
        </div>
        <div
          style={{
            fontSize: '8.5px',
            fontWeight: '900',
            textTransform: 'uppercase',
            marginTop: '1.5mm',
            color: '#000000',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {student.namaLengkap || (student.isBlank ? '....................................' : '-')}
        </div>
      </div>

      {/* TTD SISWA (Tengah) */}
      <div
        style={{
          position: 'absolute',
          left: '70.0mm',
          top: '135.0mm',
          width: '24.0mm',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '6.5px', fontWeight: 'bold', marginBottom: '1.0mm' }}>
          TTD SISWA
        </div>
        <div
          style={{
            width: '24.0mm',
            height: '13.0mm',
            border: '1px solid #000000',
            backgroundColor: '#ffffff',
          }}
        />
      </div>

      {/* TTD GURU (Kanan) */}
      <div
        style={{
          position: 'absolute',
          left: '102.0mm',
          top: '135.0mm',
          width: '24.0mm',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '6.5px', fontWeight: 'bold', marginBottom: '1.0mm' }}>
          TTD GURU
        </div>
        <div
          style={{
            width: '24.0mm',
            height: '13.0mm',
            border: '1px solid #000000',
            backgroundColor: '#ffffff',
          }}
        />
      </div>
    </div>
  );
};

// ===================================================================================
// SUB-KOMPONEN VECTOR SVG PRESISI TINGGI DENGAN UKURAN SERAGAM (3.2mm DEFAULT)
// ===================================================================================

const DigitBubbleSvg: React.FC<{
  digit: number | string;
  isFilled: boolean;
  sizeMm?: number;
}> = ({ digit, isFilled, sizeMm = 3.2 }) => {
  if (isFilled) {
    return (
      <svg
        style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm` }}
        viewBox="0 0 16 16"
        className="shrink-0"
      >
        <circle cx="8" cy="8" r="7.2" fill="#000000" stroke="#000000" strokeWidth="1" />
        <text
          x="8"
          y="11.2"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="8.5"
          fontWeight="bold"
          fontFamily="Arial, Helvetica, sans-serif"
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
      <circle cx="8" cy="8" r="6.8" fill="#ffffff" stroke="#000000" strokeWidth="1.1" />
      <text
        x="8"
        y="11.2"
        textAnchor="middle"
        fill="#000000"
        fontSize="8.5"
        fontWeight="bold"
        fontFamily="Arial, Helvetica, sans-serif"
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
}> = ({ opt, isFilled = false, sizeMm = 3.2 }) => {
  return (
    <svg
      style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm` }}
      viewBox="0 0 16 16"
      className="shrink-0"
    >
      <circle
        cx="8"
        cy="8"
        r={isFilled ? '7.2' : '6.8'}
        fill={isFilled ? '#000000' : '#ffffff'}
        stroke="#000000"
        strokeWidth={isFilled ? '1' : '1.1'}
      />
      <text
        x="8"
        y="11.2"
        textAnchor="middle"
        fill={isFilled ? '#ffffff' : '#000000'}
        fontSize="8.5"
        fontWeight="bold"
        fontFamily="Arial, Helvetica, sans-serif"
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
}> = ({ label, isSelected, sizeMm = 3.2 }) => {
  const isWide = label.length > 1;
  if (isSelected) {
    return (
      <svg
        style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm` }}
        viewBox="0 0 16 16"
        className="shrink-0"
      >
        <circle cx="8" cy="8" r="7.2" fill="#000000" stroke="#000000" strokeWidth="1" />
        <text
          x="8"
          y="11.2"
          textAnchor="middle"
          fill="#ffffff"
          fontSize={isWide ? '7.5' : '8.5'}
          fontWeight="bold"
          fontFamily="Arial, Helvetica, sans-serif"
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
      <circle cx="8" cy="8" r="6.8" fill="#ffffff" stroke="#000000" strokeWidth="1.1" />
      <text
        x="8"
        y="11.2"
        textAnchor="middle"
        fill="#000000"
        fontSize={isWide ? '7.5' : '8.5'}
        fontWeight="bold"
        fontFamily="Arial, Helvetica, sans-serif"
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
