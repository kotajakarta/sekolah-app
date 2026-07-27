import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { BookMarked, Loader2, Plus, Trash2, Save, Info } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface Mapel {
  id: string;
  name: string;
  kodeMapel: string;
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-indigo-600" />
          Kelola Silabus
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">Susun Bab/Section dan tanggal target diajar per Mata Pelajaran &amp; Tingkat.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Mata Pelajaran</label>
          {loadingMapel ? (
            <div className="text-slate-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
          ) : (
            <select
              value={selectedMapel}
              onChange={e => setSelectedMapel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
            >
              <option value="">-- Pilih Mapel --</option>
              {(mapelList || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Tingkat</label>
          <select
            value={selectedTingkat}
            onChange={e => setSelectedTingkat(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
          >
            <option value="">-- Pilih Tingkat --</option>
            {TINGKAT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Tahun Ajaran</label>
          <select
            value={tahunAjaran}
            onChange={e => setTahunAjaran(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
          >
            {TAHUN_AJARAN_OPTIONS.map(ta => <option key={ta} value={ta}>{ta}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Semester</label>
          <select
            value={semester}
            onChange={e => setSemester(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
          >
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      </div>

      {!isReady ? (
        <div className="bg-slate-50 border border-dashed border-slate-300/80 rounded-xl p-12 text-center text-slate-400 flex flex-col items-center justify-center">
          <Info className="w-8 h-8 mb-2 text-slate-300" />
          <p className="font-medium text-slate-600">Pilih Mata Pelajaran dan Tingkat untuk mulai menyusun silabus.</p>
        </div>
      ) : loadingSilabus ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex justify-center items-center shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest w-16">No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Bab</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Section / Sub-Bab</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest w-48">Tanggal Target Diajar</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest w-16">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2.5 text-sm text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-4 py-2.5">
                      <input
                        type="text"
                        value={item.bab}
                        onChange={e => updateItem(idx, { bab: e.target.value })}
                        placeholder="Bab 1"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/30"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="text"
                        value={item.section}
                        onChange={e => updateItem(idx, { section: e.target.value })}
                        placeholder="1.1 Pengenalan..."
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/30"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="date"
                        value={item.tanggalTarget}
                        onChange={e => updateItem(idx, { tanggalTarget: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/30"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => removeRow(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <button
              onClick={addRow}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Baris
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto"
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
