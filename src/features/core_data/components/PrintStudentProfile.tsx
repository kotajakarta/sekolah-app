import React from 'react';
import { Student } from '../hooks/useGetStudents';
import { RiwayatKelasFormal } from '../hooks/useRiwayatKelas';
import { User } from 'lucide-react';

interface PrintStudentProfileProps {
  student: Student | null;
  riwayatKelas?: RiwayatKelasFormal[];
}

export const formatJenisTingkatDaimi = (raw?: string | null): string => {
  if (!raw) return '-';
  const normalized = raw
    .trim()
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .toUpperCase();

  const mapping: Record<string, string> = {
    'HAFIZLIK': 'TAHFIDZ',
    'HAZIRLIK LISE': 'PRA TAHFIDZ ULYA',
    'HAZIRLIK ORTAOKUL': 'PRA TAHFIDZ WUSTHA',
    'IBTIDAI': 'IBTIDA',
    'IHZARI': 'TADRIS',
    'PRA TEDRIS': 'PRA TADRIS',
    'PRA TADRIS': 'PRA TADRIS',
    '2. YIL LISE': 'ULYA THN 2',
    '2. YIL ORTAOKUL': 'WUSTHA THN 2',
    '2.YIL LISE': 'ULYA THN 2',
    '2.YIL ORTAOKUL': 'WUSTHA THN 2',
  };

  return mapping[normalized] || raw;
};

