import React from 'react';
import { SIKAP_FIELDS, STATUS_HAFIDZ_LABELS } from './eRaporConstants';

interface RaporCetakDocumentProps {
  cetakData: any;
}

export default function RaporCetakDocument({ cetakData }: RaporCetakDocumentProps) {
  return (
    <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-xl max-w-4xl mx-auto space-y-6 text-slate-900 font-sans print:shadow-none print:border-none print:p-0 print:space-y-3 print:max-w-none">
      {/* Kop Rapor */}
      <div className="avoid-break border-b-2 border-slate-900 pb-4 text-center space-y-1 print:pb-2">
        <h2 className="text-xl font-extrabold uppercase tracking-wider text-slate-900">{cetakData.sekolah.namaLembaga}</h2>
        <p className="text-xs font-medium text-slate-700">
          NPSN: {cetakData.sekolah.npsn} | NSPP: {cetakData.sekolah.nspp} | Cabang: {cetakData.sekolah.cabangName}
        </p>
        <p className="text-sm font-bold tracking-widest text-emerald-800 uppercase mt-2 print:mt-1">
          LAPORAN HASIL BELAJAR (RAPOR MUADALAH)
        </p>
      </div>

      {/* Identitas Siswa & Kelas */}
      <div className="avoid-break grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 print:p-2 print:gap-2">
        <div className="space-y-1.5">
          <div className="flex"><span className="w-32 font-semibold text-slate-600">Nama Siswa</span>: <span className="font-bold ml-1">{cetakData.siswa.fullName}</span></div>
          <div className="flex"><span className="w-32 font-semibold text-slate-600">Jenis Grup Daimi</span>: <span className="font-bold ml-1 text-teal-800">{cetakData.siswa.jenisGrupDaimi || '-'}</span></div>
          <div className="flex"><span className="w-32 font-semibold text-slate-600">NISN / NIS</span>: <span className="font-medium ml-1">{cetakData.siswa.nisn || '-'} / {cetakData.siswa.nis || '-'}</span></div>
          <div className="flex"><span className="w-32 font-semibold text-slate-600">Tempat, Tgl Lahir</span>: <span className="font-medium ml-1">{cetakData.siswa.tempatLahir}, {cetakData.siswa.tanggalLahir ? new Date(cetakData.siswa.tanggalLahir).toLocaleDateString('id-ID') : '-'}</span></div>
        </div>
        <div className="space-y-1.5">
          <div className="flex"><span className="w-32 font-semibold text-slate-600">Kelas / Tingkat</span>: <span className="font-bold ml-1">{cetakData.akademik.kelasName} (Tingkat {cetakData.akademik.tingkat})</span></div>
          <div className="flex"><span className="w-32 font-semibold text-slate-600">Tahun Ajaran</span>: <span className="font-medium ml-1">{cetakData.akademik.tahunAjaran}</span></div>
          <div className="flex"><span className="w-32 font-semibold text-slate-600">Semester</span>: <span className="font-medium ml-1">{cetakData.akademik.semester}</span></div>
        </div>
      </div>

      {/* Tabel Nilai Hasil Belajar */}
      <div className="space-y-2 print:space-y-1">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">A. Capaian Hasil Belajar</h3>
        <table className="w-full text-xs border-collapse border border-slate-300">
          <thead className="bg-slate-100 text-slate-900 font-bold">
            <tr>
              <th className="border border-slate-300 p-2 print:p-1 text-center w-12">No</th>
              <th className="border border-slate-300 p-2 print:p-1 text-left">Mata Pelajaran</th>
              <th className="border border-slate-300 p-2 print:p-1 text-center w-24">Nilai Akhir</th>
              <th className="border border-slate-300 p-2 print:p-1 text-center w-24">Rata-rata Kelas</th>
              <th className="border border-slate-300 p-2 print:p-1 text-center w-24">Predikat</th>
            </tr>
          </thead>
          <tbody>
            {cetakData.nilai.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-slate-300 p-4 text-center text-slate-500">Belum ada nilai yang di-input.</td>
              </tr>
            ) : (
              cetakData.nilai.map((n: any, idx: number) => (
                <tr key={n.mataPelajaranId}>
                  <td className="border border-slate-300 p-2 print:p-1 text-center font-medium">{idx + 1}</td>
                  <td className="border border-slate-300 p-2 print:p-1 font-semibold">{n.namaMapel}</td>
                  <td className="border border-slate-300 p-2 print:p-1 text-center font-bold">{n.nilaiAkhir ?? '-'}</td>
                  <td className="border border-slate-300 p-2 print:p-1 text-center font-semibold text-slate-600">{n.rataRataKelas ?? '-'}</td>
                  <td className="border border-slate-300 p-2 print:p-1 text-center font-bold text-emerald-700">{n.predikat || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sikap & Presensi */}
      <div className="avoid-break border border-slate-300 rounded-lg p-3 space-y-1.5 text-xs print:p-2 print:space-y-1">
        <h4 className="font-bold text-slate-900 uppercase">B. Ketidakhadiran</h4>
        <div className="grid grid-cols-3 gap-2 text-slate-700">
          <div className="flex justify-between"><span>Sakit</span><span className="font-bold">{cetakData.presensi.sakit} hari</span></div>
          <div className="flex justify-between"><span>Izin</span><span className="font-bold">{cetakData.presensi.izin} hari</span></div>
          <div className="flex justify-between"><span>Alpa</span><span className="font-bold">{cetakData.presensi.alpa} hari</span></div>
        </div>
      </div>

      {/* Sikap */}
      <div className="avoid-break border border-slate-300 rounded-lg p-3 space-y-1.5 text-xs print:p-2 print:space-y-1">
        <h4 className="font-bold text-slate-900 uppercase">C. Sikap & Perilaku</h4>
        <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-slate-700">
          {SIKAP_FIELDS.map(f => (
            <div key={f.key} className="flex justify-between border-b border-slate-100 pb-1">
              <span>{f.label}</span>
              <span className="font-bold text-emerald-700">{(cetakData.presensi as any)[f.key]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Catatan Wali Kelas */}
      <div className="avoid-break border border-slate-300 rounded-lg p-3 space-y-1 text-xs print:p-2">
        <h4 className="font-bold text-slate-900 uppercase">D. Catatan Wali Kelas</h4>
        <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded border border-slate-200">
          "{cetakData.presensi.catatanWaliKelas}"
        </p>
      </div>

      {/* Hafalan Al-Qur'an (Hafizlik) atau Status Hafidz (non-Hafizlik) */}
      <div className="avoid-break border border-slate-300 rounded-lg p-3 space-y-1.5 text-xs print:p-2 print:space-y-1">
        <h4 className="font-bold text-slate-900 uppercase">E. {cetakData.siswa.isHafizlik ? "Capaian Hafalan Al-Qur'an" : 'Status Hafidz'}</h4>
        {cetakData.siswa.isHafizlik ? (
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead className="bg-slate-100 text-slate-900 font-bold">
              <tr>
                <th className="border border-slate-300 p-1.5 text-left">Keterangan</th>
                <th className="border border-slate-300 p-1.5 text-center w-24">Putaran</th>
                <th className="border border-slate-300 p-1.5 text-center w-24">Juz</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-1.5 font-medium">Awal Semester</td>
                <td className="border border-slate-300 p-1.5 text-center">{cetakData.siswa.hafalan?.awalPutaran ?? '-'}</td>
                <td className="border border-slate-300 p-1.5 text-center">{cetakData.siswa.hafalan?.awalJuz ?? '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-1.5 font-medium">Target Semester</td>
                <td className="border border-slate-300 p-1.5 text-center">{cetakData.siswa.hafalan?.targetPutaran ?? '-'}</td>
                <td className="border border-slate-300 p-1.5 text-center">{cetakData.siswa.hafalan?.targetJuz ?? '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-1.5 font-medium">Akhir Semester</td>
                <td className="border border-slate-300 p-1.5 text-center">{cetakData.siswa.hafalan?.akhirPutaran ?? '-'}</td>
                <td className="border border-slate-300 p-1.5 text-center">{cetakData.siswa.hafalan?.akhirJuz ?? '-'}</td>
              </tr>
              <tr className="bg-emerald-50">
                <td className="border border-slate-300 p-1.5 font-bold text-emerald-800">Total Capaian Hafalan</td>
                <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-700" colSpan={2}>
                  {cetakData.siswa.hafalan?.jumlahJuz ?? '-'} Juz {cetakData.siswa.hafalan?.jumlahHalaman ?? '-'} Halaman
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="flex justify-between text-slate-700">
            <span>Status Hafidz</span>
            <span className="font-bold text-emerald-700">
              {cetakData.siswa.statusHafidz ? (STATUS_HAFIDZ_LABELS[cetakData.siswa.statusHafidz] || cetakData.siswa.statusHafidz) : '-'}
            </span>
          </div>
        )}
      </div>

      {/* Box Tanda Tangan */}
      <div className="avoid-break pt-8 grid grid-cols-2 gap-8 text-xs text-center print:pt-4 print:gap-4">
        <div className="space-y-12 print:space-y-6">
          <p>Orang Tua / Wali Siswa</p>
          <p className="font-bold underline">( ............................................ )</p>
        </div>
        <div className="space-y-12 print:space-y-6">
          <p>Wali Kelas</p>
          <p className="font-bold underline">{cetakData.akademik.waliKelasName}</p>
        </div>
      </div>

      <div className="avoid-break pt-4 text-center text-xs space-y-12 print:space-y-6">
        <p>Mengetahui,<br /><span className="font-semibold">{cetakData.sekolah.namaKetua}</span></p>
        <p className="font-bold underline">( ............................................ )</p>
      </div>
    </div>
  );
}
