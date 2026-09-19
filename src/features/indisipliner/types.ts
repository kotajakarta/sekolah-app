export type TingkatSp = 'SP 1' | 'SP 2' | 'SP 3';

export type KategoriPelanggaran = 'Ringan' | 'Sedang' | 'Berat';

export type StatusSp = 'Aktif' | 'Masa Pembinaan' | 'Selesai' | 'Ditingkatkan' | 'Sidang Disiplin';

export interface PelanggaranRecord {
  id: string;
  tanggal: string; // ISO format or YYYY-MM-DD
  siswaId: string;
  namaSiswa: string;
  nisn?: string;
  nisLokal: string;
  kelas: string;
  jenisPelanggaran: string;
  kategori: KategoriPelanggaran;
  poin: number;
  keterangan?: string;
  lokasi?: string;
  tindakanPembinaan?: string;
  dicatatOleh?: string;
}

export interface SuratPeringatanRecord {
  id: string;
  tanggalTerbit: string;
  nomorSp: string;
  siswaId: string;
  namaSiswa: string;
  nisLokal: string;
  kelas: string;
  tingkatSp: TingkatSp;
  status: StatusSp;
  alasan: string;
  berlakuHingga: string;
  poinAkumulasi: number;
  tembusan?: string;
}

export interface PengeluaranSiswaRecord {
  id: string;
  tanggalKeluar: string;
  siswaId: string;
  namaSiswa: string;
  nisLokal: string;
  kelas: string;
  alasanPemberhentian: string;
  kategoriAlasan: 'Akumulasi Poin Maksimal' | 'Pelanggaran Berat Syariat / Asusila' | 'Mangkir / Kabur' | 'Kriminal / Narkoba' | 'Lainnya';
  nomorSk: string;
  tanggalSk: string;
  dokumenSkUrl: string;
  ukuranDokumen?: string;
  pejabatTtd: string;
  keteranganTambahan?: string;
}

export type IndisiplinerTab = 'pelanggaran' | 'sp' | 'pengeluaran';
