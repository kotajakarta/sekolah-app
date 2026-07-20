import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { Calendar, Upload, Users, AlertCircle, FileText, X, Check, ArrowLeft, Loader2, Info, Tag, Download, Image as ImageIcon } from 'lucide-react';

interface Guru {
  id: string;
  name: string;
  position: string;
  cabangId?: string | null;
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
  });

  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  // Fetch list of templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<TemplateKegiatan[]>({
    queryKey: ['template-kegiatan'],
    queryFn: async () => {
      const res = await apiClient.get('/kegiatan/templates');
      return res.data;
    }
  });

  // Fetch Gurus/Staff list for Ketua Panitia selection
  const { data: gurus = [], isLoading: isLoadingGurus } = useQuery<Guru[]>({
    queryKey: ['master-data', 'guru'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/guru');
      return res.data;
    }
  });

  // Filter gurus to only show teachers in the same branch
  const filteredGurus = gurus.filter(g => {
    if (user?.scope === 'CABANG') {
      return g.cabangId === user.cabangId;
    }
    return true;
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

  // Drag and drop handlers for Documents
  const handleDragOverDoc = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingDoc(true);
  };

  const handleDragLeaveDoc = () => {
    setIsDraggingDoc(false);
  };

  const handleDropDoc = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingDoc(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx')
      );
      if (newFiles.length === 0) {
        showToast('error', 'Hanya menerima file dokumen (PDF, DOC, DOCX)');
      }
      setDocFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDocFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeDocFile = (index: number) => {
    setDocFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers for Photos
  const handleDragOverPhoto = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(true);
  };

  const handleDragLeavePhoto = () => {
    setIsDraggingPhoto(false);
  };

  const handleDropPhoto = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      if (newFiles.length === 0) {
        showToast('error', 'Hanya menerima file gambar/foto');
      }
      setPhotoFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotoFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removePhotoFile = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.templateId || !formData.deskripsi || !formData.ketuaPanitiaId) {
      showToast('error', 'Silakan lengkapi form yang wajib diisi.');
      return;
    }

    if (docFiles.length === 0) {
      showToast('error', 'Silakan unggah minimal satu dokumen laporan BAP.');
      return;
    }

    const payload = new FormData();
    payload.append('templateId', formData.templateId);
    payload.append('deskripsi', formData.deskripsi);
    payload.append('ketuaPanitiaId', formData.ketuaPanitiaId);
    
    if (user?.scope === 'CABANG' && user.cabangId) {
      payload.append('cabangId', user.cabangId);
    }

    // Combine doc files and photo files
    docFiles.forEach(file => payload.append('files', file));
    photoFiles.forEach(file => payload.append('files', file));

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
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
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-sm bg-white"
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

        {/* Laporan Deskripsi */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3">Pelaksanaan Kegiatan</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Laporan Pelaksanaan Kegiatan <span className="text-rose-500">*</span></label>
            <textarea
              name="deskripsi"
              rows={6}
              required
              value={formData.deskripsi}
              onChange={handleInputChange}
              placeholder="Tuliskan berita acara pelaksanaan kegiatan cabang selengkap mungkin (rincian acara, jumlah peserta, kendala, hasil, dll)..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-sm font-sans"
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
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Ketua Panitia Cabang (Guru) <span className="text-rose-500">*</span></label>
            <select
              name="ketuaPanitiaId"
              required
              value={formData.ketuaPanitiaId}
              onChange={handleInputChange}
              disabled={isLoadingGurus}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-sm bg-white"
            >
              <option value="">{isLoadingGurus ? 'Memuat guru...' : '-- Pilih Guru Cabang --'}</option>
              {filteredGurus.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.position})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Upload Cards: Split into Documents and Photos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Dokumen BAP */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Dokumen Laporan BAP <span className="text-rose-500">*</span>
              </h3>
              <p className="text-xs text-slate-500 mb-3">Unggah berkas berita acara (PDF, Word). Wajib melampirkan berkas laporan ini.</p>
              
              {/* Template Download Prompt */}
              {selectedTemplate && selectedTemplate.dokumen && selectedTemplate.dokumen.length > 0 ? (
                <div className="mb-4 bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-900 truncate mr-2">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Unduh template: {selectedTemplate.dokumen[0].fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(selectedTemplate.dokumen[0].filePath, selectedTemplate.dokumen[0].fileName)}
                    className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <Download className="w-3 h-3" /> Unduh
                  </button>
                </div>
              ) : null}

              {/* Uploader */}
              <div
                onDragOver={handleDragOverDoc}
                onDragLeave={handleDragLeaveDoc}
                onDrop={handleDropDoc}
                className={`border border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                  isDraggingDoc ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  multiple
                  id="doc-file-input"
                  accept=".pdf,.doc,.docx"
                  onChange={handleDocFileChange}
                  className="hidden"
                />
                <label htmlFor="doc-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-indigo-500" />
                  <span className="text-xs text-slate-600">
                    <span className="text-indigo-600 font-semibold hover:underline">Pilih berkas</span> atau seret kemari
                  </span>
                  <span className="text-[10px] text-slate-400">PDF, DOC, DOCX (Maks 10MB)</span>
                </label>
              </div>
            </div>

            {docFiles.length > 0 && (
              <div className="mt-3 space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Berkas diunggah:</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white divide-y divide-slate-100">
                  {docFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 text-xs">
                      <span className="font-medium text-slate-700 truncate flex-1 mr-2">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeDocFile(idx)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Foto Kegiatan */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-500" />
                Foto Kegiatan
              </h3>
              <p className="text-xs text-slate-500 mb-3">Unggah foto-foto dokumentasi saat pelaksanaan kegiatan berlangsung.</p>

              {/* Uploader */}
              <div
                onDragOver={handleDragOverPhoto}
                onDragLeave={handleDragLeavePhoto}
                onDrop={handleDropPhoto}
                className={`border border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                  isDraggingPhoto ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  multiple
                  id="photo-file-input"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />
                <label htmlFor="photo-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-indigo-500" />
                  <span className="text-xs text-slate-600">
                    <span className="text-indigo-600 font-semibold hover:underline">Pilih foto</span> atau seret kemari
                  </span>
                  <span className="text-[10px] text-slate-400">Format Gambar JPG, PNG (Maks 10MB)</span>
                </label>
              </div>
            </div>

            {photoFiles.length > 0 && (
              <div className="mt-3 space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Foto diunggah:</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white divide-y divide-slate-100">
                  {photoFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 text-xs">
                      <span className="font-medium text-slate-700 truncate flex-1 mr-2">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removePhotoFile(idx)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
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
