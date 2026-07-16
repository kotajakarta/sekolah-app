import React, { useState, useRef } from 'react';
import { Upload, Download, Loader2, Database, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';

interface SyncConfig {
  name: string;
  exportUrl?: string; // If empty, we can't export directly (maybe we need to fetch all)
  exportDetailUrl?: string; // For detail export combining schemas
  importUrl: string;
  templateKeys: string[];
}

const SYNC_MODULES: Record<string, SyncConfig> = {
  Siswa: {
    name: 'Siswa',
    importUrl: '/students/import',
    exportUrl: '/students',
    exportDetailUrl: '/students/export/detail',
    templateKeys: ['no_glodemy', 'nama_siswa', 'tanggal_lahir', 'jenis_kelamin', 'wilayah', 'cabang', 'nik', 'no_telp', 'nama_ibu', 'nama_ayah', 'tempat_lahir'],
  },
  Guru: {
    name: 'Guru',
    importUrl: '/master-data/guru/import',
    exportUrl: '/master-data/guru',
    templateKeys: ['nama', 'posisi', 'wilayah', 'cabang'],
  },
  Kelas: {
    name: 'Kelas',
    importUrl: '/formal/kelas/import',
    exportUrl: '/formal/kelas',
    templateKeys: ['nama_kelas', 'tingkat', 'is_active', 'cabang', 'wilayah'],
  },
  Cabang: {
    name: 'Cabang',
    importUrl: '/master-data/cabang/import',
    exportUrl: '/master-data/cabang',
    templateKeys: ['nama', 'wilayah', 'alamat'],
  },
  Wilayah: {
    name: 'Wilayah',
    importUrl: '/master-data/wilayah/import',
    exportUrl: '/master-data/wilayah',
    templateKeys: ['nama', 'alamat'],
  },
};

export default function Sinkronisasi() {
  const queryClient = useQueryClient();
  const [loadingModules, setLoadingModules] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();
  const [progressModules, setProgressModules] = useState<Record<string, { current: number, total: number, percent: number }>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleExport = async (moduleName: string) => {
    const config = SYNC_MODULES[moduleName];
    if (!config.exportUrl) return;

    setLoadingModules((prev) => ({ ...prev, [moduleName]: true }));
    try {
      const response = await apiClient.get(config.exportUrl);
      const data = response.data;

      let exportData: any[] = [];
      if (moduleName === 'Siswa') {
        exportData = data.map((item: any) => ({
          no_glodemy: item.biodata?.noGlodemy || '',
          nama_siswa: item.biodata?.fullName || '',
          tanggal_lahir: item.biodata?.tanggalLahir ? new Date(item.biodata.tanggalLahir).toISOString().split('T')[0] : '',
          jenis_kelamin: item.biodata?.jenisKelamin || '',
          wilayah: item.wilayah?.name || '',
          cabang: item.cabang?.name || '',
          nik: item.biodata?.nik || '',
          no_telp: item.biodata?.phone || '',
          nama_ibu: item.biodata?.namaIbu || '',
          nama_ayah: item.biodata?.namaAyah || '',
          tempat_lahir: item.biodata?.tempatLahir || '',
        }));
      } else if (moduleName === 'Guru') {
        exportData = data.map((item: any) => ({
          nama: item.name || '',
          posisi: item.position || '',
          wilayah: item.wilayah?.name || '',
          cabang: item.cabang?.name || '',
        }));
      } else if (moduleName === 'Kelas') {
        exportData = data.map((item: any) => ({
          nama_kelas: item.name || '',
          tingkat: item.tingkat || '',
          is_active: item.isActive ? 'true' : 'false',
          cabang: item.cabang?.name || '',
          wilayah: item.cabang?.wilayah?.name || '',
        }));
      } else if (moduleName === 'Cabang') {
        exportData = data.map((item: any) => ({
          nama: item.name || '',
          wilayah: item.wilayah?.name || '',
          alamat: item.address || '',
        }));
      } else if (moduleName === 'Wilayah') {
        exportData = data.map((item: any) => ({
          nama: item.name || '',
          alamat: item.address || '',
        }));
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, moduleName);
      XLSX.writeFile(workbook, `Data_${moduleName}_Export.xlsx`);
    } catch (err) {
      showToast('error', `Gagal mengekspor data ${moduleName}`);
    } finally {
      setLoadingModules((prev) => ({ ...prev, [moduleName]: false }));
    }
  };

  const handleExportDetail = async (moduleName: string) => {
    const config = SYNC_MODULES[moduleName];
    if (!config.exportDetailUrl) return;

    setLoadingModules((prev) => ({ ...prev, [`${moduleName}_detail`]: true }));
    try {
      const response = await apiClient.get(config.exportDetailUrl);
      const data = response.data;

      const exportData = data.map((item: any) => ({
        // --- DATA SYSTEM (CORE) ---
        id_siswa: item.id || '',
        status_pool: item.statusPool || '',

        // --- DATA BIODATA (CORE) ---
        no_glodemy: item.biodata?.noGlodemy || '',
        nik: item.biodata?.nik || '',
        nis_lokal: item.biodata?.nisLokal || '',
        nama_siswa: item.biodata?.fullName || '',
        tempat_lahir: item.biodata?.tempatLahir || '',
        tanggal_lahir: item.biodata?.tanggalLahir ? new Date(item.biodata.tanggalLahir).toISOString().split('T')[0] : '',
        jenis_kelamin: item.biodata?.jenisKelamin || '',
        kewarganegaraan: item.biodata?.kewarganegaraan || '',
        alamat: item.biodata?.address || '',
        telepon: item.biodata?.phone || '',
        wilayah: item.wilayah?.name || '',
        cabang: item.cabang?.name || '',
        ada_foto: item.biodata?.fotoBase64 ? 'Ya' : 'Tidak',
        ada_ijazah: item.biodata?.ijazahBase64 ? 'Ya' : 'Tidak',
        ada_kk: item.biodata?.kkBase64 ? 'Ya' : 'Tidak',
        
        // --- DATA KELUARGA (CORE) ---
        nama_ayah: item.biodata?.namaAyah || '',
        status_hidup_ayah: item.biodata?.statusHidupAyah || '',
        pekerjaan_ayah: item.biodata?.pekerjaanAyah || '',
        pendidikan_ayah: item.biodata?.pendidikanAyah || '',
        nama_ibu: item.biodata?.namaIbu || '',
        status_hidup_ibu: item.biodata?.statusHidupIbu || '',
        pekerjaan_ibu: item.biodata?.pekerjaanIbu || '',
        pendidikan_ibu: item.biodata?.pendidikanIbu || '',
        
        // --- KONTAK DARURAT (CORE) ---
        kontak_darurat_nama: item.biodata?.kontakDaruratNama || '',
        kontak_darurat_telp: item.biodata?.kontakDaruratTelp || '',
        kontak_darurat_hubungan: item.biodata?.kontakDaruratHubungan || '',

        // --- DATA SEKOLAH (FORMAL) ---
        nis_formal: item.siswaFormal?.nis || '',
        nisn_formal: item.siswaFormal?.nisn || '',
        kelas_formal: item.siswaFormal?.kelas?.name || '',

        // --- DATA PESANTREN (DAIMI) ---
        nis_pesantren: item.dataDaimi?.nis || '',
        kelas_pesantren: item.dataDaimi?.kelas?.name || '',
        grup_pesantren: item.dataDaimi?.grup?.name || '',
        
        // --- RIWAYAT PENDIDIKAN TERAKHIR (CORE) ---
        riwayat_terakhir_cabang: item.riwayatPendidikan?.[0]?.cabang?.name || '',
        riwayat_terakhir_masuk: item.riwayatPendidikan?.[0]?.tanggalMasuk ? new Date(item.riwayatPendidikan[0].tanggalMasuk).toISOString().split('T')[0] : '',
        riwayat_terakhir_keluar: item.riwayatPendidikan?.[0]?.tanggalKeluar ? new Date(item.riwayatPendidikan[0].tanggalKeluar).toISOString().split('T')[0] : '',
        riwayat_terakhir_status: item.riwayatPendidikan?.[0]?.statusAkhir || '',
        riwayat_terakhir_catatan: item.riwayatPendidikan?.[0]?.catatan || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${moduleName} Detail`);
      XLSX.writeFile(workbook, `Data_${moduleName}_Export_Detail.xlsx`);
    } catch (err) {
      showToast('error', `Gagal mengekspor detail data ${moduleName}`);
    } finally {
      setLoadingModules((prev) => ({ ...prev, [`${moduleName}_detail`]: false }));
    }
  };

  const handleImportClick = (moduleName: string) => {
    fileInputRefs.current[moduleName]?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, moduleName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    setLoadingModules((prev) => ({ ...prev, [moduleName]: true }));
    setProgressModules((prev) => {
      const newProgress = { ...prev };
      delete newProgress[moduleName];
      return newProgress;
    });

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Smart header detection: find row that contains the most expected column names
          const config = SYNC_MODULES[moduleName];
          const expectedKeys = config.templateKeys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
          
          const rawData = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(rawData, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Get all rows as raw array to detect actual header row
          const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
          
          let headerRowIndex = 0;
          let bestMatch = 0;
          rawRows.forEach((row, idx) => {
            const normalized = row.map((cell: any) => String(cell || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
            const matchCount = normalized.filter((cell: string) => expectedKeys.includes(cell)).length;
            if (matchCount > bestMatch) {
              bestMatch = matchCount;
              headerRowIndex = idx;
            }
          });
          
          // Re-parse using detected header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            defval: '',
            raw: false,
            range: headerRowIndex // start parsing from detected header row
          });

          if (jsonData.length === 0) {
            showToast('error', 'File kosong atau format kolom tidak dikenali. Gunakan template yang disediakan.');
            return;
          }
          const totalRows = jsonData.length;
          const BATCH_SIZE = 250;
          
          setProgressModules((prev) => ({
            ...prev,
            [moduleName]: { current: 0, total: totalRows, percent: 0 }
          }));

          for (let i = 0; i < totalRows; i += BATCH_SIZE) {
            const chunk = jsonData.slice(i, i + BATCH_SIZE);
            try {
              await apiClient.post(config.importUrl, chunk);
              
              const newCurrent = Math.min(i + BATCH_SIZE, totalRows);
              setProgressModules((prev) => ({
                ...prev,
                [moduleName]: { 
                  current: newCurrent, 
                  total: totalRows, 
                  percent: Math.round((newCurrent / totalRows) * 100)
                }
              }));
            } catch (err: any) {
              const errorMessage = err.response?.data?.message || err.message;
              throw new Error(`Gagal pada baris ${i + 1} - ${i + chunk.length}: ${errorMessage}`);
            }
          }
          
          queryClient.invalidateQueries();
          showToast('success', `Berhasil mengimport data ${moduleName} sebanyak ${totalRows} baris`);
        } catch (err: any) {
          showToast('error', `Gagal mengimport data ${moduleName}:\n${err.message}`);
        } finally {
          setLoadingModules((prev) => ({ ...prev, [moduleName]: false }));
          // Note: we don't clear progress immediately so user can see 100% completion
          setTimeout(() => {
             setProgressModules((prev) => {
               const newProgress = { ...prev };
               delete newProgress[moduleName];
               return newProgress;
             });
          }, 3000);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      showToast('error', `Gagal membaca file`);
      setLoadingModules((prev) => ({ ...prev, [moduleName]: false }));
    }
  };

  const downloadTemplate = (moduleName: string) => {
    const config = SYNC_MODULES[moduleName];
    const templateData = [
      config.templateKeys.reduce((acc, key) => ({ ...acc, [key]: '' }), {})
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, `Template_Import_${moduleName}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Sinkronisasi Data</h1>
          <p className="text-sm text-slate-500 mt-1.5">Import dan Export data massal (Format XLSX)</p>
        </div>
        <Database className="w-8 h-8 text-slate-300" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.keys(SYNC_MODULES).map((moduleName) => {
          const isLoading = loadingModules[moduleName];
          const progress = progressModules[moduleName];
          
          return (
            <div key={moduleName} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              {progress && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              )}
              
              <h3 className="text-lg font-medium text-slate-800 mb-4">Data {moduleName}</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleExport(moduleName)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export {moduleName}
                </button>

                {SYNC_MODULES[moduleName].exportDetailUrl && (
                  <button
                    onClick={() => handleExportDetail(moduleName)}
                    disabled={loadingModules[`${moduleName}_detail`]}
                    className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export {moduleName} Detail
                  </button>
                )}

                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    ref={(el) => { fileInputRefs.current[moduleName] = el; }}
                    onChange={(e) => handleFileChange(e, moduleName)}
                  />
                  <button
                    onClick={() => handleImportClick(moduleName)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors relative overflow-hidden"
                  >
                    {isLoading ? (
                      progress ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{progress.percent}% ({progress.current}/{progress.total})</span>
                        </div>
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      )
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import {moduleName}
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => downloadTemplate(moduleName)}
                  className="w-full text-xs text-indigo-600 hover:text-blue-800 text-center block pt-2"
                >
                  Unduh Template {moduleName}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

