import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { AxiosError } from 'axios';
import apiClient from '../../lib/apiClient';
import { Loader2, Plus, Trash2, Save, Info, Download, Upload, FileSpreadsheet, FileDown, Eye, Pencil, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import SilabusPreviewModal from './SilabusPreviewModal';
import Pagination from '../../components/Pagination';

interface SilabusSummaryItem {
  mataPelajaranId: string;
  name: string;
  kodeMapel: string;
  tingkat: string;
  jumlahItem: number;
  hasSilabus: boolean;
}

interface SilabusExportItem {
  mataPelajaranName: string;
  kodeMapel: string;
  tingkat: string;
  tahunAjaran: string;
  semester: string;
  bab: string;
  section: string;
  tanggalTarget: string | null;
}

interface SilabusItem {
  id?: string;
  bab: string;
  urutanBab: number;
  section: string;
  urutanSection: number;
  tanggalTarget?: string;
}

const TINGKAT_OPTIONS = ['Non Muadalah', '7', '8', '9', '10', '11', '12'];
const TAHUN_AJARAN_OPTIONS = ['2025/2026', '2026/2027', '2027/2028'];

const emptyItem = (urutanBab: number, urutanSection: number): SilabusItem => ({
  bab: '', urutanBab, section: '', urutanSection, tanggalTarget: ''
});

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const parseTanggal = (raw: any): string => {
  if (raw === null || raw === undefined || raw === '') return '';
  if (typeof raw === 'number') {
    const parsed = XLSX.SSF.parse_date_code(raw);
    if (!parsed) return '';
    return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }
  const str = String(raw).trim();
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  const dmyMatch = str.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) return parsedDate.toISOString().slice(0, 10);
  return '';
};

