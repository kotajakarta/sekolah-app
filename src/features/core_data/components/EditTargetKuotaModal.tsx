import React, { useState } from 'react';
import { X, Target, Save, Loader2, Award, GraduationCap } from 'lucide-react';
import { Cabang, useUpdateTargetKuota, TargetKuota } from '../hooks/useMasterData';
import { useToast } from '../../../contexts/ToastContext';

interface Props {
  cabang: Cabang;
  onClose: () => void;
}

export default function EditTargetKuotaModal({ cabang, onClose }: Props) {
  const { showToast } = useToast();
  const updateMutation = useUpdateTargetKuota();

  const current = cabang.targetKuota || {
    targetHazirlik: 0,
    targetHafizlik: 0,
    targetIbtidai: 0,
    targetIhzari: 0,
    targetTingkat7: 0,
    targetTingkat8: 0,
    targetTingkat9: 0,
    targetTingkat10: 0,
    targetTingkat11: 0,
    targetTingkat12: 0,
  };

  const [formData, setFormData] = useState<TargetKuota>({
    targetHazirlik: current.targetHazirlik || 0,
    targetHafizlik: current.targetHafizlik || 0,
    targetIbtidai: current.targetIbtidai || 0,
    targetIhzari: current.targetIhzari || 0,
    targetTingkat7: current.targetTingkat7 || 0,
    targetTingkat8: current.targetTingkat8 || 0,
    targetTingkat9: current.targetTingkat9 || 0,
    targetTingkat10: current.targetTingkat10 || 0,
    targetTingkat11: current.targetTingkat11 || 0,
    targetTingkat12: current.targetTingkat12 || 0,
  });

  const handleChange = (field: keyof TargetKuota, value: string) => {
    const num = parseInt(value, 10);
    setFormData((prev) => ({
      ...prev,
      [field]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      { cabangId: cabang.id, data: formData },
      {
        onSuccess: () => {
          showToast('success', `Target kuota cabang ${cabang.name} berhasil diperbarui`);
          onClose();
        },
        onError: (err: any) => {
          showToast('error', err?.response?.data?.message || 'Gagal memperbarui target kuota');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Target className="w-4 h-4" /> Kelola Target Kuota Santri
            </div>
            <h2 className="text-xl font-bold text-slate-900">{cabang.nameGlodemy || cabang.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{cabang.wilayah?.name ? `Wilayah: ${cabang.wilayah.name}` : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target per Grup Daimi */}
          <div>
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Award className="w-4 h-4" /> Target per Grup Daimi (Pesantren)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Hazirlik</label>
                <input
                  type="number"
                  min="0"
                  value={formData.targetHazirlik}
                  onChange={(e) => handleChange('targetHazirlik', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Hafizlik</label>
                <input
                  type="number"
                  min="0"
                  value={formData.targetHafizlik}
                  onChange={(e) => handleChange('targetHafizlik', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Ibtidai</label>
                <input
                  type="number"
                  min="0"
                  value={formData.targetIbtidai}
                  onChange={(e) => handleChange('targetIbtidai', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Ihzari</label>
                <input
                  type="number"
                  min="0"
                  value={formData.targetIhzari}
                  onChange={(e) => handleChange('targetIhzari', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Target per Tingkat Formal */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <GraduationCap className="w-4 h-4" /> Target per Tingkat Formal (Sekolah)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Tingkat 7 (SMP/MTs)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.targetTingkat7}
                  onChange={(e) => handleChange('targetTingkat7', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Tingkat 8 (SMP/MTs)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.targetTingkat8}
                  onChange={(e) => handleChange('targetTingkat8', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Tingkat 9 (SMP/MTs)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.targetTingkat9}
                  onChange={(e) => handleChange('targetTingkat9', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Tingkat 10 (SMA/MA)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.targetTingkat10}
                  onChange={(e) => handleChange('targetTingkat10', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Tingkat 11 (SMA/MA)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.targetTingkat11}
                  onChange={(e) => handleChange('targetTingkat11', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Tingkat 12 (SMA/MA)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.targetTingkat12}
                  onChange={(e) => handleChange('targetTingkat12', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 py-2 text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Target Kuota
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
