import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useImportTargetKuota, Cabang } from '../hooks/useMasterData';
import { useToast } from '../../../contexts/ToastContext';

interface Props {
  cabangList: Cabang[];
  onClose: () => void;
}

export default function ImportTargetKuotaModal({ cabangList, onClose }: Props) {
  const { showToast } = useToast();
  const importMutation = useImportTargetKuota();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleDownloadTemplate = () => {
    const templateData = cabangList.map((c) => ({
      'Nama Cabang': c.nameGlodemy || c.name,
      'Wilayah': c.wilayah?.name || '-',
      'Kapasitas Cabang': c.kapasitasSantri || 0,
      'Target Hazirlik': c.targetKuota?.targetHazirlik || 0,
      'Target Hafizlik': c.targetKuota?.targetHafizlik || 0,
      'Target Ibtidai': c.targetKuota?.targetIbtidai || 0,
      'Target Ihzari': c.targetKuota?.targetIhzari || 0,
      'Target Tingkat 7': c.targetKuota?.targetTingkat7 || 0,
      'Target Tingkat 8': c.targetKuota?.targetTingkat8 || 0,
      'Target Tingkat 9': c.targetKuota?.targetTingkat9 || 0,
      'Target Tingkat 10': c.targetKuota?.targetTingkat10 || 0,
      'Target Tingkat 11': c.targetKuota?.targetTingkat11 || 0,
      'Target Tingkat 12': c.targetKuota?.targetTingkat12 || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Target Kuota');
    XLSX.writeFile(workbook, 'Template_Target_Kuota_Cabang.xlsx');
    showToast('success', 'Template Excel Target Kuota berhasil diunduh');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setPreviewData(data);
      } catch (err) {
        showToast('error', 'Gagal membaca file Excel');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = () => {
    if (previewData.length === 0) {
      showToast('error', 'Pilih file Excel yang berisi data target kuota');
      return;
    }

    importMutation.mutate(previewData, {
      onSuccess: (res) => {
        showToast('success', `Berhasil meng-import target kuota untuk ${res.count || previewData.length} cabang`);
        onClose();
      },
      onError: (err: any) => {
        showToast('error', err?.response?.data?.message || 'Gagal meng-import target kuota');
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <FileSpreadsheet className="w-4 h-4" /> Import Excel Target Kuota
            </div>
            <h2 className="text-xl font-bold text-slate-900">Upload Data Target Massal</h2>
            <p className="text-xs text-slate-500 mt-0.5">Unggah file Excel .xlsx untuk memperbarui target kuota seluruh cabang sekaligus.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Download Template */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-800">1. Unduh Template Excel</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Gunakan format file yang berisi daftar cabang resmi saat ini.</p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" /> Template XLSX
          </button>
        </div>

        {/* Step 2: Upload File */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-800">2. Unggah File Excel Terisi</p>
          <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20">
            <Upload className="w-8 h-8 text-indigo-500 mb-2" />
            <span className="text-xs font-semibold text-slate-700">
              {selectedFile ? selectedFile.name : 'Klik untuk memilih file Excel (.xlsx / .xls)'}
            </span>
            {previewData.length > 0 && (
              <span className="text-[11px] font-bold text-emerald-600 mt-1">
                Terdeteksi {previewData.length} baris data cabang
              </span>
            )}
            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={previewData.length === 0 || importMutation.isPending}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 py-2 text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Proses Import Excel
          </button>
        </div>
      </div>
    </div>
  );
}
