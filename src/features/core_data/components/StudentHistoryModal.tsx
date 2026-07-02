import React from 'react';
import { Student } from '../hooks/useGetStudents';
import { X } from 'lucide-react';

interface StudentHistoryModalProps {
  student: Student;
  onClose: () => void;
}

export default function StudentHistoryModal({ student, onClose }: StudentHistoryModalProps) {
  const histories = student.riwayatPendidikan || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Riwayat Pendidikan
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {student.biodata?.fullName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {histories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">Belum ada riwayat pendidikan untuk siswa ini.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <ul role="list" className="-mb-8">
                {histories.map((riwayat, idx) => (
                  <li key={riwayat.id}>
                    <div className="relative pb-8">
                      {idx !== histories.length - 1 ? (
                        <span
                          className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${!riwayat.tanggalKeluar ? 'bg-blue-500' : 'bg-gray-400'}`}>
                            <span className="h-2.5 w-2.5 rounded-full bg-white" />
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium text-gray-900">
                                {riwayat.cabang?.name || 'Cabang Tidak Diketahui'}
                              </span>
                            </p>
                            {riwayat.statusAkhir && (
                              <p className="mt-1 text-sm text-gray-500">
                                Status: <span className="font-medium">{riwayat.statusAkhir}</span>
                              </p>
                            )}
                            {riwayat.catatan && (
                              <p className="mt-1 text-sm text-gray-500 italic">
                                "{riwayat.catatan}"
                              </p>
                            )}
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            <time dateTime={riwayat.tanggalMasuk}>
                              {new Date(riwayat.tanggalMasuk).toLocaleDateString('id-ID')}
                            </time>
                            <span className="mx-1">-</span>
                            {riwayat.tanggalKeluar ? (
                              <time dateTime={riwayat.tanggalKeluar}>
                                {new Date(riwayat.tanggalKeluar).toLocaleDateString('id-ID')}
                              </time>
                            ) : (
                              <span className="font-medium text-green-600">Sekarang</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
