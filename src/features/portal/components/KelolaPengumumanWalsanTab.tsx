import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Building,
  Landmark,
  ExternalLink,
  Link2,
  Loader2,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import DOMPurify from 'dompurify';

interface LinkItem {
  title?: string;
  url: string;
}

interface PengumumanWalsanItem {
  id: string;
  title: string;
  content: string;
  links?: LinkItem[];
  scope: 'GLOBAL' | 'CABANG' | string;
  cabangId?: string | null;
  cabang?: { id: string; name: string } | null;
  createdBy?: { id: string; operatorName?: string; username: string } | null;
  isActive: boolean;
  createdAt: string;
}

export default function KelolaPengumumanWalsanTab() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PengumumanWalsanItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<'GLOBAL' | 'CABANG'>('GLOBAL');
  const [cabangId, setCabangId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Fetch announcements
  const { data: list = [], isLoading } = useQuery<PengumumanWalsanItem[]>({
    queryKey: ['admin-pengumuman-walsan'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/pengumuman-walsan');
      return res.data;
    },
  });

  // Fetch Cabang list for GLOBAL admin dropdown
  const { data: cabangList = [] } = useQuery<any[]>({
    queryKey: ['master-cabang-list'],
    queryFn: async () => {
      const res = await apiClient.get('/master/cabang');
      return res.data;
    },
    enabled: user?.scope === 'GLOBAL',
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setContent('');
    setScope(user?.scope === 'CABANG' ? 'CABANG' : 'GLOBAL');
    setCabangId(user?.scope === 'CABANG' ? (user.cabangId || '') : '');
    setIsActive(true);
    setLinks([]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: PengumumanWalsanItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setScope(item.scope as any);
    setCabangId(item.cabangId || '');
    setIsActive(item.isActive);
    setLinks(item.links || []);
    setIsModalOpen(true);
  };

  const addLink = () => {
    if (!newLinkUrl.trim()) return;
    setLinks([...links, { title: newLinkTitle.trim() || newLinkUrl.trim(), url: newLinkUrl.trim() }]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const removeLink = (idx: number) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        scope,
        cabangId: scope === 'CABANG' ? (cabangId || user?.cabangId || null) : null,
        isActive,
        links,
      };

      if (editingItem) {
        const res = await apiClient.put(`/admin/pengumuman-walsan/${editingItem.id}`, payload);
        return res.data;
      } else {
        const res = await apiClient.post('/admin/pengumuman-walsan', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pengumuman-walsan'] });
      queryClient.invalidateQueries({ queryKey: ['portal', 'pengumuman'] });
      showToast('success', editingItem ? 'Pengumuman berhasil diperbarui' : 'Pengumuman berhasil dipublikasikan');
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan pengumuman');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/admin/pengumuman-walsan/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pengumuman-walsan'] });
      queryClient.invalidateQueries({ queryKey: ['portal', 'pengumuman'] });
      showToast('success', 'Pengumuman telah dihapus');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menghapus pengumuman');
    }
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-600" /> Kelola Pengumuman Khusus Wali Santri
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Publikasikan pengumuman, pengumuman agenda, dan surat edaran yang akan tampil di aplikasi Portal Wali Santri.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Buat Pengumuman Baru
        </button>
      </div>

      {/* List Announcements */}
      {isLoading ? (
        <div className="p-10 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Memuat daftar pengumuman...
        </div>
      ) : list.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 rounded-3xl border border-slate-200/60 space-y-2">
          <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-600">Belum ada pengumuman khusus wali santri.</p>
          <p className="text-slate-400 text-[11px]">Klik tombol "Buat Pengumuman Baru" untuk mempublikasikan informasi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {list.map((item) => {
            const isPusat = item.scope === 'GLOBAL';
            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all p-5 sm:p-6 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isPusat ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2.5 py-0.5 rounded-md">
                          <Building className="w-3 h-3" /> Seluruh Walsan (Pusat)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-md">
                          <Landmark className="w-3 h-3" /> Cabang: {item.cabang?.name || 'Pesantren'}
                        </span>
                      )}

                      {item.isActive ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Aktif Tayang
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          Draft / Nonaktif
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900">{item.title}</h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
                      title="Edit Pengumuman"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Yakin ingin menghapus pengumuman "${item.title}"?`)) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                      title="Hapus Pengumuman"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div
                  className="text-xs text-slate-600 bg-slate-50/60 p-4 rounded-2xl border border-slate-100 line-clamp-3 prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }}
                />

                {item.links && item.links.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Tautan:</span>
                    {item.links.map((l, idx) => (
                      <a
                        key={idx}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-semibold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100"
                      >
                        <Link2 className="w-3 h-3" /> {l.title || l.url}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL FORM ADD / EDIT ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingItem ? 'Edit Pengumuman Walsan' : 'Buat Pengumuman Khusus Walsan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tentukan target sasaran wali santri dan isi informasi pengumuman.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Judul Pengumuman <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pemberitahuan Libur Akhir Semester & Kedatangan Santri"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600"
                />
              </div>

              {/* Target Cakupan (Jika Admin Pusat) */}
              {user?.scope === 'GLOBAL' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Target Cakupan Walsan
                    </label>
                    <select
                      value={scope}
                      onChange={(e) => setScope(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="GLOBAL">Seluruh Wali Santri (Pusat / Semua Cabang)</option>
                      <option value="CABANG">Khusus Cabang Tertentu</option>
                    </select>
                  </div>

                  {scope === 'CABANG' && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Pilih Cabang Pesantren
                      </label>
                      <select
                        value={cabangId}
                        onChange={(e) => setCabangId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 cursor-pointer"
                      >
                        <option value="">-- Pilih Cabang --</option>
                        {cabangList.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Isi / Uraian Pengumuman <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan isi pengumuman secara jelas untuk wali santri..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 leading-relaxed"
                />
              </div>

              {/* Lampiran Tautan */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Tautan Terkait / Dokumen Pendukung (Opsional)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    placeholder="Judul Tautan (misal: Download PDF Surat)"
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="url"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="URL (https://...)"
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={addLink}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                  >
                    + Tambah
                  </button>
                </div>

                {links.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {links.map((l, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-800">{l.title || l.url}</span>
                        <button
                          type="button"
                          onClick={() => removeLink(i)}
                          className="text-rose-500 hover:text-rose-700 font-bold px-2 py-0.5"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggle Aktif */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <p className="text-xs font-bold text-slate-800">Status Publikasi</p>
                  <p className="text-[11px] text-slate-500">Jika aktif, pengumuman akan langsung tampil di portal wali santri.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={saveMutation.isPending || !title.trim() || !content.trim()}
                onClick={() => saveMutation.mutate()}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Simpan & Publikasikan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
