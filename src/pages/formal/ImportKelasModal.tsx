import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';

interface ImportKelasModalProps {
  onClose: () => void;
}

export default function ImportKelasModal({ onClose }: ImportKelasModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const response = await apiClient.post('/formal/kelas/import', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      onClose();
      alert('Berhasil mengimport data kelas!');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Gagal mengimport data');
      setIsUploading(false);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError('');
    
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Harap pilih file CSV');
        return;
      }
      
      setFile(selectedFile);
      
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError('Gagal membaca file CSV. Pastikan formatnya benar.');
          } else {
            setPreviewData(results.data.slice(0, 5)); // preview first 5
          }
        }
      });
    }
  };

  const handleImport = () => {
    if (!file) {
      setError('Harap pilih file terlebih dahulu');
      return;
    }

    setIsUploading(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Gagal membaca file CSV');
          setIsUploading(false);
        } else {
          importMutation.mutate(results.data);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>

        <div className="relative inline-block w-full max-w-2xl p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-display font-bold text-slate-800">Import Data Kelas</h3>
              <p className="text-sm text-slate-500 mt-1.5">Upload file CSV untuk menambah/update data kelas</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-slate-400" />
              <div className="mt-4 flex text-sm text-slate-600 justify-center">
                <label className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500">
                  <span>Upload a file</span>
                  <input ref={fileInputRef} type="file" accept=".csv" className="sr-only" onChange={handleFileChange} />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-slate-500 mt-2">CSV file up to 5MB</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {file && (
              <div className="flex items-center p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <FileText className="w-5 h-5 text-blue-500 mr-3" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}

            {previewData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-800 mb-2">Preview Data (5 baris pertama)</h4>
                <div className="bg-slate-50 rounded-2xl border border-slate-200/70 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100 text-xs text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-2 text-left">Nama Kelas</th>
                        <th className="px-4 py-2 text-left">Tingkat</th>
                        <th className="px-4 py-2 text-left">Cabang</th>
                        <th className="px-4 py-2 text-left">Wilayah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {previewData.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">{row.nama_kelas || row.name || '-'}</td>
                          <td className="px-4 py-2">{row.tingkat || '-'}</td>
                          <td className="px-4 py-2">{row.cabang || '-'}</td>
                          <td className="px-4 py-2">{row.wilayah || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500 mt-2 italic">Format Header CSV: nama_kelas, tingkat, is_active, cabang, wilayah</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleImport}
              disabled={!file || isUploading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 inline-flex items-center"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Mengimport...
                </>
              ) : (
                'Import Data'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
