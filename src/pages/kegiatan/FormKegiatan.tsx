import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { Calendar, Upload, Users, Home, AlertCircle, FileText, X, Check, ArrowLeft, Loader2 } from 'lucide-react';

interface User {
  id: string;
  username: string;
  operatorName: string | null;
}

interface Ruang {
  id: string;
  nama: string;
  tipe: string;
  cabang?: { name: string };
}

export default function FormKegiatan() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    ringkasan: '',
    jenis: 'LAINNYA',
    deadline: '',
    ketuaPanitiaId: '',
  });

  const [selectedAsramas, setSelectedAsramas] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch Users for Ketua Panitia list
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users');
      return res.data;
    }
  });

  // Fetch Rooms to display as target Asrama
  const { data: rooms = [] } = useQuery<Ruang[]>({
    queryKey: ['ruang'],
    queryFn: async () => {
      const res = await apiClient.get('/sarpras/ruang');
      return res.data;
    }
  });

  const asramaList = rooms.filter(r => r.tipe === 'ASRAMA');

  // Mutation to create Kegiatan
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiClient.post('/kegiatan', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      showToast('success', 'Kegiatan berhasil dibuat dan di-broadcast!');
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
      navigate('/dashboard'); // or redirect to kegiatan list
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal membuat kegiatan.');
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAsramaToggle = (id: string) => {
    setSelectedAsramas(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
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
    if (!formData.judul || !formData.deskripsi || !formData.deadline || !formData.ketuaPanitiaId) {
      showToast('error', 'Silakan lengkapi form yang wajib diisi.');
      return;
    }

    const payload = new FormData();
    payload.append('judul', formData.judul);
    payload.append('deskripsi', formData.deskripsi);
    payload.append('ringkasan', formData.ringkasan);
    payload.append('jenis', formData.jenis);
    payload.append('deadline', formData.deadline);
    payload.append('ketuaPanitiaId', formData.ketuaPanitiaId);
    
    if (selectedAsramas.length > 0) {
      payload.append('asramaIds', selectedAsramas.join(','));
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
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Buat Kegiatan & BAP</h1>
          <p className="text-sm text-slate-500">Buat Berita Acara Pelaksanaan kegiatan baru dan kirim notifikasi ke asrama terkait.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3">Informasi Kegiatan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Judul Kegiatan <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="judul"
                required
                value={formData.judul}
                onChange={handleInputChange}
                placeholder="Contoh: Kegiatan Ramadhan Berkah 1447H"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Jenis Kegiatan <span className="text-rose-500">*</span></label>
              <select
                name="jenis"
                value={formData.jenis}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 focus:outline-none text-sm bg-white"
              >
                <option value="HUT">HUT / Milad</option>
                <option value="RAMADHAN">Kegiatan Ramadhan</option>
                <option value="PIKNIK">Piknik / Rihlah</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Batas Waktu / Deadline <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  type="datetime-local"
                  name="deadline"
                  required
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 focus:outline-none text-sm"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Ringkasan Singkat</label>
              <input
                type="text"
                name="ringkasan"
                value={formData.ringkasan}
                onChange={handleInputChange}
                placeholder="Ringkasan 1 kalimat untuk ditampilkan di dashboard..."
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 focus:outline-none text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Deskripsi Lengkap <span className="text-rose-500">*</span></label>
              <textarea
                name="deskripsi"
                rows={4}
                required
                value={formData.deskripsi}
                onChange={handleInputChange}
                placeholder="Tuliskan petunjuk teknis pelaksanaan kegiatan dan poin-poin penting..."
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 focus:outline-none text-sm font-sans"
              />
            </div>
          </div>
        </div>

        {/* Panitia Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Penunjukan Panitia
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Ketua Panitia <span className="text-rose-500">*</span></label>
            <select
              name="ketuaPanitiaId"
              required
              value={formData.ketuaPanitiaId}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 focus:outline-none text-sm bg-white"
            >
              <option value="">-- Pilih Ketua Panitia --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.operatorName ? `${u.operatorName} (${u.username})` : u.username}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Target Asrama Broadcast */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Home className="w-5 h-5 text-indigo-500" />
            Target Broadcast Asrama
          </h2>
          <p className="text-xs text-slate-500">Pilih asrama-asrama yang wajib menerima sosialisasi dan mengkonfirmasi berita acara ini.</p>
          
          {asramaList.length === 0 ? (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Tidak ditemukan data Asrama pada master data Ruang. Pastikan ada Ruang dengan tipe "ASRAMA".
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {asramaList.map(a => (
                <label
                  key={a.id}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    selectedAsramas.includes(a.id)
                      ? 'border-indigo-650 bg-indigo-50/20 text-indigo-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-650'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAsramas.includes(a.id)}
                    onChange={() => handleAsramaToggle(a.id)}
                    className="mt-0.5 rounded text-indigo-650 focus:ring-indigo-500/20 w-4 h-4"
                  />
                  <div>
                    <p className="font-semibold">{a.nama}</p>
                    {a.cabang && <p className="text-[10px] text-slate-400 font-normal">{a.cabang.name}</p>}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* File Upload (Drag and Drop) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-500" />
            Dokumen & Foto Kegiatan
          </h2>
          <p className="text-xs text-slate-500">Unggah berkas panduan/BAP (PDF, Word) dan dokumen pendukung lainnya.</p>

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
            onClick={() => navigate(-1)}
            disabled={createMutation.isPending}
            className="px-5 py-2 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Publish & Broadcast
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
