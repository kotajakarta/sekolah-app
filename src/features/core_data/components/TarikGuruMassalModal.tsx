import React, { useState } from 'react';
import { useGetPoolGuru, useTarikMassalGuru } from '../hooks/usePoolGuru';
import { useAuth } from '../../../hooks/useAuth';
import { useGetCabang } from '../hooks/useMasterData';
import { X, Loader2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TarikGuruMassalModalProps {
  onClose: () => void;
}

export default function TarikGuruMassalModal({ onClose }: TarikGuruMassalModalProps) {
  const { user } = useAuth();
  const { data: poolGuru, isLoading: isLoadingPool } = useGetPoolGuru();
  const { data: cabangList, isLoading: loadingCabang } = useGetCabang();
  const { t } = useTranslation();
  
  const tarikMassalMutation = useTarikMassalGuru();
  
  const isCabangUser = user?.scope === 'CABANG';
  const [selectedCabangId, setSelectedCabangId] = useState(isCabangUser ? (user.cabangId || '') : '');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCabang = cabangList?.filter(c => {
    if (user?.scope === 'WILAYAH') return c.wilayahId === user.wilayahId;
    return true;
  }) || [];

  const filteredGuru = poolGuru?.filter(guru => {
    const name = guru.name || '';
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  }) || [];

  const toggleGuruSelection = (id: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (filteredGuru.length === selectedStaffIds.length) {
      setSelectedStaffIds([]); // Deselect all
    } else {
      setSelectedStaffIds(filteredGuru.map(s => s.id));
    }
  };

  const handleTarik = () => {
    if (!selectedCabangId) {
      alert(t('guru.tarik.alert_cabang'));
      return;
    }
    if (selectedStaffIds.length === 0) {
      alert(t('guru.tarik.alert_guru'));
      return;
    }
    
    tarikMassalMutation.mutate({ 
      staffIds: selectedStaffIds, 
      cabangId: selectedCabangId 
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl flex flex-col max-h-[85vh]">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                {t('guru.tarik.title')}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isCabangUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('guru.tarik.cabang_tujuan')}</label>
                  {loadingCabang ? (
                    <div className="flex items-center text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {t('common.loading')}
                    </div>
                  ) : (
                    <select
                      value={selectedCabangId}
                      onChange={(e) => setSelectedCabangId(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
                    >
                      <option value="">{t('guru.tarik.pilih_cabang')}</option>
                      {filteredCabang.map((cabang) => (
                        <option key={cabang.id} value={cabang.id}>
                          {cabang.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              
              {isCabangUser && (
                <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm flex items-center">
                  {t('guru.tarik.info_cabang_saat_ini')}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">{t('guru.tarik.cari')}</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                    placeholder={t('guru.tarik.cari_placeholder')}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {isLoadingPool ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredGuru.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {t('guru.tarik.empty')}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={filteredGuru.length > 0 && selectedStaffIds.length === filteredGuru.length}
                          onChange={selectAll}
                        />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('guru.form.nama').replace('*', '')}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('guru.form.jabatan')}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('guru.tarik.asal')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredGuru.map((guru) => (
                      <tr key={guru.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={selectedStaffIds.includes(guru.id)}
                            onChange={() => toggleGuruSelection(guru.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{guru.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {guru.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {guru.wilayah?.name || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-200">
            <button
              type="button"
              disabled={!selectedCabangId || selectedStaffIds.length === 0 || tarikMassalMutation.isPending}
              onClick={handleTarik}
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50"
            >
              {tarikMassalMutation.isPending ? t('common.loading') : t('guru.tarik.btn_tarik').replace('{count}', selectedStaffIds.length.toString())}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
