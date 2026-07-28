import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import apiClient from '../../lib/apiClient';
import { Loader2, Plus, Trash2, Save, Info, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface Mapel {
  id: string;
  name: string;
  kodeMapel: string;
  aktifPembelajaran: boolean;
}

interface SilabusItem {
  id?: string;
  bab: string;
  urutanBab: number;
  section: string;
  urutanSection: number;
  tanggalTarget: string;
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

  const { data: mapelList, isLoading: loadingMapel } = useQuery<Mapel[]>({
    queryKey: ['mapel'],
    queryFn: async () => (await apiClient.get('/formal/mapel')).data
  });

  const isReady = !!selectedMapel && !!selectedTingkat && !!tahunAjaran && !!semester;

  const { data: fetchedSilabus, isLoading: loadingSilabus } = useQuery<SilabusItem[]>({
    queryKey: ['silabus', selectedMapel, selectedTingkat, tahunAjaran, semester],
    queryFn: async () => {
      const res = await apiClient.get('/pembelajaran/silabus', {
        params: { mataPelajaranId: selectedMapel, tingkat: selectedTingkat, tahunAjaran, semester }
      });
      return res.data;
    },
    enabled: isReady
  });

  const [items, setItems] = useState<SilabusItem[]>([]);

  useEffect(() => {
    if (fetchedSilabus) {
      setItems(fetchedSilabus.length > 0
        ? fetchedSilabus.map(s => ({ ...s, tanggalTarget: s.tanggalTarget.slice(0, 10) }))
        : [emptyItem(1, 1)]
      );
    }
  }, [fetchedSilabus]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/pembelajaran/silabus/bulk', {
        mataPelajaranId: selectedMapel,
        tingkat: selectedTingkat,
        tahunAjaran,
        semester,
        items: items.filter(i => i.bab.trim() && i.section.trim() && i.tanggalTarget)
      });
    },
    onSuccess: () => {
      showToast('success', 'Silabus berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['silabus', selectedMapel, selectedTingkat, tahunAjaran, semester] });
      // Menambah/menghapus section mengubah daftar materi & pembagi persentase di modul lain.
      queryClient.invalidateQueries({ queryKey: ['pelaksanaan-silabus'] });
      queryClient.invalidateQueries({ queryKey: ['pembelajaran-ringkasan'] });
      queryClient.invalidateQueries({ queryKey: ['laporan-pembelajaran'] });
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menyimpan silabus');
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

  const mapelName = (mapelList || []).find(m => m.id === selectedMapel)?.name || 'Mapel';
  const exportFileName = () => `Silabus_${mapelName}_${selectedTingkat}_${tahunAjaran.replace('/', '-')}_${semester}.xlsx`.replace(/\s+/g, '_');

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      { Bab: 'Bab 1', Section: '1.1 Pengenalan', 'Tanggal Target': '2026-07-11' },
      { Bab: 'Bab 1', Section: '1.2 Lanjutan', 'Tanggal Target': '2026-07-18' }
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
      exportable.map(i => ({ Bab: i.bab, Section: i.section, 'Tanggal Target': i.tanggalTarget }))
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

          const tanggalTarget = parseTanggal(row[tanggalKey || 'Tanggal Target']);
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
        <p className="text-xs text-slate-500">Susun Bab/Section dan tanggal target diajar per Mata Pelajaran &amp; Tingkat.</p>
        <div className="flex flex-wrap items-center gap-2">
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
            disabled={!isReady}
            title={!isReady ? 'Pilih Mapel, Tingkat, Tahun Ajaran, dan Semester dahulu' : 'Import dari Excel'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs font-semibold rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Import Excel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!isReady || items.length === 0}
            title={!isReady ? 'Pilih Mapel, Tingkat, Tahun Ajaran, dan Semester dahulu' : 'Export ke Excel'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs font-semibold rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mata Pelajaran</label>
          {loadingMapel ? (
            <div className="text-gray-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
          ) : (
            <select
              value={selectedMapel}
              onChange={e => setSelectedMapel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
            >
              <option value="">-- Pilih Mapel --</option>
              {(mapelList || []).filter(m => m.aktifPembelajaran).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tingkat</label>
          <select
            value={selectedTingkat}
            onChange={e => setSelectedTingkat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
          >
            <option value="">-- Pilih Tingkat --</option>
            {TINGKAT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tahun Ajaran</label>
          <select
            value={tahunAjaran}
            onChange={e => setTahunAjaran(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
          >
            {TAHUN_AJARAN_OPTIONS.map(ta => <option key={ta} value={ta}>{ta}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Semester</label>
          <select
            value={semester}
            onChange={e => setSemester(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
          >
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      </div>

      {!isReady ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 flex flex-col items-center justify-center">
          <Info className="w-6 h-6 mb-1.5 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">Pilih Mata Pelajaran dan Tingkat untuk mulai menyusun silabus.</p>
        </div>
      ) : loadingSilabus ? (
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
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-44">Tanggal Target Diajar</th>
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
  );
}
