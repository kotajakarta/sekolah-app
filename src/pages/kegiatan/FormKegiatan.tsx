import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { Calendar, Upload, Users, AlertCircle, FileText, X, Check, ArrowLeft, Loader2, Info, Tag, Download, Image as ImageIcon, Edit, CheckCircle, Clock } from 'lucide-react';

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
  tanggalKegiatan?: string;
  waktuKegiatan?: string;
  tujuanKegiatan?: string;
}

export default function FormKegiatan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeView, setActiveView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKegiatan | null>(null);
  const [editingBap, setEditingBap] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    templateId: '',
    deskripsi: '',
    ketuaPanitiaId: '',
    tanggalKegiatan: '',
    waktuKegiatan: '',
    tempatKegiatan: '',
    jumlahPeserta: '',
    ringkasanKegiatan: '',
    kesimpulan: '',
  });

  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  // Fetch list of templates from Pusat
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<TemplateKegiatan[]>({
    queryKey: ['template-kegiatan'],
    queryFn: async () => {
      const res = await apiClient.get('/kegiatan/templates');
      return res.data;
    }
  });

  // Fetch BAPs submitted by this branch
  const { data: baps = [], isLoading: isLoadingBaps } = useQuery<any[]>({
    queryKey: ['kegiatan', 'branch-list'],
    queryFn: async () => {
      const res = await apiClient.get('/kegiatan');
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
      queryClient.invalidateQueries({ queryKey: ['kegiatan', 'branch-list'] });
      setActiveView('LIST');
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal membuat laporan BAP.');
    }
  });

  // Mutation to update Kegiatan BAP
  const updateMutation = useMutation<any, Error, { id: string; data: FormData }>({
    mutationFn: async ({ id, data }) => {
      return apiClient.put(`/kegiatan/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      showToast('success', 'Laporan BAP berhasil diperbarui!');
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
      queryClient.invalidateQueries({ queryKey: ['kegiatan', 'branch-list'] });
      setActiveView('LIST');
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal memperbarui laporan BAP.');
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

  const startCreate = (tmpl: TemplateKegiatan) => {
    setSelectedTemplate(tmpl);
    setEditingBap(null);
    setFormData({
      templateId: tmpl.id,
      deskripsi: '',
      ketuaPanitiaId: '',
      tanggalKegiatan: tmpl.tanggalKegiatan ? new Date(tmpl.tanggalKegiatan).toISOString().split('T')[0] : '',
      waktuKegiatan: tmpl.waktuKegiatan || '',
      tempatKegiatan: '',
      jumlahPeserta: '',
      ringkasanKegiatan: '',
      kesimpulan: '',
    });
    setDocFiles([]);
    setPhotoFiles([]);
    setActiveView('CREATE');
  };

  const startEdit = (tmpl: TemplateKegiatan, bap: any) => {
    setSelectedTemplate(tmpl);
    setEditingBap(bap);
    setFormData({
      templateId: tmpl.id,
      deskripsi: bap.deskripsi || '',
      ketuaPanitiaId: bap.panitia[0]?.staffId || '',
      tanggalKegiatan: bap.tanggalKegiatan ? new Date(bap.tanggalKegiatan).toISOString().split('T')[0] : '',
      waktuKegiatan: bap.waktuKegiatan || '',
      tempatKegiatan: bap.tempatKegiatan || '',
      jumlahPeserta: bap.jumlahPeserta ? String(bap.jumlahPeserta) : '',
      ringkasanKegiatan: bap.ringkasanKegiatan || bap.deskripsi || '',
      kesimpulan: bap.kesimpulan || '',
    });
    setDocFiles([]);
    setPhotoFiles([]);
    setActiveView('EDIT');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.templateId || !formData.tempatKegiatan || !formData.jumlahPeserta || !formData.ringkasanKegiatan || !formData.kesimpulan || !formData.ketuaPanitiaId) {
      showToast('error', 'Silakan lengkapi seluruh field wajib pelaporan.');
      return;
    }

    const payload = new FormData();
    payload.append('templateId', formData.templateId);
    payload.append('deskripsi', formData.ringkasanKegiatan); // Maps to required 'deskripsi' field in DB
    payload.append('ketuaPanitiaId', formData.ketuaPanitiaId);
    if (formData.tanggalKegiatan) {
      payload.append('tanggalKegiatan', formData.tanggalKegiatan);
    }
    if (formData.waktuKegiatan) {
      payload.append('waktuKegiatan', formData.waktuKegiatan);
    }
    payload.append('tempatKegiatan', formData.tempatKegiatan);
    payload.append('jumlahPeserta', formData.jumlahPeserta);
    payload.append('ringkasanKegiatan', formData.ringkasanKegiatan);
    payload.append('kesimpulan', formData.kesimpulan);
    
    if (user?.scope === 'CABANG' && user.cabangId) {
      payload.append('cabangId', user.cabangId);
    }

    docFiles.forEach(file => payload.append('files', file));
    photoFiles.forEach(file => payload.append('files', file));

    if (activeView === 'EDIT' && editingBap) {
      updateMutation.mutate({ id: editingBap.id, data: payload });
    } else {
      if (docFiles.length === 0) {
        showToast('error', 'Silakan unggah minimal satu dokumen laporan BAP.');
        return;
      }
      createMutation.mutate(payload);
    }
  };

  if (activeView === 'LIST') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            Tugas Pelaporan BAP Kegiatan
          </h1>
          <p className="text-sm text-slate-500 mt-1">Daftar kegiatan yang dirilis oleh Pusat dan status penyelesaian pelaporan cabang Anda.</p>
        </div>

        {isLoadingTemplates || isLoadingBaps ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-350 rounded-xl p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Info className="w-8 h-8 mb-2 text-slate-350" />
            <p className="font-semibold text-slate-600">Belum ada template kegiatan dirilis oleh Pusat.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-55/70 font-semibold text-slate-700">
                <tr>
                  <th className="px-6 py-4">Kategori & Nama Kegiatan</th>
                  <th className="px-6 py-4">Batas Waktu (Deadline)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templates.map(tmpl => {
                  const associatedBap = baps.find(b => b.templateId === tmpl.id);
                  const isDone = !!associatedBap;
                  
                  return (
                    <tr key={tmpl.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-650">
                            {tmpl.jenis.nama}
                          </span>
                        </div>
                        <span className="font-bold text-slate-800 block text-sm">{tmpl.judul}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                        {new Date(tmpl.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-250 text-emerald-700">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Sudah Dilaporkan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-250 text-amber-700">
                            <Clock className="w-3.5 h-3.5" />
                            Belum Dilaporkan
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isDone ? (
                          <button
                            onClick={() => startEdit(tmpl, associatedBap)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit BAP
                          </button>
                        ) : (
                          <button
                            onClick={() => startCreate(tmpl)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-755 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Buat BAP
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // CREATE or EDIT View
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => setActiveView('LIST')}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {activeView === 'EDIT' ? 'Edit Laporan BAP Kegiatan' : 'Buat Laporan BAP Kegiatan'}
          </h1>
          <p className="text-sm text-slate-500">
            {activeView === 'EDIT' ? 'Ubah data pelaporan berita acara pelaksanaan cabang Anda.' : 'Laporkan berita acara pelaksanaan berdasarkan pedoman Pusat.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Detail Box */}
        {selectedTemplate && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-wrap gap-2 items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">{selectedTemplate.judul}</h2>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 border border-indigo-150 text-indigo-750">
                  <Tag className="w-3 h-3" />
                  Kategori: {selectedTemplate.jenis.nama}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 border border-rose-150 text-rose-700 font-mono">
                  <Calendar className="w-3 h-3" />
                  Batas: {new Date(selectedTemplate.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Juknis & Petunjuk Pusat:</span>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedTemplate.deskripsi}</p>
            </div>

            {selectedTemplate.dokumen && selectedTemplate.dokumen.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Lampiran Petunjuk dari Pusat:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedTemplate.dokumen.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50/50">
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

        {/* Laporan Pelaksanaan BAP */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3">Detail Pelaksanaan Kegiatan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Nama Kegiatan</label>
              <input
                type="text"
                disabled
                value={selectedTemplate?.judul || ''}
                className="w-full px-3.5 py-2 border border-slate-250 bg-slate-50 rounded-lg text-sm text-slate-600 focus:outline-none cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Tujuan Kegiatan</label>
              <textarea
                disabled
                rows={1}
                value={selectedTemplate?.tujuanKegiatan || 'Tidak ditentukan oleh Pusat'}
                className="w-full px-3.5 py-2 border border-slate-250 bg-slate-50 rounded-lg text-sm text-slate-600 focus:outline-none cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Tanggal Kegiatan <span className="text-rose-500">*</span></label>
              <input
                type="date"
                name="tanggalKegiatan"
                required
                value={formData.tanggalKegiatan}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Waktu Kegiatan <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="waktuKegiatan"
                required
                value={formData.waktuKegiatan}
                onChange={handleInputChange}
                placeholder="Contoh: 09:00 - 12:00"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Tempat Kegiatan <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="tempatKegiatan"
                required
                value={formData.tempatKegiatan}
                onChange={handleInputChange}
                placeholder="Contoh: Aula Utama Asrama Cabang"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Jumlah Peserta <span className="text-rose-500">*</span></label>
              <input
                type="number"
                name="jumlahPeserta"
                required
                value={formData.jumlahPeserta}
                onChange={handleInputChange}
                placeholder="Contoh: 150"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Ringkasan Kegiatan <span className="text-rose-500">*</span></label>
            <textarea
              name="ringkasanKegiatan"
              rows={4}
              required
              value={formData.ringkasanKegiatan}
              onChange={handleInputChange}
              placeholder="Tuliskan ringkasan jalan/pelaksanaan kegiatan cabang..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-sm font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Kesimpulan <span className="text-rose-500">*</span></label>
            <textarea
              name="kesimpulan"
              rows={3}
              required
              value={formData.kesimpulan}
              onChange={handleInputChange}
              placeholder="Tuliskan hasil evaluasi atau kesimpulan akhir dari kegiatan..."
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
                Dokumen Laporan BAP {activeView === 'CREATE' && <span className="text-rose-500">*</span>}
              </h3>
              <p className="text-xs text-slate-500 mb-3">Unggah berkas berita acara (PDF, Word). {activeView === 'EDIT' ? 'Kosongkan jika tidak ingin menambah file baru.' : 'Wajib melampirkan berkas laporan ini.'}</p>
              
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
            onClick={() => setActiveView('LIST')}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-5 py-2 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending || !formData.templateId}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengirim BAP...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {activeView === 'EDIT' ? 'Perbarui Laporan BAP' : 'Kirim Laporan BAP'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
