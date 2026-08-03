import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface RaporCetakHafalan {
  awalPutaran: number | null;
  awalJuz: number | null;
  targetPutaran: number | null;
  targetJuz: number | null;
  akhirPutaran: number | null;
  akhirJuz: number | null;
  jumlahJuz: number | null;
  jumlahHalaman: number | null;
}

export interface RaporCetakSiswa {
  id: string;
  fullName: string;
  nisn: string;
  nis: string;
  jenisGrupDaimi: string;
  isHafizlik: boolean;
  // Only present when the student's grup daimi is HAFIZLIK — render this section
  // conditionally.
  hafalan: RaporCetakHafalan | null;
  statusHafidz: string | null;
  tempatLahir: string;
  tanggalLahir: string | null;
  jenisKelamin: string;
  namaAyah: string;
  namaIbu: string;
  pekerjaanAyah: string;
  address: string;
}

export interface RaporCetakSekolah {
  namaLembaga: string;
  npsn: string;
  nspp: string;
  namaKetua: string;
  cabangName: string;
}

export interface RaporCetakAkademik {
  kelasName: string;
  tingkat: string;
  tahunAjaran: string;
  semester: string;
  waliKelasName: string;
}

export interface RaporCetakNilaiItem {
  mataPelajaranId: string;
  kodeMapel: string;
  namaMapel: string;
  grupMapel: string;
  nilaiAkhir: number | null;
  predikat: string | null;
  rataRataKelas: number | null;
}

export interface RaporCetakPresensi {
  sakit: number;
  izin: number;
  alpa: number;
  catatanWaliKelas: string;
  statusAkhir: string;
}

export interface RaporCetakData {
  siswa: RaporCetakSiswa;
  sekolah: RaporCetakSekolah;
  akademik: RaporCetakAkademik;
  // Already sorted by the backend: Umum -> Agama Islam -> Muatan Lokal, then kodeMapel asc.
  nilai: RaporCetakNilaiItem[];
  presensi: RaporCetakPresensi;
}

// GET /portal/students/:studentId/rapor/cetak?tahunAjaran=&semester= — fetched
// on-demand once the wali picks a period, not eagerly on page load.
export const useGetRaporCetak = (
  studentId: string | null,
  tahunAjaran: string | null,
  semester: string | null
) => {
  return useQuery<RaporCetakData>({
    queryKey: ['portal', 'rapor-cetak', studentId, tahunAjaran, semester],
    queryFn: async () => {
      const response = await apiClient.get<RaporCetakData>(
        `/portal/students/${studentId}/rapor/cetak`,
        { params: { tahunAjaran, semester } }
      );
      return response.data;
    },
    enabled: !!studentId && !!tahunAjaran && !!semester,
  });
};
