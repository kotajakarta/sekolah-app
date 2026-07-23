import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
import { Download, Upload, FileUp, Loader2, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../hooks/useAuth';

interface Mapel {
  id: string;
  name: string;
  kodeMapel: string;
  grupMapel: string;
}

interface ErrorRow {
  row: number;
  nik: string;
  message: string;
}

const FIXED_COLUMNS = ['nik', 'nama_siswa', 'tahun_ajaran', 'semester', 'kelas_rombel', 'jenis_grup_daimi'];
const BATCH_SIZE = 250;

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export default function ImportRiwayatNilaiTab() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const isGlobalAdmin = user?.scope === 'GLOBAL';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);

  const { data: mapelList = [] } = useQuery<Mapel[]>({
    queryKey: ['mapel-list'],
    queryFn: async () => {
      const res = await apiClient.get<Mapel[]>('/formal/mapel');
      return res.data;
    }
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [result, setResult] = useState<{ totalRows: number; successRows: number; errorRows: ErrorRow[]; skippedMapelCount: number } | null>(null);

  const templateKeys = () => [...FIXED_COLUMNS, ...mapelList.map(m => m.name)];

  const generateAutoTemplate = () => {
    if (mapelList.length === 0) {
      showToast('error', 'Daftar mata pelajaran belum termuat, coba lagi sesaat lagi.');
      return;
    }
    const keys = templateKeys();
    const templateData = [keys.reduce((acc, key) => ({ ...acc, [key]: '' }), {} as Record<string, string>)];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'Template_Import_Riwayat_Nilai.xlsx');
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await apiClient.get('/formal/erapor/nilai/riwayat-import/template', {
        responseType: 'blob',
        validateStatus: (status) => status === 200 || status === 404
      });
      if (res.status === 200) {
        const url = window.URL.createObjectURL(res.data as Blob);
        const disposition: string = res.headers?.['content-disposition'] || '';
        const match = disposition.match(/filename="?([^"]+)"?/);
        const a = document.createElement('a');
        a.href = url;
        a.download = match ? match[1] : 'Template_Import_Riwayat_Nilai.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // lanjut ke fallback auto-generate di bawah
    }
    generateAutoTemplate();
  };

  const handleUploadTemplateClick = () => templateFileInputRef.current?.click();

  const handleTemplateFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingTemplate(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post('/formal/erapor/nilai/riwayat-import/template', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('success', 'Template custom berhasil diupload. Tombol "Unduh Template" sekarang memakai file ini.');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Gagal mengupload template');
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsProcessing(true);
    setResult(null);
    setProgress(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const expectedKeys = templateKeys().map(normalize);
        const rawData = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(rawData, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // Smart header detection: cari baris yang paling banyak cocok dengan kolom template
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
        let headerRowIndex = 0;
        let bestMatch = 0;
        rawRows.forEach((row, idx) => {
          const normalizedCells = row.map((cell: any) => normalize(String(cell || '')));
          const matchCount = normalizedCells.filter(cell => expectedKeys.includes(cell)).length;
          if (matchCount > bestMatch) {
            bestMatch = matchCount;
            headerRowIndex = idx;
          }
        });

        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '',
          raw: false,
          range: headerRowIndex
        });

        if (jsonData.length === 0) {
          showToast('error', 'File kosong atau format kolom tidak dikenali. Gunakan template yang disediakan.');
          setIsProcessing(false);
          return;
        }

        const totalRows = jsonData.length;
        setProgress({ current: 0, total: totalRows, percent: 0 });

        const accumulated = { totalRows: 0, successRows: 0, errorRows: [] as ErrorRow[], skippedMapelCount: 0 };

        for (let i = 0; i < totalRows; i += BATCH_SIZE) {
          const chunk = jsonData.slice(i, i + BATCH_SIZE);
          try {
            const res = await apiClient.post('/formal/erapor/nilai/riwayat-import', chunk);
            const data = res.data;
            accumulated.totalRows += data.totalRows;
            accumulated.successRows += data.successRows;
            accumulated.skippedMapelCount += data.skippedMapelCount;
            const offsetErrors = (data.errorRows || []).map((er: ErrorRow) => ({ ...er, row: er.row + i }));
            accumulated.errorRows.push(...offsetErrors);
          } catch (err: any) {
            const message = err.response?.data?.message || err.message;
            accumulated.errorRows.push({ row: i + 1, nik: '-', message: `Gagal memproses baris ${i + 1}-${i + chunk.length}: ${message}` });
          }

          const newCurrent = Math.min(i + BATCH_SIZE, totalRows);
          setProgress({ current: newCurrent, total: totalRows, percent: Math.round((newCurrent / totalRows) * 100) });
        }

        setResult(accumulated);
        showToast(
          accumulated.errorRows.length === 0 ? 'success' : 'error',
          `Import selesai: ${accumulated.successRows} berhasil, ${accumulated.errorRows.length} error dari ${totalRows} baris`
        );
      } catch (err) {
        showToast('error', 'Gagal membaca file Excel.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadErrorReport = () => {
    if (!result || result.errorRows.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(
      result.errorRows.map(er => ({ Baris: er.row, NIK: er.nik, Pesan: er.message }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Error');
    XLSX.writeFile(workbook, 'Laporan_Error_Import_Riwayat_Nilai.xlsx');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">Import Massal Riwayat Nilai</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
          Untuk backfill nilai rapor siswa berkelas formal yang belum punya riwayat nilai di periode lampau
          (mis. kelas 7-9 atau 10-12 semester sebelumnya). Siswa dicocokkan lewat NIK. Hanya berlaku untuk
          periode lampau — periode yang sama dengan periode aktif sekarang akan ditolak, gunakan tab
          "Input Nilai Mapel" untuk periode berjalan.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 shadow-sm text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Unduh Template
        </button>

        {isGlobalAdmin && (
          <>
            <input ref={templateFileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleTemplateFileChange} />
            <button
              type="button"
              onClick={handleUploadTemplateClick}
              disabled={isUploadingTemplate}
              title="Khusus admin global - menggantikan template yang dipakai semua cabang"
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 shadow-sm text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {isUploadingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
              Upload Template Sendiri
            </button>
          </>
        )}

        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
        <button
          type="button"
          onClick={handleImportClick}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 px-4 py-2 border border-transparent shadow-sm text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isProcessing ? (
            progress ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {progress.percent}% ({progress.current}/{progress.total})
              </>
            ) : (
              <Loader2 className="w-4 h-4 animate-spin" />
            )
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload & Import Excel
            </>
          )}
        </button>
      </div>
      <p className="text-[11px] text-slate-400 -mt-3">
        {isGlobalAdmin
          ? 'Kalau kamu upload template sendiri (misalnya sudah diatur dropdown/format kolomnya), tombol "Unduh Template" di atas otomatis akan memakai file itu untuk SEMUA cabang, bukan yang dibuat otomatis.'
          : 'Template mengikuti yang sudah diatur oleh admin pusat (kalau ada), atau dibuat otomatis sesuai daftar mata pelajaran terbaru.'}
        {' '}Header kolom cukup mengandung nama kolom yang sama (nik, tahun_ajaran, semester, kelas_rombel, jenis_grup_daimi, dan nama tiap mata pelajaran) — urutan kolom bebas.
      </p>

      {progress && (
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 transition-all duration-300 ease-out" style={{ width: `${progress.percent}%` }} />
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${result.errorRows.length === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            {result.errorRows.length === 0 ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>
              <strong>{result.successRows}</strong> baris berhasil disimpan, <strong>{result.errorRows.length}</strong> baris error dari total <strong>{result.totalRows}</strong> baris.
              {result.skippedMapelCount > 0 && ` ${result.skippedMapelCount} nilai mapel dilewati (nonaktif untuk grup daimi atau nilai tidak valid).`}
            </span>
          </div>

          {result.errorRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Baris Bermasalah</h4>
                <button
                  type="button"
                  onClick={handleDownloadErrorReport}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Unduh Laporan Error
                </button>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-16 text-center">Baris</th>
                      <th className="py-2 px-3 w-36">NIK</th>
                      <th className="py-2 px-3">Pesan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.errorRows.map((er, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-3 text-center text-slate-500">{er.row}</td>
                        <td className="py-1.5 px-3 text-slate-600">{er.nik || '-'}</td>
                        <td className="py-1.5 px-3 text-red-600">{er.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
