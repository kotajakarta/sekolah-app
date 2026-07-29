import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { UserCheck, Loader2, Save, AlertCircle, CheckCircle, Search, Info } from 'lucide-react';
import Pagination from '../../components/Pagination';

interface Program {
  id: string;
  name: string;
  type: string;
  date: string;
  isActive: boolean;
}

interface KehadiranGuruRow {
  guruId: string;
  fullName: string;
  position: string;
  phone: string | null;
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA';
  catatan: string;
}

export default function AbsensiGuru() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isGlobal = user?.scope === 'GLOBAL';
  const isWilayah = user?.scope === 'WILAYAH';
  const isCabang = user?.scope === 'CABANG';

  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedWilayah, setSelectedWilayah] = useState<string>('');
  const [selectedCabang, setSelectedCabang] = useState<string>('');

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Local state for the attendance grid
  const [rows, setRows] = useState<KehadiranGuruRow[]>([]);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  // Initialize locked scope values based on user role
  useEffect(() => {
    if (isWilayah && user?.wilayahId) {
      setSelectedWilayah(user.wilayahId);
    }
    if (isCabang) {
      if (user?.wilayahId) setSelectedWilayah(user.wilayahId);
      if (user?.cabangId) setSelectedCabang(user.cabangId);
    }
  }, [user, isWilayah, isCabang]);

  // Reset dependent fields when parent fields change
  const handleWilayahChange = (wilayahId: string) => {
    setSelectedWilayah(wilayahId);
    setSelectedCabang('');
    setPage(1);
  };

  const handleCabangChange = (cabangId: string) => {
    setSelectedCabang(cabangId);
    setPage(1);
  };

  // 1. Get Active Programs
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['absensi-programs-active'],
    queryFn: async () => {
      const res = await apiClient.get('/absensi/programs?activeOnly=true');
      return res.data;
    }
  });

  // 2. Get Wilayah list
  const { data: wilayahs = [] } = useQuery({
    queryKey: ['master-data', 'wilayah'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/wilayah');
      return res.data;
    },
    enabled: isGlobal
  });

  // 3. Get Cabang list
  const { data: branches = [] } = useQuery({
    queryKey: ['master-data', 'cabang'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/cabang');
      return res.data;
    },
    enabled: isGlobal || isWilayah
  });

  // Filter branches based on selected Wilayah
  const filteredBranches = branches.filter((b: any) => {
    if (isWilayah && user?.wilayahId) {
      return b.wilayahId === user.wilayahId;
    }
    if (selectedWilayah) {
      return b.wilayahId === selectedWilayah;
    }
    return true;
  });

  // Automatically select the first active program when loaded
  useEffect(() => {
    if (programs && programs.length > 0 && !selectedProgram) {
      setSelectedProgram(programs[0].id);
    }
  }, [programs, selectedProgram]);

  // 4. Load teacher attendance list when filters change
  const { data: fetchedKehadiran, isLoading: loadingKehadiran, refetch, isError } = useQuery<KehadiranGuruRow[]>({
    queryKey: ['absensi-kehadiran-guru-list', selectedProgram, selectedWilayah, selectedCabang],
    queryFn: async () => {
      const res = await apiClient.get(
        `/absensi/kehadiran-guru?programId=${selectedProgram}&wilayahId=${selectedWilayah}&cabangId=${selectedCabang}`
      );
      return res.data;
    },
    enabled: !!selectedProgram
  });

  // Sync fetched logs to local state
  useEffect(() => {
    if (fetchedKehadiran) {
      setRows(fetchedKehadiran);
      setIsSavedSuccessfully(false);
      setPage(1);
    }
  }, [fetchedKehadiran]);

  // Bulk Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const logs = rows.map(r => ({
        guruId: r.guruId,
        status: r.status,
        catatan: r.catatan
      }));
      return apiClient.post('/absensi/kehadiran-guru/bulk', {
        programId: selectedProgram,
        cabangId: selectedCabang,
        logs
      });
    },
    onSuccess: () => {
      setIsSavedSuccessfully(true);
      refetch();
    }
  });

  const handleStatusChange = (guruId: string, status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA') => {
    setRows(prev => prev.map(r => r.guruId === guruId ? { ...r, status } : r));
    setIsSavedSuccessfully(false);
  };

  const handleCatatanChange = (guruId: string, catatan: string) => {
    setRows(prev => prev.map(r => r.guruId === guruId ? { ...r, catatan } : r));
    setIsSavedSuccessfully(false);
  };

  const handleSetAllStatus = (status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA') => {
    setRows(prev => prev.map(r => ({ ...r, status })));
    setIsSavedSuccessfully(false);
  };

  // Filtered & Paginated Rows
  const filteredRows = rows.filter(r =>
    r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRows.length / limit) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * limit, page * limit);

  // Status Summary Counts
  const hadirCount = rows.filter(r => r.status === 'HADIR').length;
  const sakitCount = rows.filter(r => r.status === 'SAKIT').length;
  const izinCount = rows.filter(r => r.status === 'IZIN').length;
  const alpaCount = rows.filter(r => r.status === 'ALPA').length;

  return (
    <div className="font-sans text-[#1d1d1f] animate-in fade-in duration-300 pb-12">
      {/* Title Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-emerald-600" />
          {t('absensi_guru.title')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('absensi_guru.subtitle')}
        </p>
      </div>

      {/* Filter Panel */}
      <div className="bg-white border border-slate-200 rounded p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              {t('absensi_guru.wilayah')}
            </label>
            <select
              value={selectedWilayah}
              onChange={e => handleWilayahChange(e.target.value)}
              disabled={!isGlobal}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-sm bg-slate-50/50 disabled:opacity-75"
            >
              {isGlobal ? (
                <>
                  <option value="">{t('absensi_guru.semua_wilayah')}</option>
                  {wilayahs.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </>
              ) : (
                <option value={selectedWilayah}>{user?.wilayahName || t('absensi_guru.wilayah_terkunci')}</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              {t('absensi_guru.cabang')}
            </label>
            <select
              value={selectedCabang}
              onChange={e => handleCabangChange(e.target.value)}
              disabled={isCabang}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-sm bg-slate-50/50 disabled:opacity-75"
            >
              {isCabang ? (
                <option value={selectedCabang}>{user?.cabangName || t('absensi_guru.cabang_terkunci')}</option>
              ) : (
                <>
                  <option value="">{t('absensi_guru.semua_cabang')}</option>
                  {filteredBranches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              {t('absensi_guru.program')}
            </label>
            <select
              value={selectedProgram}
              onChange={e => { setSelectedProgram(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-sm bg-white font-medium"
            >
              {programs.length === 0 ? (
                <option value="">{t('absensi_guru.no_program')}</option>
              ) : (
                programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!selectedProgram ? (
        <div className="bg-slate-50 border border-dashed border-slate-300/80 rounded p-12 text-center text-slate-400 flex flex-col items-center justify-center">
          <Info className="w-8 h-8 mb-2 text-slate-300" />
          <p className="font-medium text-slate-600">{t('absensi_guru.select_program_msg')}</p>
        </div>
      ) : loadingKehadiran ? (
        <div className="bg-white border border-slate-200 rounded p-12 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-6 text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" /> {t('absensi_guru.error_load')}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Action Bar & Stats */}
          <div className="bg-white border border-slate-200 rounded p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={t('absensi_guru.search_ph')}
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none w-48"
                />
              </div>

              <div className="flex items-center gap-2 border-l border-slate-200 pl-4 text-xs font-semibold text-slate-600">
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded">{t('absensi_guru.status_hadir')}: {hadirCount}</span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">{t('absensi_guru.status_sakit')}: {sakitCount}</span>
                <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded">{t('absensi_guru.status_izin')}: {izinCount}</span>
                <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded">{t('absensi_guru.status_alpa')}: {alpaCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetAllStatus('HADIR')}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                {t('absensi_guru.set_all_hadir')}
              </button>

              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || rows.length === 0}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : isSavedSuccessfully ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t('absensi_guru.saved')}
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    {t('absensi_guru.save_btn')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-200 rounded overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-[#fbfbfb]">
                  <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left border-b border-slate-200">
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3 min-w-[200px]">{t('absensi_guru.nama_guru')}</th>
                    <th className="px-4 py-3 min-w-[140px]">{t('absensi_guru.jabatan')}</th>
                    <th className="px-4 py-3 min-w-[220px] text-center">{t('absensi_guru.status_kehadiran')}</th>
                    <th className="px-4 py-3 min-w-[200px]">{t('absensi_guru.catatan')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs bg-white">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        {t('absensi_guru.no_data_cabang')}
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        {t('absensi_guru.no_data_search')}
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((r, index) => (
                      <tr key={r.guruId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-400 font-medium">
                          {(page - 1) * limit + index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{r.fullName}</div>
                          {r.phone && <div className="text-[11px] text-slate-400">{r.phone}</div>}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">
                          {r.position}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r.guruId, 'HADIR')}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                                r.status === 'HADIR'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:bg-slate-200/60'
                              }`}
                            >
                              HADIR
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r.guruId, 'SAKIT')}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                                r.status === 'SAKIT'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:bg-slate-200/60'
                              }`}
                            >
                              SAKIT
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r.guruId, 'IZIN')}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                                r.status === 'IZIN'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'text-slate-600 hover:bg-slate-200/60'
                              }`}
                            >
                              IZIN
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r.guruId, 'ALPA')}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                                r.status === 'ALPA'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:bg-slate-200/60'
                              }`}
                            >
                              ALPA
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder={t('absensi_guru.catatan_ph')}
                            value={r.catatan}
                            onChange={e => handleCatatanChange(r.guruId, e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/40 focus:bg-white transition-colors"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredRows.length > 0 && (
              <div className="p-3 border-t border-slate-200 bg-slate-50/50">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={filteredRows.length}
                  itemsPerPage={limit}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