export default function KelolaSilabus() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedMapel, setSelectedMapel] = useState('');
  const [selectedTingkat, setSelectedTingkat] = useState('');
  // Tingkat konkret yang sedang diedit — dipisah dari filter selectedTingkat karena
  // filter bisa berisi 'ALL' (Semua Tingkat), sementara editor/preview selalu butuh
  // satu tingkat pasti per baris yang diklik.
  const [editingTingkat, setEditingTingkat] = useState('');
  const [previewMapel, setPreviewMapel] = useState<{ id: string; name: string; tingkat: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: pengaturanAkademik } = useQuery({
    queryKey: ['pengaturan-akademik'],
    queryFn: async () => (await apiClient.get('/pengaturan/akademik')).data
  });

  const [tahunAjaran, setTahunAjaran] = useState('');
  const [semester, setSemester] = useState('Ganjil');

  useEffect(() => {
    if (pengaturanAkademik && !tahunAjaran) {
      setTahunAjaran(pengaturanAkademik.tahunAjaran || '');
      setSemester(pengaturanAkademik.semesterAktif || 'Ganjil');
    }
  }, [pengaturanAkademik]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scope (Tingkat+Tahun Ajaran+Semester) sudah cukup buat nampilin daftar mapel;
  // pemilihan mapel spesifik cuma dibutuhkan begitu masuk mode edit silabus.
  const isScopeReady = !!selectedTingkat && !!tahunAjaran && !!semester;

  const { data: summaryList, isLoading: loadingSummary } = useQuery<SilabusSummaryItem[]>({
    queryKey: ['silabus-summary', selectedTingkat, tahunAjaran, semester],
    queryFn: async () => (await apiClient.get('/pembelajaran/silabus/summary', {
      params: { tingkat: selectedTingkat, tahunAjaran, semester }
    })).data,
    enabled: isScopeReady
  });

  const isReady = isScopeReady && !!selectedMapel;

  const { data: fetchedSilabus, isLoading: loadingSilabus } = useQuery<SilabusItem[]>({
    queryKey: ['silabus', selectedMapel, editingTingkat, tahunAjaran, semester],
    queryFn: async () => {
      const res = await apiClient.get('/pembelajaran/silabus', {
        params: { mataPelajaranId: selectedMapel, tingkat: editingTingkat, tahunAjaran, semester }
      });
      return res.data;
    },
    enabled: isReady
  });

  const [items, setItems] = useState<SilabusItem[]>([]);

  useEffect(() => {
    if (fetchedSilabus) {
      setItems(fetchedSilabus.length > 0
        ? fetchedSilabus.map(s => ({ ...s, tanggalTarget: s.tanggalTarget ? s.tanggalTarget.slice(0, 10) : '' }))
        : [emptyItem(1, 1)]
      );
    }
  }, [fetchedSilabus]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/pembelajaran/silabus/bulk', {
        mataPelajaranId: selectedMapel,
        tingkat: editingTingkat,
        tahunAjaran,
        semester,
        items: items.filter(i => i.bab.trim() && i.section.trim())
      });
    },
    onSuccess: () => {
      showToast('success', 'Silabus berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['silabus', selectedMapel, editingTingkat, tahunAjaran, semester] });
      queryClient.invalidateQueries({ queryKey: ['silabus-summary', selectedTingkat, tahunAjaran, semester] });
      // Menambah/menghapus section mengubah daftar materi & pembagi persentase di modul lain.
      queryClient.invalidateQueries({ queryKey: ['pelaksanaan-silabus'] });
      queryClient.invalidateQueries({ queryKey: ['pembelajaran-ringkasan'] });
      queryClient.invalidateQueries({ queryKey: ['laporan-pembelajaran'] });
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menyimpan silabus');
    }
  });

  const exportAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.get<SilabusExportItem[]>('/pembelajaran/silabus/export');
      return res.data;
    },
    onSuccess: (data) => {
      if (data.length === 0) {
        showToast('error', 'Belum ada data silabus untuk diekspor.');
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(
        data.map(d => {
          const row: Record<string, string> = {
            'Mata Pelajaran': d.mataPelajaranName,
            'Kode Mapel': d.kodeMapel,
            Tingkat: d.tingkat,
            'Tahun Ajaran': d.tahunAjaran,
            Semester: d.semester,
            Bab: d.bab,
            Section: d.section,
          };
          if (d.tanggalTarget) row['Tanggal Target'] = d.tanggalTarget.slice(0, 10);
          return row;
        })
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Semua Silabus');
      XLSX.writeFile(workbook, `Semua_Silabus_${new Date().toISOString().slice(0, 10)}.xlsx`);
    },
    onError: (err: unknown) => {
      const message = err instanceof AxiosError ? (err.response?.data as { message?: string } | undefined)?.message : undefined;
      showToast('error', message || 'Gagal mengekspor data silabus.');
    }
  });

  const updateItem = (idx: number, patch: Partial<SilabusItem>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const addRow = () => {
    const last = items[items.length - 1];
    setItems(prev => [...prev, emptyItem(last?.urutanBab || 1, (last?.urutanSection || 0) + 1)]);
  };

  const removeRow = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const paginatedSummary = (summaryList || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const mapelName = (summaryList || []).find(m => m.mataPelajaranId === selectedMapel)?.name || 'Mapel';
  const exportFileName = () => `Silabus_${mapelName}_${editingTingkat}_${tahunAjaran.replace('/', '-')}_${semester}.xlsx`.replace(/\s+/g, '_');

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      { Bab: 'Bab 1', Section: '1.1 Pengenalan' },
      { Bab: 'Bab 1', Section: '1.2 Lanjutan' }
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Silabus');
    XLSX.writeFile(workbook, 'Template_Silabus.xlsx');
  };

  const handleExport = () => {
    const exportable = items.filter(i => i.bab.trim() && i.section.trim());
    if (exportable.length === 0) {
      showToast('error', 'Belum ada data silabus untuk diekspor.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(
      exportable.map(i => {
        const row: Record<string, any> = { Bab: i.bab, Section: i.section };
        if (i.tanggalTarget) row['Tanggal Target'] = i.tanggalTarget;
        return row;
      })
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Silabus');
    XLSX.writeFile(workbook, exportFileName());
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!isReady) {
      showToast('error', 'Pilih Mata Pelajaran, Tingkat, Tahun Ajaran, dan Semester terlebih dahulu.');
      return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const rawData = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(rawData, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '', raw: true });

        if (rows.length === 0) {
          showToast('error', 'File kosong atau format tidak dikenali.');
          return;
        }

        const findKey = (row: Record<string, any>, candidates: string[]) =>
          Object.keys(row).find(k => candidates.includes(normalize(k)));

        const parsed: SilabusItem[] = [];
        let currentBab = '';
        let urutanBab = 0;
        let urutanSection = 0;

        rows.forEach(row => {
          const babKey = findKey(row, ['bab']);
          const sectionKey = findKey(row, ['section', 'subbab', 'sectionsubbab']);
          const tanggalKey = findKey(row, ['tanggaltarget', 'tanggal', 'targetdiajar', 'tanggaltargetdiajar']);
          const bab = String(row[babKey || 'Bab'] || '').trim();
          const section = String(row[sectionKey || 'Section'] || '').trim();
          if (!bab || !section) return;

          if (bab !== currentBab) {
            currentBab = bab;
            urutanBab++;
            urutanSection = 0;
          }
          urutanSection++;

          const tanggalTarget = tanggalKey && row[tanggalKey] ? parseTanggal(row[tanggalKey]) : '';
          parsed.push({ bab, urutanBab, section, urutanSection, tanggalTarget });
        });

        if (parsed.length === 0) {
          showToast('error', 'Tidak ada baris valid ditemukan. Pastikan kolom Bab dan Section terisi.');
          return;
        }

        setItems(parsed);
        showToast('success', `${parsed.length} baris berhasil diimpor. Periksa lalu klik "Simpan Silabus" untuk menyimpan.`);
      } catch {
        showToast('error', 'Gagal membaca file Excel.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {selectedMapel
            ? 'Susun Bab/Section untuk mata pelajaran ini (tanggal target bersifat opsional).'
            : 'Pilih Tingkat, Tahun Ajaran, dan Semester untuk melihat mapel mana yang silabusnya sudah/belum diisi.'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportAllMutation.mutate()}
            disabled={exportAllMutation.isPending}
            title="Ekspor seluruh silabus (semua mapel &amp; tingkat) ke satu file Excel"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs font-semibold rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exportAllMutation.isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengekspor...</>
            ) : (
              <><FileDown className="w-3.5 h-3.5" /> Export Semua Silabus</>
            )}
          </button>
          {selectedMapel && (
            <>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs font-semibold rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Template
              </button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
              <button
                type="button"
                onClick={handleImportClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs font-semibold rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Import Excel
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={items.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs font-semibold rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tingkat</label>
          <select
            value={selectedTingkat}
            onChange={e => { setSelectedTingkat(e.target.value); setSelectedMapel(''); setCurrentPage(1); }}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
          >
            <option value="">-- Pilih Tingkat --</option>
            <option value="ALL">Semua Tingkat</option>
            {TINGKAT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tahun Ajaran</label>
          <select
            value={tahunAjaran}
            onChange={e => { setTahunAjaran(e.target.value); setSelectedMapel(''); setCurrentPage(1); }}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
          >
            {TAHUN_AJARAN_OPTIONS.map(ta => <option key={ta} value={ta}>{ta}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Semester</label>
          <select
            value={semester}
            onChange={e => { setSemester(e.target.value); setSelectedMapel(''); setCurrentPage(1); }}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
          >
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      </div>

      {!isScopeReady ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 flex flex-col items-center justify-center">
          <Info className="w-6 h-6 mb-1.5 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">Pilih Tingkat, Tahun Ajaran, dan Semester untuk melihat daftar mata pelajaran.</p>
        </div>
      ) : !selectedMapel ? (
        loadingSummary ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 flex justify-center items-center">
            <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
          </div>
        ) : !summaryList || summaryList.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 flex flex-col items-center justify-center">
            <Info className="w-6 h-6 mb-1.5 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">Belum ada mata pelajaran aktif untuk pembelajaran.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-12">No</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Mata Pelajaran</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-32">Kode</th>
                    {selectedTingkat === 'ALL' && (
                      <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-28">Tingkat</th>
                    )}
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-40">Status Silabus</th>
                    <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedSummary.map((m, idx) => (
                    <tr key={`${m.mataPelajaranId}-${m.tingkat}`} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-3 py-2.5 text-sm text-gray-400 font-medium">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="px-3 py-2.5 text-sm font-semibold text-gray-800">{m.name}</td>
                      <td className="px-3 py-2.5 text-sm font-mono text-gray-500">{m.kodeMapel}</td>
                      {selectedTingkat === 'ALL' && (
                        <td className="px-3 py-2.5 text-sm text-gray-600">{m.tingkat}</td>
                      )}
                      <td className="px-3 py-2.5">
                        {m.hasSilabus ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Sudah Ada ({m.jumlahItem})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 text-[11px] font-bold">
                            <XCircle className="w-3 h-3" /> Belum Ada
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewMapel({ id: m.mataPelajaranId, name: m.name, tingkat: m.tingkat })}
                            disabled={!m.hasSilabus}
                            title={m.hasSilabus ? 'Lihat silabus' : 'Belum ada silabus untuk dilihat'}
                            className="p-1.5 text-gray-500 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedMapel(m.mataPelajaranId); setEditingTingkat(m.tingkat); }}
                            title="Isi / edit silabus"
                            className="p-1.5 text-gray-500 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(summaryList.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              totalItems={summaryList.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => { setSelectedMapel(''); setEditingTingkat(''); }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 hover:text-blue-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Mapel
          </button>

          {loadingSilabus ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 flex justify-center items-center">
              <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-12">No</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Bab</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Section / Sub-Bab</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-48">Tanggal Target (Opsional)</th>
                      <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-12">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-1.5 text-sm text-gray-400 font-medium">{idx + 1}</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            value={item.bab}
                            onChange={e => updateItem(idx, { bab: e.target.value })}
                            placeholder="Bab 1"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            value={item.section}
                            onChange={e => updateItem(idx, { section: e.target.value })}
                            placeholder="1.1 Pengenalan..."
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="date"
                            value={item.tanggalTarget}
                            onChange={e => updateItem(idx, { tanggalTarget: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                          />
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <button
                            onClick={() => removeRow(idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 border-t border-gray-100">
                <button
                  onClick={addRow}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-800 border border-dashed border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Baris
                </button>
              </div>

              <div className="px-3 py-2.5 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded text-white bg-blue-800 hover:bg-blue-900 transition-colors disabled:opacity-50 w-full sm:w-auto"
                >
                  {saveMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> Simpan Silabus</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {previewMapel && (
        <SilabusPreviewModal
          mataPelajaranId={previewMapel.id}
          mapelName={previewMapel.name}
          tingkat={previewMapel.tingkat}
          tahunAjaran={tahunAjaran}
          semester={semester}
          onClose={() => setPreviewMapel(null)}
        />
      )}
    </div>
  );
}