export default function PrintStudentProfile({ student, riwayatKelas }: PrintStudentProfileProps) {
  if (!student) return null;

  const b = student.biodata;
  const rawDaimi = student.dataDaimi?.grup?.jenis || student.dataDaimi?.grup?.name || student.grupDaimi;
  const jenisTingkatDaimi = formatJenisTingkatDaimi(rawDaimi);

  const formatDate = (d?: string | null) => {
    if (!d) return '-';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const formatAlamatLengkap = () => {
    if (!b) return '-';
    const parts: string[] = [];
    if (b.alamatJalan) parts.push(b.alamatJalan);
    else if (b.address) parts.push(b.address);
    if (b.alamatKelName) parts.push(`Desa/Kel. ${b.alamatKelName}`);
    if (b.alamatKecName) parts.push(`Kec. ${b.alamatKecName}`);
    if (b.alamatKabName) parts.push(b.alamatKabName);
    if (b.alamatProvName) parts.push(`Prov. ${b.alamatProvName}`);
    return parts.length > 0 ? parts.join(', ') : (b.address || '-');
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="hidden print:block w-full bg-white text-slate-900 font-sans text-[10.5px] leading-snug print-page" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          .print-page {
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            height: 100%;
            max-height: 280mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
          }
        }
      `}</style>

      {/* HEADER DOKUMEN */}
      <div className="border-b-2 border-slate-900 pb-2.5 mb-2.5 flex justify-between items-end">
        <div>
          <h1 className="text-lg font-black tracking-wide text-slate-900 uppercase">
            LEMBAR DATA INDUK SANTRI
          </h1>
          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mt-0.5">
            BIODATA LENGKAP PESERTA DIDIK {student.cabang?.name ? `• CABANG ${student.cabang.name.toUpperCase()}` : ''}
          </p>
        </div>
        <div className="text-right text-[9px] text-slate-500 font-medium">
          Tahun Ajaran: <span className="font-bold text-slate-800">{student.siswaFormal?.kelas?.tahunAjaran || new Date().getFullYear()}</span>
        </div>
      </div>

      {/* CONTENT WRAPPER WITH BALANCED SPACING */}
      <div className="space-y-2.5 flex-1">
        {/* A. IDENTITAS SANTRI DENGAN FOTO BERDAMPINGAN (TANPA NO KK) */}
        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/30">
          <div className="font-bold text-slate-800 text-[10.5px] uppercase tracking-wider pb-1 mb-2 border-b border-slate-200 flex justify-between items-center">
            <span>A. Identitas Santri</span>
            <span className="text-[9px] text-slate-500 font-normal">Data Pokok Peserta Didik</span>
          </div>

          <div className="flex gap-3.5 items-start">
            {/* Tabel Data Identitas (2 Kolom) */}
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
              <div className="flex items-baseline">
                <span className="w-28 text-slate-500 shrink-0">Nama Lengkap</span>
                <span className="w-2 text-slate-400">:</span>
                <span className="font-bold text-slate-900 uppercase truncate">{b?.fullName || '-'}</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-28 text-slate-500 shrink-0">Kewarganegaraan</span>
                <span className="w-2 text-slate-400">:</span>
                <span className="text-slate-900">{b?.kewarganegaraan || 'WNI'}</span>
              </div>

              <div className="flex items-baseline">
                <span className="w-28 text-slate-500 shrink-0">NIK (KTP)</span>
                <span className="w-2 text-slate-400">:</span>
                <span className="font-mono font-bold text-slate-900">{b?.nik || '-'}</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-28 text-slate-500 shrink-0">Anak Ke- / Bersaudara</span>
                <span className="w-2 text-slate-400">:</span>
                <span className="text-slate-900">Ke- {b?.anakKe || '-'} dari {b?.jumlahSaudara || '-'} bersaudara</span>
              </div>

              <div className="flex items-baseline">
                <span className="w-28 text-slate-500 shrink-0">NISN / NIS Lokal</span>
                <span className="w-2 text-slate-400">:</span>
                <span className="text-slate-900">
                  <span className="font-semibold">{b?.nisn || student.siswaFormal?.nisn || '-'}</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span>{b?.nisLokal || student.siswaFormal?.nis || '-'}</span>
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="w-28 text-slate-500 shrink-0">No. HP / WhatsApp</span>
                <span className="w-2 text-slate-400">:</span>
                <span className="text-slate-900 font-medium">{b?.phone || '-'}</span>
              </div>

              <div className="flex items-baseline">
                <span className="w-28 text-slate-500 shrink-0">Tempat, Tgl Lahir</span>
                <span className="w-2 text-slate-400">:</span>
                <span className="text-slate-900 font-medium">{b?.tempatLahir || '-'}, {formatDate(b?.tanggalLahir)}</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-28 text-slate-500 shrink-0">Jenis Kelamin</span>
                <span className="w-2 text-slate-400">:</span>
                <span className="text-slate-900">{b?.jenisKelamin === 'L' ? 'Laki-laki' : b?.jenisKelamin === 'P' ? 'Perempuan' : b?.jenisKelamin || '-'}</span>
              </div>

              <div className="flex items-baseline col-span-2 pt-1 border-t border-slate-100 mt-0.5">
                <span className="w-28 text-slate-500 shrink-0">Alamat Lengkap</span>
                <span className="w-2 text-slate-400">:</span>
                <span className="text-slate-900 leading-snug">{formatAlamatLengkap()}</span>
              </div>
            </div>

            {/* Pas Foto Santri 3x4 (Terintegrasi Rapi di Samping Data Diri) */}
            <div className="w-22 h-28 shrink-0 border border-slate-700 rounded bg-white flex flex-col items-center justify-center overflow-hidden shadow-xs">
              {b?.fotoUrl ? (
                <img
                  src={`/api/v1${b.fotoUrl}`}
                  alt="Foto Santri"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-1 text-center text-slate-400">
                  <User className="w-7 h-7 text-slate-300" />
                  <span className="text-[8px] font-semibold tracking-wider text-slate-400 mt-1">FOTO 3x4</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* B. DATA ORANG TUA & WALI */}
        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/30">
          <div className="font-bold text-slate-800 text-[10.5px] uppercase tracking-wider pb-1 mb-2 border-b border-slate-200">
            B. Data Orang Tua & Wali
          </div>
          <div className="grid grid-cols-2 gap-3.5 text-[10px]">
            {/* Ayah */}
            <div className="border border-slate-200/80 rounded-md p-2 bg-white">
              <p className="font-bold text-slate-800 uppercase text-[9.5px] border-b border-slate-100 pb-1 mb-1.5 text-indigo-900">
                Data Ayah Kandung
              </p>
              <div className="space-y-1">
                <div className="flex items-baseline">
                  <span className="w-22 text-slate-500 shrink-0">Nama Lengkap</span>
                  <span className="w-2 text-slate-400">:</span>
                  <span className="font-bold text-slate-900 uppercase truncate">{b?.namaAyah || '-'}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-22 text-slate-500 shrink-0">Status Hidup</span>
                  <span className="w-2 text-slate-400">:</span>
                  <span className={`font-semibold ${b?.statusHidupAyah === 'Sudah Meninggal' ? 'text-rose-600' : 'text-slate-800'}`}>{b?.statusHidupAyah || '-'}</span>
                </div>
                {b?.statusHidupAyah !== 'Sudah Meninggal' && b?.statusHidupAyah !== 'Wafat' && (
                  <>
                    <div className="flex items-baseline">
                      <span className="w-22 text-slate-500 shrink-0">NIK Ayah</span>
                      <span className="w-2 text-slate-400">:</span>
                      <span className="font-mono text-slate-900">{b?.nikAyah || '-'}</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="w-22 text-slate-500 shrink-0">TTL</span>
                      <span className="w-2 text-slate-400">:</span>
                      <span className="text-slate-800">{b?.tempatLahirAyah || '-'}, {formatDate(b?.tanggalLahirAyah)}</span>
                    </div>
                  </>
                )}
                <div className="flex items-baseline">
                  <span className="w-22 text-slate-500 shrink-0">Pendidikan</span>
                  <span className="w-2 text-slate-400">:</span>
                  <span className="text-slate-800">{b?.pendidikanAyah || '-'}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-22 text-slate-500 shrink-0">Pekerjaan</span>
                  <span className="w-2 text-slate-400">:</span>
                  <span className="text-slate-800">{b?.pekerjaanAyah || '-'}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-22 text-slate-500 shrink-0">Penghasilan</span>
                  <span className="w-2 text-slate-400">:</span>
                  <span className="text-slate-800">{b?.penghasilanAyah || '-'}</span>
                </div>
              </div>
            </div>

            {/* Ibu */}
            <div className="border border-slate-200/80 rounded-md p-2 bg-white">
              <p className="font-bold text-slate-800 uppercase text-[9.5px] border-b border-slate-100 pb-1 mb-1.5 text-indigo-900">
                Data Ibu Kandung
              </p>
              <div className="space-y-1">
                <div className="flex items-baseline">
                  <span className="w-22 text-slate-500 shrink-0">Nama Lengkap</span>
                  <span className="w-2 text-slate-400">:</span>
                  <span className="font-bold text-slate-900 uppercase truncate">{b?.namaIbu || '-'}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-22 text-slate-500 shrink-0">Status Hidup</span>
                  <span className="w-2 text-slate-400">:</span>
                  <span className={`font-semibold ${b?.statusHidupIbu === 'Sudah Meninggal' ? 'text-rose-600' : 'text-slate-800'}`}>{b?.statusHidupIbu || '-'}</span>
                </div>
                {b?.statusHidupIbu !== 'Sudah Meninggal' && b?.statusHidupIbu !== 'Wafat' && (
                  <>
                    <div className="flex items-baseline">
                      <span className="w-22 text-slate-500 shrink-0">NIK Ibu</span>
                      <span className="w-2 text-slate-400">:</span>
                      <span className="font-mono text-slate-900">{b?.nikIbu || '-'}</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="w-22 text-slate-500 shrink-0">TTL</span>
                      <span className="w-2 text-slate-400">:</span>
                      <span className="text-slate-800">{b?.tempatLahirIbu || '-'}, {formatDate(b?.tanggalLahirIbu)}</span>
                    </div>
                  </>
                )}
                <div className="flex items-baseline">
                  <span className="w-22 text-slate-500 shrink-0">Pendidikan</span>
                  <span className="w-2 text-slate-400">:</span>
                  <span className="text-slate-800">{b?.pendidikanIbu || '-'}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-22 text-slate-500 shrink-0">Pekerjaan</span>
                  <span className="w-2 text-slate-400">:</span>
                  <span className="text-slate-800">{b?.pekerjaanIbu || '-'}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-22 text-slate-500 shrink-0">Penghasilan</span>
                  <span className="w-2 text-slate-400">:</span>
                  <span className="text-slate-800">{b?.penghasilanIbu || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Kontak Darurat / Wali */}
          {b?.kontakDaruratNama && (
            <div className="mt-2 px-2.5 py-1.5 bg-white border border-slate-200/80 rounded-md flex justify-between text-[9.5px]">
              <div><span className="text-slate-500 font-medium">Kontak Darurat / Wali:</span> <span className="font-bold text-slate-900">{b.kontakDaruratNama}</span></div>
              <div><span className="text-slate-500 font-medium">Hubungan:</span> <span className="text-slate-800 font-semibold">{b.kontakDaruratHubungan || '-'}</span></div>
              <div><span className="text-slate-500 font-medium">No. Telepon / HP:</span> <span className="text-slate-800 font-semibold">{b.kontakDaruratTelp || '-'}</span></div>
            </div>
          )}
        </div>

        {/* C. DATA AKADEMIK & PESANTREN */}
        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/30">
          <div className="font-bold text-slate-800 text-[10.5px] uppercase tracking-wider pb-1 mb-2 border-b border-slate-200">
            C. Data Akademik
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
            <div className="flex items-baseline">
              <span className="w-28 text-slate-500 shrink-0">Cabang / Pondok</span>
              <span className="w-2 text-slate-400">:</span>
              <span className="font-bold text-slate-900 uppercase truncate">{student.cabang?.name || '-'}</span>
            </div>
            <div className="flex items-baseline">
              <span className="w-28 text-slate-500 shrink-0">Kelas Formal</span>
              <span className="w-2 text-slate-400">:</span>
              <span className="font-semibold text-slate-900">{student.siswaFormal?.kelas?.name || '-'}</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-28 text-slate-500 shrink-0">Lembaga Pendidikan</span>
              <span className="w-2 text-slate-400">:</span>
              <span className="text-slate-800 truncate">{student.siswaFormal?.kelas?.lembagaMuadalah?.name || '-'}</span>
            </div>
            <div className="flex items-baseline">
              <span className="w-28 text-slate-500 shrink-0">Tingkat / Jenjang</span>
              <span className="w-2 text-slate-400">:</span>
              <span className="text-slate-800">{student.siswaFormal?.tingkat || student.siswaFormal?.kelas?.tingkat || '-'}</span>
            </div>

            <div className="flex items-baseline col-span-2 pt-1 border-t border-slate-100 mt-0.5">
              <span className="w-28 text-slate-600 font-semibold shrink-0">Jenis / Tingkat Daimi</span>
              <span className="w-2 text-slate-400">:</span>
              <span className="font-bold text-indigo-900 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[10.5px]">{jenisTingkatDaimi}</span>
            </div>
          </div>
        </div>

        {/* D. RIWAYAT AKTIVITAS BELAJAR */}
        {riwayatKelas && riwayatKelas.length > 0 ? (
          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/30">
            <div className="font-bold text-slate-800 text-[10.5px] uppercase tracking-wider pb-1 mb-1.5 border-b border-slate-200 flex justify-between items-center">
              <span>D. Riwayat Kelas & Aktivitas Belajar</span>
              <span className="text-[8.5px] text-slate-500 font-normal">Riwayat Semester Terdaftar</span>
            </div>
            <table className="w-full text-left text-[9px] border border-slate-200 bg-white">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-1 px-2 border-r border-slate-200 w-8 text-center">No</th>
                  <th className="py-1 px-2 border-r border-slate-200">Tahun Ajaran</th>
                  <th className="py-1 px-2 border-r border-slate-200">Semester</th>
                  <th className="py-1 px-2 border-r border-slate-200">Kelas / Rombel</th>
                  <th className="py-1 px-2 border-r border-slate-200">Wali Kelas</th>
                  <th className="py-1 px-2 text-center">Status Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {riwayatKelas.slice(0, 3).map((riwayat, idx) => (
                  <tr key={riwayat.id}>
                    <td className="py-1 px-2 text-center border-r border-slate-100 font-semibold text-slate-500">{idx + 1}</td>
                    <td className="py-1 px-2 border-r border-slate-100 font-semibold text-slate-800">{riwayat.tahunAjaran}</td>
                    <td className="py-1 px-2 border-r border-slate-100 text-slate-700">{riwayat.semester}</td>
                    <td className="py-1 px-2 border-r border-slate-100 text-slate-800">{riwayat.kelas?.name || '-'}</td>
                    <td className="py-1 px-2 border-r border-slate-100 text-slate-600">{riwayat.waliKelas?.name || '-'}</td>
                    <td className="py-1 px-2 text-center font-semibold text-slate-800">{riwayat.statusAkhir || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* TANDA TANGAN & PENGESAHAN (FOOTER PROPOSIONAL DI BAGIAN BAWAH) */}
      <div className="pt-4 border-t border-slate-200 mt-2" style={{ pageBreakInside: 'avoid' }}>
        <div className="flex justify-between items-start text-[10px]">
          <div className="text-center w-52">
            <p className="text-slate-600 mb-14">Wali Santri,</p>
            <p className="font-bold text-slate-900 border-b border-slate-800 pb-0.5 uppercase truncate">
              ( {b?.namaAyah || b?.namaIbu || b?.kontakDaruratNama || '...........................................'} )
            </p>
          </div>

          <div className="text-center w-56">
            <p className="text-slate-500 text-[9px] mb-1">Dicetak pada: {currentDate}</p>
            <p className="text-slate-600 mb-14">Petugas / Tata Usaha,</p>
            <p className="font-bold text-slate-900 border-b border-slate-800 pb-0.5">
              ( ........................................... )
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
