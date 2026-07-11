import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useCreateRiwayatKelas, useUpdateRiwayatKelas, RiwayatKelasFormal } from '../hooks/useRiwayatKelas';
import apiClient from '../../../lib/apiClient';

interface FormRiwayatKelasModalProps {
  studentId: string;
  initialData?: RiwayatKelasFormal;
  onClose: () => void;
}

export default function FormRiwayatKelasModal({ studentId, initialData, onClose }: FormRiwayatKelasModalProps) {
  const createMutation = useCreateRiwayatKelas();
  const updateMutation = useUpdateRiwayatKelas();
  
  const [kelasOptions, setKelasOptions] = useState<{id: string, name: string}[]>([]);
  const [staffOptions, setStaffOptions] = useState<{id: string, name: string}[]>([]);

  const [formData, setFormData] = useState({
    kelasId: initialData?.kelasId || '',
    tahunAjaran: initialData?.tahunAjaran || '',
    semester: initialData?.semester || 'GANJIL',
    statusAkhir: initialData?.statusAkhir || 'NAIK_KELAS',
    waliKelasId: initialData?.waliKelasId || '',
    catatan: initialData?.catatan || '',
  });

  useEffect(() => {
    // Fetch options
    apiClient.get('/formal/kelas').then(res => setKelasOptions(res.data)).catch(console.error);
    apiClient.get('/master-data/guru').then(res => setStaffOptions(res.data)).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData) {
      updateMutation.mutate({
        id: initialData.id,
        studentId,
        data: formData
      }, {
        onSuccess: onClose
      });
    } else {
      createMutation.mutate({
        ...formData,
        studentId
      }, {
        onSuccess: onClose
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">
            {initialData ? 'Edit Riwayat Kelas' : 'Tambah Riwayat Kelas'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
              <select
                name="kelasId"
                value={formData.kelasId}
                onChange={handleChange}
                required
                className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasOptions.map(k => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  name="tahunAjaran"
                  placeholder="2024/2025"
                  value={formData.tahunAjaran}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="GANJIL">Ganjil</option>
                  <option value="GENAP">Genap</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status Akhir</label>
                <select
                  name="statusAkhir"
                  value={formData.statusAkhir}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="NAIK_KELAS">Naik Kelas</option>
                  <option value="TINGGAL_KELAS">Tinggal Kelas</option>
                  <option value="LULUS">Lulus</option>
                  <option value="PINDAH">Pindah / Mutasi</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wali Kelas (Opsional)</label>
                <select
                  name="waliKelasId"
                  value={formData.waliKelasId}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Kosong --</option>
                  {staffOptions.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
              <textarea
                name="catatan"
                rows={3}
                value={formData.catatan}
                onChange={handleChange}
                placeholder="Catatan prestasi atau evaluasi..."
                className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
