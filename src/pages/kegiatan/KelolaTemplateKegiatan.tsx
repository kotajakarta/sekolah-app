import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { FileText, Plus, Trash2, Edit, Save, X, Loader2, AlertCircle, Calendar, Tag, Info, Upload, Download } from 'lucide-react';

interface JenisKegiatan {
  id: string;
  nama: string;
}

interface DokumenTemplate {
  id: string;
  filePath: string;
  fileName: string;
  fileType: string;
}

interface TemplateKegiatan {
  id: string;
  judul: string;
  deskripsi: string;
  deadline: string;
  jenisId: string;
  jenis: JenisKegiatan;
  dokumen: DokumenTemplate[];
  createdAt: string;
}

export default function KelolaTemplateKegiatan() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    deadline: '',
    jenisId: '',
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch list of templates
  const { data: templates = [], isLoading, isError } = useQuery<TemplateKegiatan[]>({
    queryKey: ['template-kegiatan'],
    queryFn: async () => {
      const res = await apiClient.get('/kegiatan/templates');
      return res.data;
    }
  });

  // Fetch list of jenis kegiatan for dropdown selection
  const { data: jenisList = [] } = useQuery<JenisKegiatan[]>({
    queryKey: ['jenis-kegiatan'],
    queryFn: async () => {
      const res = await apiClient.get('/kegiatan/jenis');
      return res.data;
    }
  });

  // Mutation to create template
  const createMutation = useMutation<any, Error, FormData>({
    mutationFn: async (data: FormData) => {
      return apiClient.post('/kegiatan/templates', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      showToast('success', 'Template kegiatan berhasil dibuat!');
      setFormData({ judul: '', deskripsi: '', deadline: '', jenisId: '' });
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ['template-kegiatan'] });
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal membuat template.');
    }
  });

  // Mutation to update template
  const updateMutation = useMutation<any, Error, { id: string; data: FormData }>({
    mutationFn: async ({ id, data }) => {
      return apiClient.put(`/kegiatan/templates/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      showToast('success', 'Template kegiatan berhasil diperbarui!');
      setEditingId(null);
      setFiles([]);
      setFormData({ judul: '', deskripsi: '', deadline: '', jenisId: '' });
      queryClient.invalidateQueries({ queryKey: ['template-kegiatan'] });
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal memperbarui template.');
    }
  });

  // Mutation to delete template
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/kegiatan/templates/${id}`);
    },
    onSuccess: () => {
      showToast('success', 'Template kegiatan berhasil dihapus!');
      queryClient.invalidateQueries({ queryKey: ['template-kegiatan'] });
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal menghapus template.');
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
    if (!formData.judul || !formData.deskripsi || !formData.deadline || !formData.jenisId) {
      showToast('error', 'Lengkapi seluruh field wajib untuk membuat template.');
      return;
    }

    const payload = new FormData();
    payload.append('judul', formData.judul);
    payload.append('deskripsi', formData.deskripsi);
    payload.append('deadline', formData.deadline);
    payload.append('jenisId', formData.jenisId);
    files.forEach(file => {
      payload.append('files', file);
    });

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const startEdit = (template: TemplateKegiatan) => {
    setEditingId(template.id);
    setFormData({
      judul: template.judul,
      deskripsi: template.deskripsi,
      deadline: new Date(template.deadline).toISOString().slice(0, 16),
      jenisId: template.jenisId,
    });
    setFiles([]);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFiles([]);
    setFormData({ judul: '', deskripsi: '', deadline: '', jenisId: '' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus template kegiatan ini?')) {
      deleteMutation.mutate(id);
    }
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-500" />
          Kelola Template Kegiatan Sekolah
        </h1>
        <p className="text-sm text-slate-500 mt-1">Buat template pelaporan kegiatan lengkap dengan dokumen pedoman yang wajib dilaporkan Cabang.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Add / Edit */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit space-y-4">
          <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2">
            {editingId ? 'Edit Template Kegiatan' : 'Buat Template Kegiatan'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Judul / Nama Kegiatan <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="judul"
                required
                value={formData.judul}
                onChange={handleInputChange}
                placeholder="Contoh: Kegiatan HUT RI Ke-81"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Jenis / Kategori <span className="text-rose-500">*</span></label>
              <select
                name="jenisId"
                required
                value={formData.jenisId}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-sm bg-white"
              >
                <option value="">-- Pilih Jenis Kegiatan --</option>
                {jenisList.map(j => (
                  <option key={j.id} value={j.id}>{j.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Batas Waktu Laporan / Deadline <span className="text-rose-500">*</span></label>
              <input
                type="datetime-local"
                name="deadline"
                required
                value={formData.deadline}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Deskripsi Lengkap / Petunjuk Pelaksanaan <span className="text-rose-500">*</span></label>
              <textarea
                name="deskripsi"
                rows={4}
                required
                value={formData.deskripsi}
                onChange={handleInputChange}
                placeholder="Tuliskan juknis, kriteria atau rincian laporan yang diharapkan dari cabang..."
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-sm font-sans"
              />
            </div>

            {/* Document Uploader for Template */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Unggah Lampiran Juknis / Foto Acuan</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  multiple
                  id="template-file-input"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="template-file-input" className="cursor-pointer flex flex-col items-center gap-1">
                  <Upload className="w-5 h-5 text-indigo-500" />
                  <span className="text-xs text-slate-600"><span className="text-indigo-600 font-semibold hover:underline">Pilih file</span> atau seret kemari</span>
                </label>
              </div>

              {files.length > 0 && (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 text-[11px]">
                      <span className="text-slate-700 font-medium truncate flex-1 mr-2">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              {editingId ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Simpan
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Buat Template
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Cards */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : isError ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-6 text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" /> Gagal memuat template kegiatan.
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <Info className="w-8 h-8 mb-2 text-slate-355" />
              <p className="font-medium text-slate-500">Belum ada template kegiatan yang terdaftar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {templates.map(tmpl => (
                <div key={tmpl.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 relative">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 border border-indigo-150 text-indigo-700">
                          <Tag className="w-3 h-3" />
                          {tmpl.jenis.nama}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Batas: {new Date(tmpl.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-800">{tmpl.judul}</h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(tmpl)}
                        disabled={editingId === tmpl.id}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-30 cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tmpl.id)}
                        className="p-1.5 hover:bg-rose-50 rounded text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Hapus Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Juknis Pusat:</span>
                    <p className="text-xs text-slate-650 bg-slate-50 border border-slate-100 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                      {tmpl.deskripsi}
                    </p>
                  </div>

                  {tmpl.dokumen && tmpl.dokumen.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lampiran Pusat ({tmpl.dokumen.length}):</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {tmpl.dokumen.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                            <span className="text-[11px] text-slate-700 truncate font-medium flex-1 mr-2">{doc.fileName}</span>
                            <button
                              onClick={() => handleDownload(doc.filePath, doc.fileName)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
