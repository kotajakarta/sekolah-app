import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';

interface ImportUserModalProps {
  onClose: () => void;
}

export default function ImportUserModal({ onClose }: ImportUserModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const { showToast } = useToast();
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const response = await apiClient.post('/admin/users/import', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
      showToast('success', 'Berhasil mengimport data user!');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Gagal mengimport data user');
      setIsUploading(false);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError('');
    
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExt !== 'xlsx' && fileExt !== 'xls') {
        setError('Harap pilih file Excel (.xlsx atau .xls)');
        return;
      }
      
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          setPreviewData(json.slice(0, 5)); // preview first 5
        } catch (err) {
          setError('Gagal membaca file Excel. Pastikan formatnya benar.');
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleImport = () => {
    if (!file) {
      setError('Harap pilih file terlebih dahulu');
      return;
    }

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        if (json.length === 0) {
          setError('File Excel kosong atau tidak memiliki data.');
          setIsUploading(false);
          return;
        }

        importMutation.mutate(json);
      } catch (err) {
        setError('Gagal membaca file Excel.');
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>

        <div className="relative inline-block w-full max-w-2xl p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Import Data User</h3>
              <p className="text-sm text-slate-500 mt-1">Upload file Excel (.xlsx/.xls) untuk menambah user massal</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-slate-400" />
              <div className="mt-4 flex text-sm text-slate-600 justify-center">
                <label className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500">
                  <span>Upload a file</span>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="sr-only" onChange={handleFileChange} />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-slate-500 mt-2">Excel file up to 5MB</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {file && (
              <div className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <FileText className="w-5 h-5 text-indigo-500 mr-3" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}

            {previewData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-2">Preview Data (5 baris pertama)</h4>
                <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100 text-xs text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-2 text-left">Username</th>
                        <th className="px-4 py-2 text-left">Scope</th>
                        <th className="px-4 py-2 text-left">Divisi</th>
                        <th className="px-4 py-2 text-left">Wilayah</th>
                        <th className="px-4 py-2 text-left">Cabang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {previewData.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">{row.Username || row.username || row.User || row.user || '-'}</td>
                          <td className="px-4 py-2">{row.Scope || row.scope || row.Role || row.role || '-'}</td>
                          <td className="px-4 py-2">{row.Divisi || row.divisi || row.Division || row.division || '-'}</td>
                          <td className="px-4 py-2">{row.Wilayah || row.wilayah || row.Region || row.region || '-'}</td>
                          <td className="px-4 py-2">{row.Cabang || row.cabang || row.Branch || row.branch || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isUploading || !file || importMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Mengupload...' : 'Import User'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
