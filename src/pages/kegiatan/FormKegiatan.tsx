import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { Calendar, Upload, Users, Home, AlertCircle, FileText, X, Check, ArrowLeft, Loader2, Info, Tag, Download } from 'lucide-react';

interface User {
  id: string;
  username: string;
  operatorName: string | null;
  cabangId: string | null;
}

interface Ruang {
  id: string;
  nama: string;
  tipe: string;
  cabangId: string;
  cabang?: { name: string };
}

interface TemplateKegiatan {
  id: string;
  judul: string;
  deskripsi: string;
  deadline: string;
  jenis: { nama: string };
  dokumen: { id: string; filePath: string; fileName: string; fileType: string }[];
}

export default function FormKegiatan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    templateId: '',
    deskripsi: '',
    ketuaPanitiaId: '',
    asramaId: '',
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch list of templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<TemplateKegiatan[]>({
    queryKey: ['template-kegiatan'],
    queryFn: async () => {
      const res = await apiClient.get('/kegiatan/templates');
      return res.data;
    }
  });

  // Fetch Users for Ketua Panitia list
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users');
      return res.data;
    }
  });

  // Filter users to only show users in the same branch
  const filteredUsers = users.filter(u => {
    if (user?.scope === 'CABANG') {
      return u.cabangId === user.cabangId;
    }
    return true;
  });

  // Fetch Rooms to display as target Asrama
  const { data: rooms = [] } = useQuery<Ruang[]>({
    queryKey: ['ruang'],
    queryFn: async () => {
      const res = await apiClient.get('/sarpras/ruang');
      return res.data;
    }
  });

  // Filter rooms to only show Asrama in the same branch
  const asramaList = rooms.filter(r => {
    const isAsrama = r.tipe === 'ASRAMA';
    if (user?.scope === 'CABANG') {
      return isAsrama && r.cabangId === user.cabangId;
    }
    return isAsrama;
  });

  // Get current selected template info
  const selectedTemplate = templates.find(t => t.id === formData.templateId);

  // Mutation to create Kegiatan BAP
  const createMutation = useMutation<any, Error, FormData>({
    mutationFn: async (data: FormData) => {
      return apiClient.post('/kegiatan', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      showToast('success', 'Laporan BAP berhasil dibuat dan dikirim ke Pusat!');
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
      navigate('/dashboard/kegiatan');
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal membuat laporan BAP.');
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDownload = (filePath: string, fileName: string) => {
    const url = `${apiClient.defaults.baseURL || ''}${filePath}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.templateId || !formData.deskripsi || !formData.ketuaPanitiaId) {
      showToast('error', 'Silakan lengkapi form yang wajib diisi.');
      return;
    }

    const payload = new FormData();
    payload.append('templateId', formData.templateId);
    payload.append('deskripsi', formData.deskripsi);
    payload.append('ketuaPanitiaId', formData.ketuaPanitiaId);
    
    if (formData.asramaId) {
      payload.append('asramaId', formData.asramaId);
    }
    
    if (user?.scope === 'CABANG' && user.cabangId) {
      payload.append('cabangId', user.cabangId);
    }

    files.forEach(file => {
      payload.append('files', file);
    });

    createMutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard/kegiatan')}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Buat Laporan BAP Kegiatan</h1>
          <p className="text-sm text-slate-500">Laporkan Berita Acara Pelaksanaan kegiatan baru cabang Anda berdasarkan template dari Pusat.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Template */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3">Pilih Kegiatan</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Pilih Template Kegiatan <span className="text-rose-500">*</span></label>
            <select
              name="templateId"
              required
              value={formData.templateId}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 focus:outline-none text-sm bg-white"
            >
              <option value="">-- Pilih Template Kegiatan --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.judul} ({t.jenis.nama})</option>
              ))}
            </select>
          </div>

          {selectedTemplate && (
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-5 mt-4 space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100/50 border border-indigo-200 text-indigo-700">
                    <Tag className="w-3 h-3" />
                    Kategori: {selectedTemplate.jenis.nama}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 border border-rose-100 text-rose-700">
                    <Calendar className="w-3 h-3" />
                    Deadline Laporan: {new Date(selectedTemplate.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Juknis & Petunjuk Pusat:</span>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedTemplate.deskripsi}</p>
              </div>

              {selectedTemplate.dokumen && selectedTemplate.dokumen.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-indigo-100/50">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Lampiran Petunjuk dari Pusat:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedTemplate.dokumen.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg border border-indigo-100/50 bg-white">
                        <span className="text-xs text-slate-700 truncate font-medium flex-1 mr-2">{doc.fileName}</span>
                        <button
                          type="button"
                          onClick={() => handleDownload(doc.filePath, doc.fileName)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 shrink-0"
                        >
                          <Download className="w-4 h-4 text-indigo-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3">Laporan Pelaksanaan Cabang</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Deskripsi Pelaksanaan / BAP Cabang <span className="text-rose-500">*</span></label>
            <textarea
              name="deskripsi"
              rows={6}
              required
              value={formData.deskripsi}
              onChange={handleInputChange}
              placeholder="Tuliskan berita acara pelaksanaan kegiatan cabang selengkap mungkin (rincian acara, jumlah peserta, kendala, hasil, dll)..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 focus:outline-none text-sm font-sans"
            />
          </div>
        </div>

        {/* Panitia Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Penanggung Jawab / Ketua Panitia
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Ketua Panitia Cabang <span className="text-rose-500">*</span></label>
            <select
              name="ketuaPanitiaId"
              required
              value={formData.ketuaPanitiaId}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 focus:outline-none text-sm bg-white"
            >
              <option value="">-- Pilih Ketua Panitia --</option>
              {filteredUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.operatorName ? `${u.operatorName} (${u.username})` : u.username}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Target Asrama (Optional) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Home className="w-5 h-5 text-indigo-500" />
            Asrama Terkait (Opsional)
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Pilih Asrama</label>
            <select
              name="asramaId"
              value={formData.asramaId}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 focus:outline-none text-sm bg-white"
            >
              <option value="">-- Tidak Berhubungan Dengan Asrama --</option>
              {asramaList.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nama} {a.cabang ? `(${a.cabang.name})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* File Upload (Drag and Drop) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-500" />
            Dokumen BAP & Foto Pendukung
          </h2>
          <p className="text-xs text-slate-500">Unggah berkas BAP (PDF, Word) dan dokumentasi foto kegiatan cabang.</p>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging
                ? 'border-indigo-600 bg-indigo-50/10'
                : 'border-slate-300 bg-slate-50/30 hover:bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              multiple
              id="file-input"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-650">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="text-indigo-650 font-semibold text-sm hover:underline">Pilih file</span> atau seret dan letakkan di sini
                <p className="text-[10px] text-slate-400 mt-1">Mendukung PDF, Word, JPG, PNG (Maks 10MB per file)</p>
              </div>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">File terpilih ({files.length}):</span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-slate-700 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard/kegiatan')}
            disabled={createMutation.isPending}
            className="px-5 py-2 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || !formData.templateId}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-650 hover:bg-indigo-750 text-white shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengirim BAP...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Kirim Laporan BAP
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
