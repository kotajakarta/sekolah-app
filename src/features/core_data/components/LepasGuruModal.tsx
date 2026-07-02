import React from 'react';
import { Guru, useLepasGuru } from '../hooks/usePoolGuru';
import { X } from 'lucide-react';

interface LepasGuruModalProps {
  guru: Guru;
  onClose: () => void;
}

export default function LepasGuruModal({ guru, onClose }: LepasGuruModalProps) {
  const lepasGuruMutation = useLepasGuru();

  const handleLepas = () => {
    lepasGuruMutation.mutate({ staffId: guru.id }, {
      onSuccess: () => onClose()
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Lepas Guru ke Pool
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Guru <span className="font-medium text-gray-900">{guru.name}</span> akan dilepas ke pool.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              disabled={lepasGuruMutation.isPending}
              onClick={handleLepas}
              className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 sm:ml-3 sm:w-auto disabled:opacity-50"
            >
              {lepasGuruMutation.isPending ? 'Memproses...' : 'Lepas Guru'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
