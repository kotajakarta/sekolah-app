import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface Biodata {
  id: string;
  fullName: string;
  address?: string | null;
  phone?: string | null;
  nik?: string | null;
  nisLokal?: string | null;
  noGlodemy?: string | null;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  jenisKelamin?: string | null;
  kewarganegaraan?: string | null;
  namaAyah?: string | null;
  statusHidupAyah?: string | null;
  pekerjaanAyah?: string | null;
  pendidikanAyah?: string | null;
  namaIbu?: string | null;
  statusHidupIbu?: string | null;
  pekerjaanIbu?: string | null;
  pendidikanIbu?: string | null;
  kontakDaruratNama?: string | null;
  kontakDaruratTelp?: string | null;
  kontakDaruratHubungan?: string | null;
  fotoBase64?: string | null;
  ijazahBase64?: string | null;
  kkBase64?: string | null;
  nisn?: string | null;
  alamatProvId?: string | null;
  alamatProvName?: string | null;
  alamatKabId?: string | null;
  alamatKabName?: string | null;
  alamatKecId?: string | null;
  alamatKecName?: string | null;
  alamatKelId?: string | null;
  alamatKelName?: string | null;
  alamatJalan?: string | null;
}

export interface Wilayah {
  id: string;
  name: string;
}

export interface Cabang {
  id: string;
  name: string;
  wilayahId: string;
}

export interface RiwayatPendidikan {
  id: string;
  studentId: string;
  cabangId: string;
  tanggalMasuk: string;
  tanggalKeluar?: string | null;
  statusAkhir?: string | null;
  catatan?: string | null;
  cabang?: Cabang;
}

export interface Student {
  id: string;
  biodataId: string;
  wilayahId: string;
  cabangId?: string | null;
  statusPool: string;
  biodata?: Biodata;
  wilayah?: Wilayah;
  cabang?: Cabang;
  riwayatPendidikan?: RiwayatPendidikan[];
  jenisSiswa?: string | null;
  grupDaimi?: string | null;
  dataDaimi?: {
    id: string;
    grupId?: string | null;
    grup?: {
      id: string;
      name: string;
      jenis?: string | null;
    } | null;
  } | null;
  siswaFormal?: {
    isVerval?: boolean;
    kelasId?: string | null;
    kelas?: {
      id: string;
      name: string;
      tingkat?: string | null;
      isActive?: boolean;
      tahunAjaran?: string | null;
      lembagaMuadalah?: {
        id: string;
        name: string;
      } | null;
    } | null;
  } | null;
  isActive?: boolean;
}

export const useGetStudents = () => {
  return useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await apiClient.get<Student[]>('/students');
      return response.data;
    },
  });
};
