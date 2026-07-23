import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { X, Printer } from 'lucide-react';
import RaporCetakDocument from './RaporCetakDocument';

interface RaporCetakModalProps {
  studentId: string;
  tahunAjaran: string;
  semester: string;
  autoPrint?: boolean;
  onClose: () => void;
  onPrinted?: () => void;
}

export default function RaporCetakModal({ studentId, tahunAjaran, semester, autoPrint, onClose, onPrinted }: RaporCetakModalProps) {
  const { data: cetakData, isLoading } = useQuery<any>({
    queryKey: ['erapor-cetak', studentId, tahunAjaran, semester],
    queryFn: async () => {
      const res = await apiClient.get(`/formal/erapor/cetak/${studentId}`, {
        params: { tahunAjaran, semester }
      });
      return res.data;
    },
    enabled: !!studentId
  });

  const hasAutoPrinted = useRef(false);

  useEffect(() => {
    if (autoPrint && cetakData && !hasAutoPrinted.current) {
      hasAutoPrinted.current = true;
      const timer = setTimeout(() => {
        window.print();
        onPrinted?.();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, cetakData, onPrinted]);

  const handleManualPrint = () => {
    window.print();
    onPrinted?.();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Pratinjau Rapor Muadalah</h3>
            <div className="flex items-center gap-2">
              {cetakData && (
                <button
                  onClick={handleManualPrint}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Cetak
                </button>
              )}
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {isLoading ? (
              <div className="text-center py-12 text-sm text-slate-500">Memuat data Rapor Muadalah...</div>
            ) : !cetakData ? (
              <div className="text-center py-12 text-sm text-slate-500">Data Rapor tidak ditemukan.</div>
            ) : (
              <RaporCetakDocument cetakData={cetakData} />
            )}
          </div>
        </div>
      </div>

      {/* Versi cetak: hanya tampil saat print, supaya chrome dashboard tidak ikut tercetak */}
      {cetakData && (
        <div className="hidden print:block">
          <RaporCetakDocument cetakData={cetakData} />
        </div>
      )}
    </>
  );
}
