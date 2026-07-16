import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/features/core_data/components/StudentModal.tsx');
let content = fs.readFileSync(file, 'utf-8');

// 1. Remove SectionHeader component definition completely
content = content.replace(/const SectionHeader = \(\{ title, section \}[:\s\S]*?\);\n/m, '');

// 2. Add activeTab state instead of expandedSections
content = content.replace(
  /const \[expandedSections, setExpandedSections\] = useState\(\{[\s\S]*?\}\);\n\n  const toggleSection = [\s\S]*?\};\n/m,
  "const [activeTab, setActiveTab] = useState<TabType>('SANTRI');\n"
);

// 3. Add Import for AktivitasBelajarTab and TabType
if (!content.includes('AktivitasBelajarTab')) {
  content = content.replace(
    /import \{ useToast \} from '\.\.\/\.\.\/\.\.\/contexts\/ToastContext';/,
    `import { useToast } from '../../../contexts/ToastContext';\nimport AktivitasBelajarTab from './AktivitasBelajarTab';\n\nexport type TabType = 'SANTRI' | 'ORANG_TUA' | 'ALAMAT' | 'AKTIVITAS_BELAJAR';`
  );
}

// 4. Extract form content and restructure
const formStartRegex = /<form id="student-form" onSubmit=\{handleSubmit\}>/;
const formEndRegex = /<\/form>/;

const startMatch = content.match(formStartRegex);
const endMatch = content.match(formEndRegex);

