import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2, Plus, Trash2, Save, Info } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface Mapel {
  id: string;
  name: string;
  kodeMapel: string;
  aktifPembelajaran: boolean;
}

interface SilabusItem {
  id?: string;
  bab: string;
  urutanBab: number;
  section: string;
  urutanSection: number;
  tanggalTarget: string;
}

const TINGKAT_OPTIONS = ['Non Muadalah', '7', '8', '9', '10', '11', '12'];
const TAHUN_AJARAN_OPTIONS = ['2025/2026', '2026/2027', '2027/2028'];

const emptyItem = (urutanBab: number, urutanSection: number): SilabusItem => ({
  bab: '', urutanBab, section: '', urutanSection, tanggalTarget: ''
});

export default function KelolaSilabus() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedMapel, setSelectedMapel] = useState('');
  const [selectedTingkat, setSelectedTingkat] = useState('');

  const { data: pengaturanAkademik } = useQuery({
    queryKey: ['pengaturan-akademik'],
    queryFn: async () => (await apiClient.get('/pengaturan/akademik')).data
  });

  const [tahunAjaran, setTahunAjaran] = useState('');
  const [semester, setSemester] = useState('Ganjil');

  useEffect(() => {
    if (pengaturanAkademik && !tahunAjaran) {
      setTahunAjaran(pengaturanAkademik.tahunAjaran || '');
      setSemester(pengaturanAkademik.semesterAktif || 'Ganjil');
    }
  }, [pengaturanAkademik]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: mapelList, isLoading: loadingMapel } = useQuery<Mapel[]>({
    queryKey: ['mapel'],
    queryFn: async () => (await apiClient.get('/formal/mapel')).data
  });

  const isReady = !!selectedMapel && !!selectedTingkat && !!tahunAjaran && !!semester;

  const { data: fetchedSilabus, isLoading: loadingSilabus } = useQuery<SilabusItem[]>({
    queryKey: ['silabus', selectedMapel, selectedTingkat, tahunAjaran, semester],
    queryFn: async () => {
      const res = await apiClient.get('/pembelajaran/silabus', {
        params: { mataPelajaranId: selectedMapel, tingkat: selectedTingkat, tahunAjaran, semester }
      });
      return res.data;
    },
    enabled: isReady
  });

  const [items, setItems] = useState<SilabusItem[]>([]);

  useEffect(() => {
    if (fetchedSilabus) {
      setItems(fetchedSilabus.length > 0
        ? fetchedSilabus.map(s => ({ ...s, tanggalTarget: s.tanggalTarget.slice(0, 10) }))
        : [emptyItem(1, 1)]
      );
    }
  }, [fetchedSilabus]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/pembelajaran/silabus/bulk', {
        mataPelajaranId: selectedMapel,
        tingkat: selectedTingkat,
        tahunAjaran,
        semester,
        items: items.filter(i => i.bab.trim() && i.section.trim() && i.tanggalTarget)
      });
    },
    onSuccess: () => {
      showToast('success', 'Silabus berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['silabus', selectedMapel, selectedTingkat, tahunAjaran, semester] });
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menyimpan silabus');
    }
  });

  const updateItem = (idx: number, patch: Partial<SilabusItem>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const addRow = () => {
    const last = items[items.length - 1];
    setItems(prev => [...prev, emptyItem(last?.urutanBab || 1, (last?.urutanSection || 0) + 1)]);
  };

  const removeRow = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Susun Bab/Section dan tanggal target diajar per Mata Pelajaran &amp; Tingkat.</p>

      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mata Pelajaran</label>
          {loadingMapel ? (
            <div className="text-gray-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
          ) : (
            <select
              value={selectedMapel}
              onChange={e => setSelectedMapel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
            >
              <option value="">-- Pilih Mapel --</option>
              {(mapelList || []).filter(m => m.aktifPembelajaran).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tingkat</label>
          <select
            value={selectedTingkat}
            onChange={e => setSelectedTingkat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
          >
            <option value="">-- Pilih Tingkat --</option>
            {TINGKAT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tahun Ajaran</label>
          <select
            value={tahunAjaran}
            onChange={e => setTahunAjaran(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
          >
            {TAHUN_AJARAN_OPTIONS.map(ta => <option key={ta} value={ta}>{ta}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Semester</label>
          <select
            value={semester}
            onChange={e => setSemester(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
          >
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      </div>

      {!isReady ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 flex flex-col items-center justify-center">
          <Info className="w-6 h-6 mb-1.5 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">Pilih Mata Pelajaran dan Tingkat untuk mulai menyusun silabus.</p>
        </div>
      ) : loadingSilabus ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-12">No</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Bab</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Section / Sub-Bab</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-44">Tanggal Target Diajar</th>
                  <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-12">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-1.5 text-sm text-gray-400 font-medium">{idx + 1}</td>
                    <td className="px-3 py-1.5">
                      <input
                        type="text"
                        value={item.bab}
                        onChange={e => updateItem(idx, { bab: e.target.value })}
                        placeholder="Bab 1"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="text"
                        value={item.section}
                        onChange={e => updateItem(idx, { section: e.target.value })}
                        placeholder="1.1 Pengenalan..."
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="date"
                        value={item.tanggalTarget}
                        onChange={e => updateItem(idx, { tanggalTarget: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                      />
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button
                        onClick={() => removeRow(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-gray-100">
            <button
              onClick={addRow}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-800 border border-dashed border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Baris
            </button>
          </div>

          <div className="px-3 py-2.5 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded text-white bg-blue-800 hover:bg-blue-900 transition-colors disabled:opacity-50 w-full sm:w-auto"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Simpan Silabus</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
