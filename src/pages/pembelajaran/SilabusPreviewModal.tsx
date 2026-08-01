import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2, AlertCircle, X, BookOpen } from 'lucide-react';

interface SilabusItem {
  id: string;
  bab: string;
  urutanBab: number;
  section: string;
  urutanSection: number;
  tanggalTarget: string | null;
}

interface Props {
  mataPelajaranId: string;
  mapelName: string;
  tingkat: string;
  tahunAjaran: string;
  semester: string;
  onClose: () => void;
}

const formatTanggal = (raw: string | null) => {
  if (!raw) return '-';
  return new Date(raw).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function SilabusPreviewModal({ mataPelajaranId, mapelName, tingkat, tahunAjaran, semester, onClose }: Props) {
  const { data, isLoading, isError } = useQuery<SilabusItem[]>({
    queryKey: ['silabus', mataPelajaranId, tingkat, tahunAjaran, semester],
    queryFn: async () => (await apiClient.get('/pembelajaran/silabus', {
      params: { mataPelajaranId, tingkat, tahunAjaran, semester }
    })).data
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-800 shrink-0" /> {mapelName}
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Tingkat {tingkat} &middot; {tahunAjaran} &middot; Semester {semester}
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
            </div>
          ) : isError || !data ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-center flex items-center justify-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" /> Gagal memuat data silabus.
            </div>
          ) : data.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-sm text-gray-400">
              Silabus untuk mapel ini belum diisi.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-left">
                    <th className="px-3 py-2 w-10 text-center">No</th>
                    <th className="px-3 py-2">Bab</th>
                    <th className="px-3 py-2">Section / Sub-Bab</th>
                    <th className="px-3 py-2 w-32">Tanggal Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {data.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-center font-medium text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2 font-semibold text-gray-800">{item.bab}</td>
                      <td className="px-3 py-2 text-gray-700">{item.section}</td>
                      <td className="px-3 py-2 text-gray-500">{formatTanggal(item.tanggalTarget)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