if (startMatch && endMatch) {
  const startIndex = startMatch.index;
  const endIndex = endMatch.index + '</form>'.length;
  
  const newFormContent = `
            {/* Tab Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
              <nav className="flex divide-x divide-slate-200 overflow-x-auto">
                <button type="button" onClick={() => setActiveTab('SANTRI')} className={\`flex-1 min-w-[140px] py-3 px-4 text-sm font-medium text-center transition-colors whitespace-nowrap \${activeTab === 'SANTRI' ? 'bg-indigo-50 border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}\`}>DATA SANTRI</button>
                <button type="button" onClick={() => setActiveTab('ORANG_TUA')} className={\`flex-1 min-w-[140px] py-3 px-4 text-sm font-medium text-center transition-colors whitespace-nowrap \${activeTab === 'ORANG_TUA' ? 'bg-indigo-50 border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}\`}>DATA ORANG TUA</button>
                <button type="button" onClick={() => setActiveTab('ALAMAT')} className={\`flex-1 min-w-[140px] py-3 px-4 text-sm font-medium text-center transition-colors whitespace-nowrap \${activeTab === 'ALAMAT' ? 'bg-indigo-50 border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}\`}>DATA ALAMAT</button>
                {student && <button type="button" onClick={() => setActiveTab('AKTIVITAS_BELAJAR')} className={\`flex-1 min-w-[140px] py-3 px-4 text-sm font-medium text-center transition-colors whitespace-nowrap \${activeTab === 'AKTIVITAS_BELAJAR' ? 'bg-indigo-50 border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}\`}>AKTIVITAS BELAJAR</button>}
              </nav>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              <form id="student-form" onSubmit={handleSubmit} className={activeTab === 'AKTIVITAS_BELAJAR' ? 'hidden' : 'block'}>
                {activeTab === 'SANTRI' && (
                  <div className="space-y-6">
                    {/* Berkas Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col items-center">
                        <h5 className="font-medium text-sm text-slate-800 mb-3">{t('siswa.form.foto')}</h5>
                        {formData.fotoBase64 ? (
                          <div className="relative w-24 h-32 mb-3 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden group">
                            <img src={formData.fotoBase64} alt="Foto thumbnail" className="object-cover w-full h-full" />
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => setViewImage(formData.fotoBase64)} className="text-white p-2 hover:text-blue-300">
                                <Eye className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-24 h-32 mb-3 bg-slate-200 border border-slate-300 rounded flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                        <label className="cursor-pointer bg-white border border-slate-300 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm w-full text-center">
                          <span>{formData.fotoBase64 ? t('siswa.form.change_foto') : t('siswa.form.upload_foto')}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'fotoBase64')} disabled={isCompressing} />
                        </label>
                      </div>

                      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col items-center">
                        <h5 className="font-medium text-sm text-slate-800 mb-3">{t('siswa.form.ijazah')}</h5>
                        {formData.ijazahBase64 ? (
                          <div className="relative w-32 h-24 mb-3 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden group">
                            <img src={formData.ijazahBase64} alt="Ijazah thumbnail" className="object-contain w-full h-full" />
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => setViewImage(formData.ijazahBase64)} className="text-white p-2 hover:text-blue-300">
                                <Eye className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-32 h-24 mb-3 bg-slate-200 border border-slate-300 rounded flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                        <label className="cursor-pointer bg-white border border-slate-300 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm w-full text-center">
                          <span>{formData.ijazahBase64 ? t('siswa.form.change_ijazah') : t('siswa.form.upload_ijazah')}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'ijazahBase64')} disabled={isCompressing} />
                        </label>
                      </div>

                      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col items-center">
                        <h5 className="font-medium text-sm text-slate-800 mb-3">{t('siswa.form.kk')}</h5>
                        {formData.kkBase64 ? (
                          <div className="relative w-32 h-24 mb-3 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden group">
                            <img src={formData.kkBase64} alt="KK thumbnail" className="object-contain w-full h-full" />
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => setViewImage(formData.kkBase64)} className="text-white p-2 hover:text-blue-300">
                                <Eye className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-32 h-24 mb-3 bg-slate-200 border border-slate-300 rounded flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                        <label className="cursor-pointer bg-white border border-slate-300 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm w-full text-center">
                          <span>{formData.kkBase64 ? t('siswa.form.change_kk') : t('siswa.form.upload_kk')}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'kkBase64')} disabled={isCompressing} />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.full_name')}</label>
                        <input type="text" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.nik')}</label>
                        <input type="text" value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">NISN</label>
                        <input type="text" value={formData.nisn} onChange={(e) => setFormData({ ...formData, nisn: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.nis_lokal')} / NISM</label>
                        <input type="text" value={formData.nisLokal} onChange={(e) => setFormData({ ...formData, nisLokal: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.no_glodemy')}</label>
                        <input type="text" value={formData.noGlodemy} onChange={(e) => setFormData({ ...formData, noGlodemy: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.birth_place')}</label>
                        <input type="text" value={formData.tempatLahir} onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.birth_date')}</label>
                        <input type="date" value={formData.tanggalLahir} onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.gender')}</label>
                        <select value={formData.jenisKelamin} onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="L">{t('siswa.form.gender_l')}</option>
                          <option value="P">{t('siswa.form.gender_p')}</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.nationality')}</label>
                        <Select
                          options={countries}
                          value={countries.find(c => c.value === formData.kewarganegaraan) || { value: formData.kewarganegaraan, label: formData.kewarganegaraan }}
                          onChange={(selected) => setFormData({ ...formData, kewarganegaraan: selected?.value || 'Indonesia' })}
                          className="mt-1"
                          placeholder={t('siswa.form.search_country')}
                          isClearable
                        />
                      </div>
                      
                      {/* Data Akademik Grouped Here */}
                      <div className="md:col-span-2 mt-4 mb-2">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">Registrasi Akademik</h4>
                      </div>
                      {!student && user?.scope === 'GLOBAL' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700">{t('siswa.form.wilayah_daftar')}</label>
                          <select required value={formData.wilayahId} onChange={(e) => setFormData({ ...formData, wilayahId: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="">{t('siswa.form.select_wilayah')}</option>
                            {wilayahList?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                          </select>
                        </div>
                      )}
                      
                      {!student && (user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH') && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700">{t('siswa.form.cabang_penempatan')}</label>
                          <select value={formData.cabangId} onChange={(e) => setFormData({ ...formData, cabangId: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="">{t('siswa.form.no_cabang')}</option>
                            {cabangList?.filter(c => formData.wilayahId ? c.wilayahId === formData.wilayahId : true).map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.tgl_masuk')}</label>
                        <input type="date" value={formData.tanggalMasuk} onChange={(e) => setFormData({ ...formData, tanggalMasuk: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700">Jenis Siswa</label>
                        <select value={formData.jenisSiswa} onChange={(e) => setFormData({ ...formData, jenisSiswa: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="">Pilih Jenis Siswa</option>
                          <option value="MUADALAH">Muadalah</option>
                          <option value="NON_MUADALAH">Non Muadalah</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700">Grup Daimi</label>
                        <select value={formData.grupDaimi} onChange={(e) => setFormData({ ...formData, grupDaimi: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="">Pilih Grup Daimi</option>
                          {grupDaimiList?.map((grup: any) => (
                            <option key={grup.id} value={grup.name}>{grup.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ORANG_TUA' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    {/* Ayah */}
                    <div className="space-y-4 md:border-r border-slate-100 md:pr-6">
                      <h5 className="font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">{t('siswa.form.ayah_title')}</h5>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.nama_ayah')}</label>
                        <input type="text" value={formData.namaAyah} onChange={(e) => setFormData({ ...formData, namaAyah: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.status_hidup_ayah')}</label>
                        <select value={formData.statusHidupAyah} onChange={(e) => setFormData({ ...formData, statusHidupAyah: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value={t('siswa.form.status_hidup')}>{t('siswa.form.status_hidup')}</option>
                          <option value={t('siswa.form.status_mati')}>{t('siswa.form.status_mati')}</option>
                          <option value={t('siswa.form.status_unknown')}>{t('siswa.form.status_unknown')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.pekerjaan_ayah')}</label>
                        <input type="text" value={formData.pekerjaanAyah} onChange={(e) => setFormData({ ...formData, pekerjaanAyah: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.pendidikan_ayah')}</label>
                        <input type="text" value={formData.pendidikanAyah} onChange={(e) => setFormData({ ...formData, pendidikanAyah: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                    </div>

                    {/* Ibu */}
                    <div className="space-y-4">
                      <h5 className="font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">{t('siswa.form.ibu_title')}</h5>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.nama_ibu')}</label>
                        <input type="text" value={formData.namaIbu} onChange={(e) => setFormData({ ...formData, namaIbu: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.status_hidup_ibu')}</label>
                        <select value={formData.statusHidupIbu} onChange={(e) => setFormData({ ...formData, statusHidupIbu: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value={t('siswa.form.status_hidup')}>{t('siswa.form.status_hidup')}</option>
                          <option value={t('siswa.form.status_mati')}>{t('siswa.form.status_mati')}</option>
                          <option value={t('siswa.form.status_unknown')}>{t('siswa.form.status_unknown')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.pekerjaan_ibu')}</label>
                        <input type="text" value={formData.pekerjaanIbu} onChange={(e) => setFormData({ ...formData, pekerjaanIbu: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.pendidikan_ibu')}</label>
                        <input type="text" value={formData.pendidikanIbu} onChange={(e) => setFormData({ ...formData, pendidikanIbu: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ALAMAT' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Provinsi */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase">Provinsi</label>
                      <select 
                        value={formData.alamatProvId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const name = provinces.find((p) => p.id === id)?.name || '';
                          setFormData({
                            ...formData,
                            alamatProvId: id,
                            alamatProvName: name,
                            alamatKabId: '',
                            alamatKabName: '',
                            alamatKecId: '',
                            alamatKecName: '',
                            alamatKelId: '',
                            alamatKelName: '',
                            alamatJalan: '',
                            address: ''
                          });
                        }}
                        className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="">-- Pilih Provinsi --</option>
                        {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>

                    {/* Kabupaten */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase">Kabupaten / Kota</label>
                      <select 
                        value={formData.alamatKabId}
                        disabled={!formData.alamatProvId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const name = regencies.find((r) => r.id === id)?.name || '';
                          setFormData({
                            ...formData,
                            alamatKabId: id,
                            alamatKabName: name,
                            alamatKecId: '',
                            alamatKecName: '',
                            alamatKelId: '',
                            alamatKelName: '',
                            alamatJalan: '',
                            address: ''
                          });
                        }}
                        className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="">-- Pilih Kota/Kabupaten --</option>
                        {regencies.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>

                    {/* Kecamatan */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase">Kecamatan</label>
                      <select 
                        value={formData.alamatKecId}
                        disabled={!formData.alamatKabId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const name = districts.find((d) => d.id === id)?.name || '';
                          setFormData({
                            ...formData,
                            alamatKecId: id,
                            alamatKecName: name,
                            alamatKelId: '',
                            alamatKelName: '',
                            alamatJalan: '',
                            address: ''
                          });
                        }}
                        className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="">-- Pilih Kecamatan --</option>
                        {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>

                    {/* Kelurahan */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase">Kelurahan / Desa</label>
                      <select 
                        value={formData.alamatKelId}
                        disabled={!formData.alamatKecId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const name = villages.find((v) => v.id === id)?.name || '';
                          setFormData({
                            ...formData,
                            alamatKelId: id,
                            alamatKelName: name,
                            alamatJalan: '',
                            address: ''
                          });
                        }}
                        className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="">-- Pilih Kelurahan/Desa --</option>
                        {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>

                    {/* Alamat Detail */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase">Alamat Jalan / Kampung</label>
                      <textarea 
                        value={formData.alamatJalan}
                        onChange={(e) => {
                          const val = e.target.value;
                          const unifiedAddress = \`\${val}, Kel. \${formData.alamatKelName || ''}, Kec. \${formData.alamatKecName || ''}, Kab/Kota. \${formData.alamatKabName || ''}, Prov. \${formData.alamatProvName || ''}\`;
                          setFormData({
                            ...formData,
                            alamatJalan: val,
                            address: unifiedAddress
                          });
                        }}
                        rows={2}
                        className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Nama Jalan, No Rumah, RT/RW, Kampung, Dusun..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{t('siswa.form.phone')}</label>
                      <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>

                    <div className="sm:col-span-2 mt-4 mb-2">
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">Kontak Darurat</h4>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{t('siswa.form.darurat_nama')}</label>
                      <input type="text" value={formData.kontakDaruratNama} onChange={(e) => setFormData({ ...formData, kontakDaruratNama: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{t('siswa.form.darurat_telp')}</label>
                      <input type="text" value={formData.kontakDaruratTelp} onChange={(e) => setFormData({ ...formData, kontakDaruratTelp: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{t('siswa.form.darurat_hub')}</label>
                      <input type="text" value={formData.kontakDaruratHubungan} onChange={(e) => setFormData({ ...formData, kontakDaruratHubungan: e.target.value })} placeholder={t('siswa.form.darurat_hub_ph')} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                )}
              </form>

              {activeTab === 'AKTIVITAS_BELAJAR' && student && (
                <AktivitasBelajarTab 
                  student={student} 
                  onStatusChange={(isActive) => {
                    setFormData({ ...formData, isActive });
                    // Also trigger save for status change immediately if possible, or user needs to click Save.
                  }}
                />
              )}
            </div>`;

  const newContent = content.substring(0, startMatch.index) + newFormContent + content.substring(endIndex);
  fs.writeFileSync(file, newContent);
  console.log("Refactoring complete");
} else {
  console.log("Could not match form bounds", !!startMatch, !!endMatch);
}
