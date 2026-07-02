import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: any;
}

export default function UserModal({ isOpen, onClose, userToEdit }: UserModalProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    scope: 'GLOBAL',
    divisi: 'ALL',
    wilayahId: '',
    cabangId: '',
  });

  const { data: wilayahData } = useQuery({
    queryKey: ['master-data', 'wilayah'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/wilayah');
      return res.data;
    }
  });

  const { data: cabangData } = useQuery({
    queryKey: ['master-data', 'cabang'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/cabang');
      return res.data;
    }
  });

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        username: userToEdit.username || '',
        password: '',
        scope: userToEdit.scope || 'GLOBAL',
        divisi: userToEdit.divisi || 'ALL',
        wilayahId: userToEdit.wilayahId || '',
        cabangId: userToEdit.cabangId || '',
      });
    } else {
      setFormData({
        username: '',
        password: '',
        scope: 'GLOBAL',
        divisi: 'ALL',
        wilayahId: '',
        cabangId: '',
      });
    }
  }, [userToEdit]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: any = { ...data };
      if (userToEdit && !payload.password) {
        delete payload.password;
      }
      if (userToEdit) {
        return apiClient.put(`/admin/users/${userToEdit.id}`, payload);
      }
      return apiClient.post('/admin/users', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            {userToEdit ? 'Edit User' : 'Tambah User'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password {userToEdit && '(Biarkan kosong jika tidak ingin mengubah)'}
            </label>
            <input
              type="password"
              required={!userToEdit}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scope *</label>
              <select
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value, wilayahId: '', cabangId: '' })}
              >
                <option value="GLOBAL">GLOBAL</option>
                <option value="WILAYAH">WILAYAH</option>
                <option value="CABANG">CABANG</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Divisi *</label>
              <select
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                value={formData.divisi}
                onChange={(e) => setFormData({ ...formData, divisi: e.target.value })}
              >
                <option value="ALL">ALL</option>
                <option value="FORMAL">FORMAL</option>
                <option value="PESANTREN">PESANTREN</option>
              </select>
            </div>
          </div>

          {(formData.scope === 'WILAYAH' || formData.scope === 'CABANG') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Wilayah *</label>
              <select
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                value={formData.wilayahId}
                onChange={(e) => setFormData({ ...formData, wilayahId: e.target.value, cabangId: '' })}
              >
                <option value="">Pilih Wilayah</option>
                {(Array.isArray(wilayahData) ? wilayahData : []).map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}

          {formData.scope === 'CABANG' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cabang *</label>
              <select
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                value={formData.cabangId}
                onChange={(e) => setFormData({ ...formData, cabangId: e.target.value })}
              >
                <option value="">Pilih Cabang</option>
                {(Array.isArray(cabangData) ? cabangData : [])
                  .filter((c: any) => c.wilayahId === formData.wilayahId)
                  .map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
