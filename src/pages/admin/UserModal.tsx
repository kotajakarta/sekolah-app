import React, { useState, useEffect } from 'react';
import { X, Loader2, ShieldCheck, ShieldOff, Key, AlertTriangle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Select from 'react-select';
import apiClient from '../../lib/apiClient';
import { useGetStudents } from '../../features/core_data/hooks/useGetStudents';
import { useToast } from '../../contexts/ToastContext';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: any;
}

// Only mounted when formData.scope === 'WALI', so the (unpaginated, deep-include)
// GET /students request this hook fires only happens when the WALI branch is
// actually visible — not on every UserModal mount.
interface WaliStudentSelectProps {
  studentIds: string[];
  hubungan: string;
  onChangeStudentIds: (ids: string[]) => void;
  onChangeHubungan: (value: string) => void;
}

function WaliStudentSelect({ studentIds, hubungan, onChangeStudentIds, onChangeHubungan }: WaliStudentSelectProps) {
  const { data: studentsData } = useGetStudents();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Santri Terhubung</label>
        <Select
          isMulti
          options={(studentsData ?? []).map((student) => ({
            value: student.id,
            label: `${student.biodata?.fullName ?? 'Tanpa Nama'} — ${student.cabang?.name ?? student.wilayah?.name ?? ''}`.trim(),
          }))}
          value={(studentsData ?? [])
            .filter((student) => studentIds.includes(student.id))
            .map((student) => ({
              value: student.id,
              label: `${student.biodata?.fullName ?? 'Tanpa Nama'} — ${student.cabang?.name ?? student.wilayah?.name ?? ''}`.trim(),
            }))}
          onChange={(selected) => onChangeStudentIds((selected ?? []).map((opt) => opt.value))}
          placeholder="Pilih santri..."
          styles={{
            control: (base) => ({
              ...base,
              borderColor: '#e2e8f0',
              borderRadius: '0.5rem',
              backgroundColor: '#f8fafc',
              boxShadow: 'none',
              '&:hover': { borderColor: '#6366f1' },
              minHeight: '42px',
              fontSize: '14px',
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#eef2ff' : 'white',
              color: state.isSelected ? 'white' : '#1e293b',
              fontSize: '13px',
            }),
          }}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Hubungan dengan Santri</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          value={hubungan}
          onChange={(e) => onChangeHubungan(e.target.value)}
          placeholder="Ayah / Ibu / Wali"
        />
      </div>
    </div>
  );
}

export default function UserModal({ isOpen, onClose, userToEdit }: UserModalProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    operatorName: '',
    scope: 'GLOBAL',
    divisi: 'ALL',
    wilayahId: '',
    cabangId: '',
    studentIds: [] as string[],
    hubungan: '',
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
      setIs2FAEnabled(!!userToEdit.twoFactorEnabled);
      setIsConfirmResetOpen(false);
      setFormData({
        username: userToEdit.username || '',
        password: '',
        operatorName: userToEdit.operatorName || '',
        scope: userToEdit.scope || 'GLOBAL',
        divisi: userToEdit.divisi || 'ALL',
        wilayahId: userToEdit.wilayahId || '',
        cabangId: userToEdit.cabangId || '',
        studentIds: userToEdit.scope === 'WALI'
          ? (userToEdit.waliSantri?.map((w: any) => w.studentId) ?? [])
          : [],
        hubungan: userToEdit.scope === 'WALI'
          ? (userToEdit.waliSantri?.[0]?.hubungan ?? '')
          : '',
      });
    } else {
      setIs2FAEnabled(false);
      setIsConfirmResetOpen(false);
      setFormData({
        username: '',
        password: '',
        operatorName: '',
        scope: 'GLOBAL',
        divisi: 'ALL',
        wilayahId: '',
        cabangId: '',
        studentIds: [],
        hubungan: '',
      });
    }
  }, [userToEdit]);

  const reset2FAMutation = useMutation({
    mutationFn: async () => {
      if (!userToEdit?.id) return;
      const res = await apiClient.post(`/admin/users/${userToEdit.id}/reset-2fa`);
      return res.data;
    },
    onSuccess: () => {
      setIs2FAEnabled(false);
      setIsConfirmResetOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast('success', 'Autentikasi 2FA berhasil dinonaktifkan / di-reset');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menonaktifkan 2FA');
    }
  });

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
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Operator</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              value={formData.operatorName}
              onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
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
                onChange={(e) => {
                  const newScope = e.target.value;
                  setFormData({
                    ...formData,
                    scope: newScope,
                    wilayahId: '',
                    cabangId: '',
                    ...(newScope !== 'WALI' ? { studentIds: [], hubungan: '' } : {}),
                  });
                }}
              >
                <option value="GLOBAL">GLOBAL</option>
                <option value="WILAYAH">WILAYAH</option>
                <option value="CABANG">CABANG</option>
                <option value="WALI">WALI</option>
                <option value="AUDITOR">AUDITOR (Pengawas / Auditor Pusat - Read Only)</option>
              </select>
            </div>
            {formData.scope !== 'WALI' && (
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
            )}
          </div>

          {formData.scope === 'WALI' && (
            <WaliStudentSelect
              studentIds={formData.studentIds}
              hubungan={formData.hubungan}
              onChangeStudentIds={(ids) => setFormData({ ...formData, studentIds: ids })}
              onChangeHubungan={(value) => setFormData({ ...formData, hubungan: value })}
            />
          )}

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

          {/* Status Keamanan 2FA (Jika mode edit user) */}
          {userToEdit && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <label className="block text-sm font-medium text-slate-700">Status Keamanan 2FA</label>
              <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                is2FAEnabled
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    is2FAEnabled ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-200/70 text-slate-500 border-slate-300'
                  }`}>
                    {is2FAEnabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">
                        {is2FAEnabled ? '2FA Aktif (Terproteksi)' : '2FA Belum Aktif'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {is2FAEnabled
                        ? 'Pengguna ini dilindungi Autentikasi 2 Langkah (TOTP).'
                        : 'Akun ini belum mengaktifkan 2FA.'}
                    </p>
                  </div>
                </div>

                {is2FAEnabled && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmResetOpen(true)}
                    disabled={reset2FAMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    {reset2FAMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    <span>Reset / Hapus 2FA</span>
                  </button>
                )}
              </div>

              {/* Inline Confirmation for Reset 2FA */}
              {isConfirmResetOpen && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-900">Konfirmasi Hapus / Reset 2FA</h4>
                      <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                        Apakah Anda yakin ingin menonaktifkan 2FA untuk user <strong>{userToEdit.username}</strong>? User harus melakukan setup 2FA kembali jika ingin mengaktifkannya nanti.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsConfirmResetOpen(false)}
                      className="px-3 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => reset2FAMutation.mutate()}
                      disabled={reset2FAMutation.isPending}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-rose-600 rounded-md hover:bg-rose-700"
                    >
                      {reset2FAMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      Ya, Hapus 2FA
                    </button>
                  </div>
                </div>
              )}
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
