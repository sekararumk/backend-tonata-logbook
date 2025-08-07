import { Pool } from 'pg';
import { Logbook, LogbookWithUser, CreateLogbookRequest, UpdateLogbookRequest } from '../models/logbook.model';

// PostgreSQL connection - Sesuaikan dengan database Anda
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tonata_logbook', // Ganti dengan nama database Anda
  password: 'pgadmin4', // Ganti dengan password database Anda
  port: 5432,
});

export const getLogbookData = async (): Promise<LogbookWithUser[]> => {
  try {
    const result = await pool.query(`
      SELECT 
        l.*,
        p.username as owner_username,
        p.nama_pengguna as owner_nama_pengguna
      FROM logbook l
      LEFT JOIN pengguna p ON l.id_pengguna = p.id_pengguna
      ORDER BY l.created_at DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Error fetching logbook data:', error);
    throw new Error('Failed to fetch logbook data');
  }
};

export const getLogbookDetail = async (id: number): Promise<LogbookWithUser | null> => {
  try {
    const result = await pool.query(`
      SELECT 
        l.*,
        p.username as owner_username,
        p.nama_pengguna as owner_nama_pengguna
      FROM logbook l
      LEFT JOIN pengguna p ON l.id_pengguna = p.id_pengguna
      WHERE l.id_logbook = $1
    `, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching logbook detail:', error);
    throw new Error('Failed to fetch logbook detail');
  }
};

export const addLogbookData = async (data: CreateLogbookRequest, userId: number): Promise<Logbook> => {
  try {
    const result = await pool.query(
      `INSERT INTO logbook (tanggal, id_pengguna, judul_logbook, keterangan, link, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [data.tanggal, userId, data.judul_kegiatan, data.detail_kegiatan, data.link_google_docs]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error adding logbook data:', error);
    throw new Error('Failed to add logbook data');
  }
};

export const updateLogbookData = async (id: number, data: UpdateLogbookRequest): Promise<Logbook | null> => {
  try {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.tanggal !== undefined) {
      fields.push(`tanggal = $${paramCount}`);
      values.push(data.tanggal);
      paramCount++;
    }
    if (data.judul_kegiatan !== undefined) {
      fields.push(`judul_logbook = $${paramCount}`);
      values.push(data.judul_kegiatan);
      paramCount++;
    }
    if (data.detail_kegiatan !== undefined) {
      fields.push(`keterangan = $${paramCount}`);
      values.push(data.detail_kegiatan);
      paramCount++;
    }
    if (data.link_google_docs !== undefined) {
      fields.push(`link = $${paramCount}`);
      values.push(data.link_google_docs);
      paramCount++;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE logbook SET ${fields.join(', ')} WHERE id_logbook = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating logbook data:', error);
    throw new Error('Failed to update logbook data');
  }
};

export const deleteLogbookData = async (id: number): Promise<boolean> => {
  try {
    const result = await pool.query(
      'DELETE FROM logbook WHERE id_logbook = $1 RETURNING id_logbook',
      [id]
    );
    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error('Error deleting logbook data:', error);
    throw new Error('Failed to delete logbook data');
  }
}; 