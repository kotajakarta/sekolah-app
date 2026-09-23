export type TingkatSp = 'SP 1' | 'SP 2' | 'SP 3';

export type KategoriPelanggaran = 'Ringan' | 'Sedang' | 'Berat';

export type StatusSp = 'Aktif' | 'Masa Pembinaan' | 'Selesai' | 'Ditingkatkan' | 'Sidang Disiplin';

export type StatusPelanggaran = 'PENDING' | 'DISETUJUI' | 'DITOLAK';

export interface PelanggaranRecord {
  id: string;
  tanggal: string; // ISO format or YYYY-MM-DD
  siswaId: string;
  namaSiswa: string;
  nisn?: string;
  nisLokal: string;
  kelas: string;
  wilayahId?: string;
  wilayahName?: string;
  cabangId?: string;
  cabangName?: string;
  jenisPelanggaran: string;
  kategori: KategoriPelanggaran;
  poin: number;
  keterangan?: string;
  lokasi?: string;
  tindakanPembinaan?: string;
  dicatatOleh?: string;
  status?: StatusPelanggaran;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

export interface SuratPeringatanRecord {
  id: string;
  tanggalTerbit: string;
  nomorSp: string;
  siswaId: string;
  namaSiswa: string;
  nisLokal: string;
  kelas: string;
  wilayahId?: string;
  wilayahName?: string;
  cabangId?: string;
  cabangName?: string;
  tingkatSp: TingkatSp;
  status: StatusSp;
  alasan: string;
  berlakuHingga: string;
  poinAkumulasi: number;
  tembusan?: string;
  dokumenSpUrl?: string | null;
  ukuranDokumen?: string | null;
  statusApproval?: StatusPelanggaran;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

export interface PengeluaranSiswaRecord {
  id: string;
  tanggalKeluar: string;
  siswaId: string;
  namaSiswa: string;
  nisLokal: string;
  kelas: string;
  wilayahId?: string;
  wilayahName?: string;
  cabangId?: string;
  cabangName?: string;
  alasanPemberhentian: string;
  kategoriAlasan: 'Akumulasi Poin Maksimal' | 'Pelanggaran Berat Syariat / Asusila' | 'Mangkir / Kabur' | 'Kriminal / Narkoba' | 'Lainnya';
  nomorSk: string;
  tanggalSk: string;
  dokumenSkUrl: string;
  ukuranDokumen?: string;
  pejabatTtd: string;
  keteranganTambahan?: string;
  status?: StatusPelanggaran;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

export interface IndisiplinerStats {
  totalPelanggaran: number;
  totalPoin: number;
  totalSp: number;
  spAktif: number;
  totalPengeluaran: number;
  pelanggaranPending?: number;
  spPending?: number;
  pengeluaranPending?: number;
}

export type IndisiplinerTab = 'pelanggaran' | 'sp' | 'pengeluaran';
