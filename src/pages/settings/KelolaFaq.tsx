import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2, Plus, Edit2, Trash2, HelpCircle, AlertTriangle, ArrowLeft, Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Faq {
  id: string;
  question: string;
  answer: string;
  createdAt?: string;
}

export default function KelolaFaq() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [formData, setFormData] = useState({ question: '', answer: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);

  // Fetch FAQ List
  const { data: faqs = [], isLoading, isError } = useQuery<Faq[]>({
    queryKey: ['faqs'],
    queryFn: async () => {
      const res = await apiClient.get('/faq');
      return res.data;
    }
  });

  // Filtered List
  const filteredFaqs = useMemo(() => {
    if (!searchQuery) return faqs;
    return faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [faqs, searchQuery]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingFaq) {
        return apiClient.put(`/faq/${editingFaq.id}`, data);
      }
      return apiClient.post('/faq', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setIsModalOpen(false);
      setEditingFaq(null);
      setFormData({ question: '', answer: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/faq/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setIsDeleteModalOpen(false);
    }
  });

  const handleOpenAdd = () => {
    setEditingFaq(null);
    setFormData({ question: '', answer: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setFormData({ question: faq.question, answer: faq.answer });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setFaqToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="font-sans text-slate-800 pb-12">
      {/* Header */}
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-indigo-500" />
              Kelola Tanya Jawab (FAQ)
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Atur dan kelola daftar tanya jawab yang tampil di halaman Pusat Bantuan utama bagi santri dan staf.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/faq"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-350 border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Lihat Halaman FAQ
            </Link>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah FAQ
            </button>
          </div>
        </div>
      </div>

      {/* Search Filter Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-5">
        <div className="max-w-md relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari pertanyaan atau jawaban..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main FAQ Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : isError ? (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-700">
          <AlertTriangle className="w-5 h-5" /> Gagal memuat data FAQ. Silakan muat ulang halaman.
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          Tidak ada data FAQ yang ditemukan.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-center w-12">No</th>
                  <th className="px-5 py-3 w-1/3">Pertanyaan</th>
                  <th className="px-5 py-3">Jawaban</th>
                  <th className="px-5 py-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredFaqs.map((faq, idx) => {
                  const truncateAnswer = faq.answer.length > 150 
                    ? faq.answer.substring(0, 150) + '...'
                    : faq.answer;
                  return (
                    <tr key={faq.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-3.5 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800 leading-snug">{faq.question}</td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-pre-wrap leading-relaxed">{truncateAnswer}</td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleOpenEdit(faq)}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                            title="Edit FAQ"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(faq.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Hapus FAQ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">
                {editingFaq ? 'Ubah Informasi FAQ' : 'Tambah Tanya Jawab (FAQ)'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-200/50 cursor-pointer border-none bg-transparent"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pertanyaan / Topik Bantuan *</label>
                  <input
                    type="text"
                    required
                    value={formData.question}
                    onChange={e => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Contoh: Bagaimana cara mengganti foto profil santri?"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jawaban Lengkap *</label>
                  <textarea
                    required
                    value={formData.answer}
                    onChange={e => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Tuliskan panduan langkah demi langkah atau informasi lengkap..."
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus Tanya Jawab?</h3>
              <p className="text-sm text-slate-500">
                Apakah Anda yakin ingin menghapus FAQ ini? Pertanyaan ini tidak akan ditampilkan lagi di Pusat Bantuan. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (faqToDelete) deleteMutation.mutate(faqToDelete);
                }}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
