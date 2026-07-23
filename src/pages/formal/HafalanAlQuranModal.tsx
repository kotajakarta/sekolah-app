import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { X, Save, BookOpen } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface HafalanAlQuranModalProps {
  studentId: string;
  kelasId: string;
  fullName: string;
  nis: string;
  kelasName: string;
  wilayahName?: string;
  tahunAjaran: string;
  semester: string;
  onClose: () => void;
}

interface HafalanData {
  awalPutaran: number | null;
  awalJuz: number | null;
  targetPutaran: number | null;
  targetJuz: number | null;
  akhirPutaran: number | null;
  akhirJuz: number | null;
}

const EMPTY_FORM: HafalanData = {
  awalPutaran: null,
  awalJuz: null,
  targetPutaran: null,
  targetJuz: null,
  akhirPutaran: null,
  akhirJuz: null,
};

// Logika: jumlah hafalan (dalam juz desimal) = ((akhir putaran * 30) + akhir juz - 30) / 20
// Contoh: putaran 12, juz 25 -> (12*30 + 25 - 30)/20 = 17.75 -> 17 juz, 15 halaman (0.75 * 20)
function calculateJumlahHafalan(akhirPutaran: number | null, akhirJuz: number | null) {
  if (akhirPutaran === null || akhirJuz === null || isNaN(akhirPutaran) || isNaN(akhirJuz)) {
    return { jumlahJuz: null as number | null, jumlahHalaman: null as number | null };
  }
  const total = (akhirPutaran * 30 + akhirJuz - 30) / 20;
  const jumlahJuz = Math.floor(total);
  const jumlahHalaman = Math.round((total - jumlahJuz) * 20);
  return { jumlahJuz, jumlahHalaman };
}

export default function HafalanAlQuranModal({
  studentId, kelasId, fullName, nis, kelasName, wilayahName, tahunAjaran, semester, onClose
}: HafalanAlQuranModalProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [form, setForm] = useState<HafalanData>(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['hafalan-al-quran', studentId, tahunAjaran, semester],
    queryFn: async () => {
      const res = await apiClient.get(`/formal/erapor/hafalan/${studentId}`, {
        params: { tahunAjaran, semester }
      });
      return res.data;
    },
    enabled: !!studentId
  });

  useEffect(() => {
    if (data) {
      setForm({
        awalPutaran: data.awalPutaran ?? null,
        awalJuz: data.awalJuz ?? null,
        targetPutaran: data.targetPutaran ?? null,
        targetJuz: data.targetJuz ?? null,
        akhirPutaran: data.akhirPutaran ?? null,
        akhirJuz: data.akhirJuz ?? null,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/formal/erapor/hafalan', {
        studentId,
        kelasId,
        tahunAjaran,
        semester,
        ...form
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hafalan-al-quran', studentId, tahunAjaran, semester] });
      showToast('success', 'Data hafalan Al-Qur\'an berhasil disimpan');
      onClose();
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menyimpan data hafalan');
    }
  });

  const { jumlahJuz, jumlahHalaman } = calculateJumlahHafalan(form.akhirPutaran, form.akhirJuz);

  const numberField = (label: string, key: keyof HafalanData) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type="number"
        value={form[key] ?? ''}
        onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value === '' ? null : Number(e.target.value) }))}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-600 text-white">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-base font-bold">Input/Edit Pencapaian Hafalan Al-Quran</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-slate-100 text-sm">
            <div className="space-y-1">
              <p><span className="font-bold">Nama:</span> {fullName}</p>
              <p><span className="font-bold">NIS:</span> {nis || '-'}</p>
              <p><span className="font-bold">Kelas:</span> {kelasName}{wilayahName ? ` | Wilayah: ${wilayahName}` : ''}</p>
            </div>
            <div className="sm:text-right">
              <p className="font-bold">Periode Aktif:</p>
              <p className="text-slate-600">Semester {semester === 'Genap' ? '2' : '1'}, TA {tahunAjaran}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-sm text-slate-500">Memuat data hafalan...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-blue-700 border-b border-slate-100 pb-1.5">Awal Semester &amp; Target</h4>
                {numberField('Awal Putaran', 'awalPutaran')}
                {numberField('Awal Juz', 'awalJuz')}
                <div className="pt-2 space-y-4">
                  {numberField('Target Putaran', 'targetPutaran')}
                  {numberField('Target Juz', 'targetJuz')}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-emerald-700 border-b border-slate-100 pb-1.5">Akhir Semester</h4>
                {numberField('Akhir Putaran', 'akhirPutaran')}
                {numberField('Akhir Juz', 'akhirJuz')}

                <div className="pt-2">
                  <h5 className="text-xs font-bold text-emerald-700 mb-2">Total Jumlah Hafalan</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Juz</label>
                      <input
                        type="text"
                        readOnly
                        value={jumlahJuz ?? ''}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Halaman</label>
                      <input
                        type="text"
                        readOnly
                        value={jumlahHalaman ?? ''}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Data Hafalan'}
          </button>
        </div>
      </div>
    </div>
  );
}
