import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface NilaiFormalHistory {
  id: string;
  studentId: string;
  mataPelajaranId: string;
  kelasId: string;
  tahunAjaran: string;
  semester: string;
  nilaiHarian?: number | null;
  nilaiPas?: number | null;
  nilaiAkhir?: number | null;
  predikat?: string | null;
  capaianKompetensi?: string | null;
  rataRataKelas?: number | null;
  mataPelajaran?: { id: string; kodeMapel: string; name: string; grupMapel: string };
  kelas?: { id: string; name: string; tingkat?: number };
}

export const useGetNilaiHistory = (studentId: string) => {
  return useQuery<NilaiFormalHistory[]>({
    queryKey: ['nilai-history', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const response = await apiClient.get<NilaiFormalHistory[]>(`/formal/nilai/student/${studentId}`);
      return response.data;
    },
    enabled: !!studentId,
  });
};

export interface MapelWithKeaktifan {
  id: string;
  kodeMapel: string;
  name: string;
  grupMapel: string;
  isActive: boolean;
  keaktifanGrup?: { grupDaimiId: string; isActive: boolean }[];
}

export const useGetMapelList = () => {
  return useQuery<MapelWithKeaktifan[]>({
    queryKey: ['mapel'],
    queryFn: async () => {
      const response = await apiClient.get<MapelWithKeaktifan[]>('/formal/mapel');
      return response.data;
    },
  });
};

const GRUP_MAPEL_ORDER: Record<string, number> = {
  'Umum': 0,
  'Agama Islam': 1,
  'Muatan Lokal': 2,
};

export const sortMapelList = <T extends { grupMapel: string; name: string }>(mapelList: T[]): T[] => {
  return [...mapelList].sort((a, b) => {
    const orderA = GRUP_MAPEL_ORDER[a.grupMapel] ?? 99;
    const orderB = GRUP_MAPEL_ORDER[b.grupMapel] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
};

// Absennya entri keaktifan untuk grup daimi berarti mapel tersebut TIDAK diajarkan
// pada grup itu, konsisten dengan logika di getERaporNilai (backend) dan KeaktifanMapelModal.
export const getKeteranganTanpaNilai = (
  mapel: MapelWithKeaktifan,
  grupDaimiId?: string | null,
  grupDaimiName?: string | null
): string => {
  if (mapel.isActive === false) return 'Mapel tidak aktif';
  if (grupDaimiId) {
    const entry = mapel.keaktifanGrup?.find(k => k.grupDaimiId === grupDaimiId);
    const activeForGrup = entry ? entry.isActive : false;
    if (!activeForGrup) return `Tidak diajarkan (Grup ${grupDaimiName || '-'})`;
  }
  return 'Belum ada nilai';
};
