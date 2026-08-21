import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface PortalStudentBiodata {
  id?: string;
  fullName: string;
  nik?: string | null;
  noKk?: string | null;
  nisn?: string | null;
  phone?: string | null;
  tempatLahir?: string | null;
  tanggalLahir?: string | Date | null;
  jenisKelamin?: string | null;
  kewarganegaraan?: string | null;
  anakKe?: number | null;
  jumlahSaudara?: number | null;
  namaAyah?: string | null;
  statusHidupAyah?: string | null;
  nikAyah?: string | null;
  tempatLahirAyah?: string | null;
  tanggalLahirAyah?: string | Date | null;
  pekerjaanAyah?: string | null;
  pendidikanAyah?: string | null;
  penghasilanAyah?: string | null;
  namaIbu?: string | null;
  statusHidupIbu?: string | null;
  nikIbu?: string | null;
  tempatLahirIbu?: string | null;
  tanggalLahirIbu?: string | Date | null;
  pekerjaanIbu?: string | null;
  pendidikanIbu?: string | null;
  penghasilanIbu?: string | null;
  alamatProvId?: string | null;
  alamatProvName?: string | null;
  alamatKabId?: string | null;
  alamatKabName?: string | null;
  alamatKecId?: string | null;
  alamatKecName?: string | null;
  alamatKelId?: string | null;
  alamatKelName?: string | null;
  alamatJalan?: string | null;
  fotoUrl?: string | null;
  ijazahUrl?: string | null;
  kkUrl?: string | null;
  akteUrl?: string | null;
}

export interface PortalStudentKelas {
  id: string;
  name: string;
  tingkat?: string | null;
}

export interface PortalStudentGrupDaimi {
  id: string;
  name: string;
  jenis?: string | null;
  ketua?: {
    id: string;
    name: string;
    phone?: string | null;
    position?: string | null;
  } | null;
}

export interface PortalStudentDataDaimi {
  id: string;
  grup?: PortalStudentGrupDaimi | null;
  kelas?: { id: string; name: string } | null;
}

export interface PortalStudent {
  id: string;
  isActive?: boolean;
  statusHafidz?: string | null;
  biodata?: PortalStudentBiodata | null;
  cabang?: { id: string; name: string } | null;
  wilayah?: { id: string; name: string } | null;
  siswaFormal?: { kelasId?: string | null; kelas?: PortalStudentKelas | null } | null;
  dataDaimi?: PortalStudentDataDaimi | null;
}

export interface WaliSantriLink {
  id: string;
  studentId: string;
  hubungan?: string | null;
  student: PortalStudent;
}

export const useGetPortalStudents = () => {
  return useQuery<WaliSantriLink[]>({
    queryKey: ['portal', 'students'],
    queryFn: async () => {
      const response = await apiClient.get<WaliSantriLink[]>('/portal/students');
      return response.data;
    },
  });
};
