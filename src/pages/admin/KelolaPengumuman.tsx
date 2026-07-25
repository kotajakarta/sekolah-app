import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Plus, Edit2, Trash2, Loader2, Link as LinkIcon, PlusCircle, X } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

interface LinkItem {
  title?: string;
  group?: string;
  description?: string;
  url: string;
  username?: string;
  password?: string;
}

interface Pengumuman {
  id: string;
  title: string;
  content: string;
  links: LinkItem[];
  isActive: boolean;
  showPopup: boolean;
  createdAt: string;
}

export default function KelolaPengumuman() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Pengumuman | null>(null);
  
  const [formData, setFormData] = useState({ title: '', content: '', links: [] as LinkItem[], isActive: true, showPopup: false });
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: list, isLoading } = useQuery<Pengumuman[]>({
    queryKey: ['pengumuman'],
    queryFn: async () => {
      const res = await apiClient.get('/pengaturan/pengumuman');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiClient.post('/pengaturan/pengumuman', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pengumuman'] }); setIsModalOpen(false); }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => apiClient.put(`/pengaturan/pengumuman/${data.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pengumuman'] }); setIsModalOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/pengaturan/pengumuman/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pengumuman'] }); setIsConfirmOpen(false); }
  });

  const openAdd = () => {
    setEditingData(null);
    setFormData({ title: '', content: '', links: [], isActive: true, showPopup: false });
    setIsModalOpen(true);
  };

  const openEdit = (item: Pengumuman) => {
    setEditingData(item);
    setFormData({ title: item.title, content: item.content, links: item.links || [], isActive: item.isActive, showPopup: item.showPopup ?? false });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingData) updateMutation.mutate({ id: editingData.id, ...formData });
    else createMutation.mutate(formData);
  };

  const addLink = () => setFormData(prev => ({ ...prev, links: [...prev.links, { title: '', group: '', description: '', url: '', username: '', password: '' }] }));
  
  const updateLink = (index: number, field: keyof LinkItem, value: string) => {
    const newLinks = [...formData.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData(prev => ({ ...prev, links: newLinks }));
  };

  const removeLink = (index: number) => {
    setFormData(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Kelola Pengumuman</h1>
          <p className="text-sm text-slate-500 mt-1.5">Manajemen pengumuman dan tautan terkait pendidikan.</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> Tambah Pengumuman
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div> : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Judul</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Pop-up Login</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Tanggal</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list?.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{item.title}</div>
                    <div className="text-sm text-slate-500 line-clamp-1">{item.content}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.showPopup ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Ya</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">Tidak</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button onClick={() => openEdit(item)} className="inline-flex items-center px-2 py-1 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 text-xs font-medium">
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                    </button>
                    <button onClick={() => { setDeleteId(item.id); setIsConfirmOpen(true); }} className="inline-flex items-center px-2 py-1 text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 text-xs font-medium">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {list?.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Tidak ada pengumuman.</td></tr>}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">{editingData ? 'Edit Pengumuman' : 'Tambah Pengumuman'}</h3>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Judul Pengumuman</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Isi Pengumuman</label>
                  <div className="bg-white">
                    <ReactQuill 
                      theme="snow" 
                      value={formData.content} 
                      onChange={(val) => setFormData({...formData, content: val})} 
                      className="h-64 mb-12"
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          ['link', 'clean']
                        ]
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="h-4 w-4" />
                  <label htmlFor="isActive" className="ml-2 text-sm text-slate-700">Aktif (Tampilkan di halaman pengumuman)</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="showPopup" checked={formData.showPopup} onChange={e => setFormData({...formData, showPopup: e.target.checked})} className="h-4 w-4 accent-blue-600" />
                  <label htmlFor="showPopup" className="ml-2 text-sm text-slate-700">Tampilkan sebagai <span className="font-semibold text-blue-700">Pop-up saat Login</span></label>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">Tautan Terkait (Opsional)</label>
                    <button type="button" onClick={addLink} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center">
                      <PlusCircle className="w-4 h-4 mr-1" /> Tambah Link
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.links.map((link, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border rounded-lg relative">
                        <button type="button" onClick={() => removeLink(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <input type="text" placeholder="Grup (misal: EMIS)" value={link.group} onChange={e => updateLink(idx, 'group', e.target.value)} className="w-full px-2 py-1 text-sm border rounded" />
                          </div>
                          <div>
                            <input type="text" placeholder="Judul Tautan" value={link.title} onChange={e => updateLink(idx, 'title', e.target.value)} required className="w-full px-2 py-1 text-sm border rounded" />
                          </div>
                          <div className="sm:col-span-2">
                            <input type="url" placeholder="URL Tautan (http://...)" value={link.url} onChange={e => updateLink(idx, 'url', e.target.value)} required className="w-full px-2 py-1 text-sm border rounded" />
                          </div>
                          <div className="sm:col-span-2">
                            <input type="text" placeholder="Deskripsi Tautan (Opsional)" value={link.description} onChange={e => updateLink(idx, 'description', e.target.value)} className="w-full px-2 py-1 text-sm border rounded" />
                          </div>
                          <div>
                            <input type="text" placeholder="Username (Opsional)" value={link.username} onChange={e => updateLink(idx, 'username', e.target.value)} className="w-full px-2 py-1 text-sm border rounded" />
                          </div>
                          <div>
                            <input type="text" placeholder="Password (Opsional)" value={link.password} onChange={e => updateLink(idx, 'password', e.target.value)} className="w-full px-2 py-1 text-sm border rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                    {formData.links.length === 0 && <p className="text-xs text-slate-400 italic">Belum ada tautan ditambahkan.</p>}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-100 text-sm font-medium">Batal</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={() => { if(deleteId) deleteMutation.mutate(deleteId); }} title="Hapus Pengumuman" message="Yakin ingin menghapus pengumuman ini?" />
    </div>
  );
}
