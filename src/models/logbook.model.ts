export interface Logbook {
  id_logbook: number;
  tanggal: string;
  id_pengguna: number;
  judul_logbook: string;
  keterangan: string;
  link?: string;
  nama_pengguna?: string;
  created_at: Date;
  updated_at: Date;
}

export interface LogbookWithUser extends Logbook {
  owner_username: string;
  owner_nama_pengguna: string;
}

export interface LogbookWithPermissions extends LogbookWithUser {
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
}

export interface CreateLogbookRequest {
  tanggal: string;
  judul_kegiatan: string;
  detail_kegiatan: string;
  link_google_docs?: string;
}

export interface UpdateLogbookRequest {
  tanggal?: string;
  judul_kegiatan?: string;
  detail_kegiatan?: string;
  link_google_docs?: string;
}