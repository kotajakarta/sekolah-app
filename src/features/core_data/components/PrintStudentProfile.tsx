import React from 'react';
import { Student } from '../hooks/useGetStudents';
import { User, Phone, MapPin, Mail } from 'lucide-react';

interface PrintStudentProfileProps {
  student: Student | null;
}

export default function PrintStudentProfile({ student }: PrintStudentProfileProps) {
  if (!student) return null;

  return (
    <div className="hidden print:block w-full h-full bg-white text-slate-900" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      {/* Outer Border mimicking the design */}
      <div className="border-4 border-[#1e293b] rounded-3xl p-0 relative overflow-hidden bg-white flex flex-col h-[250mm] max-h-[2250mm] w-full mx-auto" style={{ pageBreakInside: 'avoid' }}>

        {/* Top Section */}
        <div className="bg-[#f1f5f9] pt-8 pb-4 px-8 relative flex justify-between items-start">
          <div className="z-10 mt-2 w-[60%]">
            <h1 className="text-2xl font-black text-[#1e293b] leading-tight tracking-wider uppercase">
              {student.biodata?.fullName}
            </h1>
            <p className="text-base text-slate-500 mt-1 font-medium">
              Siswa {student.cabang?.name ? `Cabang ${student.cabang.name}` : student.wilayah?.name ? `Wilayah ${student.wilayah.name}` : ''}
            </p>

            <div className="flex items-center gap-6 mt-3 text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{student.biodata?.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{student.wilayah?.name || 'Indonesia'}</span>
              </div>
            </div>
          </div>

          {/* Right Top Decor and Photo */}
          <div className="absolute top-0 right-8 w-44 h-56 bg-white border-x-4 border-b-4 border-[#1e293b] rounded-b-[2.5rem] z-0 flex items-center justify-center pt-2 shadow-sm">
            {student.biodata?.fotoBase64 ? (
              <img
                src={student.biodata.fotoBase64}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-[#1e293b] z-10 bg-white"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center border-4 border-[#1e293b] z-10">
                <User className="w-16 h-16 text-slate-400" />
              </div>
            )}
          </div>
        </div>

        {/* Content Section (Two Columns) */}
        <div className="grid grid-cols-12 gap-6 px-8 pt-6 pb-6 bg-white flex-1 overflow-hidden">

          {/* Left Column */}
          <div className="col-span-6 space-y-4">
            {/* TENTANG SAYA */}
            <section>
              <h2 className="text-lg font-bold text-[#1e293b] uppercase tracking-widest border-b-2 border-slate-200 pb-1 mb-2">
                Tentang Saya
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Profil siswa resmi terdaftar. Lahir di {student.biodata?.tempatLahir || '-'} pada {student.biodata?.tanggalLahir ? new Date(student.biodata.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}.
                Berjenis kelamin {student.biodata?.jenisKelamin === 'L' ? 'Laki-laki' : student.biodata?.jenisKelamin === 'P' ? 'Perempuan' : student.biodata?.jenisKelamin || '-'}, berkewarganegaraan {student.biodata?.kewarganegaraan || 'WNI'}.
                Alamat lengkap saat ini: {student.biodata?.address || '-'}.
              </p>
            </section>

            {/* RIWAYAT PENDIDIKAN */}
            <section>
              <h2 className="text-lg font-bold text-[#1e293b] uppercase tracking-widest border-b-2 border-slate-200 pb-1 mb-2 mt-4">
                Riwayat Pendidikan
              </h2>
              <div className="space-y-4">
                {student.riwayatPendidikan && student.riwayatPendidikan.length > 0 ? (
                  student.riwayatPendidikan.map((riwayat: any, index: number) => (
                    <div key={index}>
                      <p className="text-xs text-slate-500 font-semibold mb-1">
                        {riwayat.tanggalMasuk ? new Date(riwayat.tanggalMasuk).getFullYear() : 'N/A'} - {riwayat.tanggalKeluar ? new Date(riwayat.tanggalKeluar).getFullYear() : 'Sekarang'}
                      </p>
                      <p className="text-sm font-bold text-[#1e293b]">{riwayat.jenjang} {riwayat.cabang?.name}</p>
                      <p className="text-xs text-slate-600 mt-1">{riwayat.keterangan || 'Terdaftar sebagai siswa aktif'}</p>
                    </div>
                  ))
                ) : (
                  <div>
                    <p className="text-sm font-bold text-[#1e293b]">Pendidikan Saat Ini</p>
                    <p className="text-xs text-slate-600 mt-1">Terdaftar di Cabang {student.cabang?.name || '-'}</p>
                  </div>
                )}
              </div>
            </section>

            {/* INFO ADMINISTRASI */}
            <section>
              <h2 className="text-lg font-bold text-[#1e293b] uppercase tracking-widest border-b-2 border-slate-200 pb-1 mb-2 mt-4">
                Info Administrasi
              </h2>
              <ul className="space-y-2 text-sm text-slate-700 font-medium">
                <li>• <span className="font-bold">NIK:</span> {student.biodata?.nik || '-'}</li>
                <li>• <span className="font-bold">NISN:</span> {student.biodata?.nisn || '-'}</li>
                <li>• <span className="font-bold">NIS Lokal:</span> {student.biodata?.nisLokal || '-'}</li>
                <li>• <span className="font-bold">No Glodemy:</span> {student.biodata?.noGlodemy || '-'}</li>
                <li>• <span className="font-bold">Status:</span> {student.statusPool.replace('_', ' ')}</li>
              </ul>
            </section>
          </div>

          {/* Right Column */}
          <div className="col-span-6 space-y-4 pl-4 pt-[96px]">

            {/* DATA ORANG TUA */}
            <section>
              <h2 className="text-lg font-bold text-[#1e293b] uppercase tracking-widest border-b-2 border-slate-200 pb-1 mb-2">
                Data Orang Tua
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Data Ayah</p>
                  <p className="text-base font-bold text-[#1e293b] uppercase">{student.biodata?.namaAyah || 'TIDAK DIKETAHUI'}</p>
                  <div className="text-sm text-slate-600 mt-2 space-y-1">
                    <p><span className="font-semibold text-slate-700">Status:</span> {student.biodata?.statusHidupAyah || '-'}</p>
                    <p><span className="font-semibold text-slate-700">Pekerjaan:</span> {student.biodata?.pekerjaanAyah || '-'}</p>
                    <p><span className="font-semibold text-slate-700">Pendidikan:</span> {student.biodata?.pendidikanAyah || '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Data Ibu</p>
                  <p className="text-base font-bold text-[#1e293b] uppercase">{student.biodata?.namaIbu || 'TIDAK DIKETAHUI'}</p>
                  <div className="text-sm text-slate-600 mt-2 space-y-1">
                    <p><span className="font-semibold text-slate-700">Status:</span> {student.biodata?.statusHidupIbu || '-'}</p>
                    <p><span className="font-semibold text-slate-700">Pekerjaan:</span> {student.biodata?.pekerjaanIbu || '-'}</p>
                    <p><span className="font-semibold text-slate-700">Pendidikan:</span> {student.biodata?.pendidikanIbu || '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Kontak Darurat</p>
                  <p className="text-base font-bold text-[#1e293b] uppercase">{student.biodata?.kontakDaruratNama || 'TIDAK ADA'}</p>
                  <div className="text-sm text-slate-600 mt-2 space-y-1">
                    <p><span className="font-semibold text-slate-700">Hubungan:</span> {student.biodata?.kontakDaruratHubungan || '-'}</p>
                    <p><span className="font-semibold text-slate-700">Telepon:</span> {student.biodata?.kontakDaruratTelp || '-'}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* DATA AKADEMIK */}
            <section>
              <h2 className="text-lg font-bold text-[#1e293b] uppercase tracking-widest border-b-2 border-slate-200 pb-1 mb-2 mt-4">
                Data Akademik
              </h2>
              <ul className="space-y-2 text-sm text-slate-700 font-medium">
                <li>• <span className="font-bold">Kelas Saat Ini:</span> {student.siswaFormal?.kelas?.name || '-'}</li>
                <li>• <span className="font-bold">Grup Daimi:</span> {student.grupDaimi || '-'}</li>
              </ul>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
