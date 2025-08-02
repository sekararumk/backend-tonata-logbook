import express, { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Define custom Request interface with user property
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    [key: string]: any;
  };
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001; // Port berbeda dari server utama

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tonata_logbook',
  password: 'pgadmin4',
  port: 5432,
});

// Middleware untuk verifikasi token
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log('authenticateToken middleware called');
  console.log('Authorization header:', req.headers.authorization);

  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    console.log('Token decoded successfully:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Create logbook table if it doesn't exist (dengan struktur yang diminta)
const createLogbookTable = async () => {
  try {
    // First, check if table exists and its structure
    const checkTableQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'logbook'
      ORDER BY ordinal_position;
    `;

    const existingColumns = await pool.query(checkTableQuery);
    console.log('Existing logbook table columns:', existingColumns.rows);

    const query = `
      CREATE TABLE IF NOT EXISTS logbook (
        id_logbook SERIAL PRIMARY KEY,
        tanggal DATE NOT NULL,
        judul_logbook VARCHAR(200) NOT NULL,
        keterangan TEXT NOT NULL,
        link VARCHAR(500),
        nama_pengguna VARCHAR(100) NOT NULL,
        id_pengguna INTEGER REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
    console.log('Logbook table created or already exists');

    // Check if we need to add missing columns
    const currentColumns = await pool.query(checkTableQuery);
    const columnNames = currentColumns.rows.map(row => row.column_name);

    // Check if id_logbook has proper sequence
    const sequenceCheck = await pool.query(`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_name = 'logbook' AND column_name = 'id_logbook'
    `);
    console.log('id_logbook column default:', sequenceCheck.rows);

    // If id_logbook doesn't have a sequence, fix it
    if (sequenceCheck.rows.length > 0 && !sequenceCheck.rows[0].column_default) {
      console.log('Fixing id_logbook column to have auto-increment...');

      // Create sequence
      await pool.query(`CREATE SEQUENCE IF NOT EXISTS logbook_id_logbook_seq`);

      // Set the sequence to start from the next available ID
      const maxIdResult = await pool.query(`SELECT COALESCE(MAX(id_logbook), 0) + 1 as next_id FROM logbook`);
      const nextId = maxIdResult.rows[0].next_id;
      await pool.query(`ALTER SEQUENCE logbook_id_logbook_seq RESTART WITH ${nextId}`);

      // Set the column default to use the sequence
      await pool.query(`ALTER TABLE logbook ALTER COLUMN id_logbook SET DEFAULT nextval('logbook_id_logbook_seq')`);

      // Make sure the sequence is owned by the column
      await pool.query(`ALTER SEQUENCE logbook_id_logbook_seq OWNED BY logbook.id_logbook`);

      console.log(`Fixed id_logbook column with sequence starting from ${nextId}`);
    }

    // Add missing columns if they don't exist
    if (!columnNames.includes('nama_pengguna')) {
      console.log('Adding missing nama_pengguna column...');
      await pool.query('ALTER TABLE logbook ADD COLUMN nama_pengguna VARCHAR(100)');
    }

    if (!columnNames.includes('created_at')) {
      console.log('Adding missing created_at column...');
      await pool.query('ALTER TABLE logbook ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    }

    if (!columnNames.includes('updated_at')) {
      console.log('Adding missing updated_at column...');
      await pool.query('ALTER TABLE logbook ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    }

    // Check columns again after adding missing ones
    const finalColumns = await pool.query(checkTableQuery);
    console.log('Final logbook table columns:', finalColumns.rows);

    // Update existing records that have null nama_pengguna
    console.log('Updating existing records with missing nama_pengguna...');
    const updateResult = await pool.query(`
      UPDATE logbook
      SET nama_pengguna = COALESCE(p.nama_pengguna, p.username, 'User ID: ' || logbook.id_pengguna)
      FROM pengguna p
      WHERE logbook.id_pengguna = p.id_pengguna
      AND (logbook.nama_pengguna IS NULL OR logbook.nama_pengguna = '')
    `);
    console.log(`Updated ${updateResult.rowCount} records with missing nama_pengguna`);

  } catch (error) {
    console.error('Error creating logbook table:', error);
  }
};

// Initialize database
createLogbookTable();

// Endpoint untuk menambah logbook baru
app.post('/api/tambah-logbook', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tanggal, judul_logbook, keterangan, link } = req.body;
    const userId = req.user!.userId;

    // Validasi input
    if (!tanggal || !judul_logbook || !keterangan) {
      return res.status(400).json({ 
        error: 'Tanggal, judul logbook, dan keterangan diperlukan' 
      });
    }

    // Ambil nama pengguna dari database berdasarkan id_pengguna
    const userResult = await pool.query(
      'SELECT COALESCE(nama_pengguna, username) as nama_pengguna FROM pengguna WHERE id_pengguna = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const nama_pengguna = userResult.rows[0].nama_pengguna;

    // Insert logbook baru
    const result = await pool.query(
      `INSERT INTO logbook (
        tanggal, 
        judul_logbook, 
        keterangan, 
        link, 
        nama_pengguna, 
        id_pengguna
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tanggal, judul_logbook, keterangan, link || null, nama_pengguna, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Logbook berhasil ditambahkan',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Tambah logbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint untuk mendapatkan semua logbook
app.get('/api/logbook', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('GET /api/logbook called by user:', req.user);
    const result = await pool.query(`
      SELECT
        l.id_logbook,
        l.tanggal,
        l.judul_logbook,
        l.keterangan,
        l.link,
        COALESCE(p.nama_pengguna, p.username, l.nama_pengguna, 'User ID: ' || l.id_pengguna) as nama_pengguna,
        l.id_pengguna,
        l.created_at,
        l.updated_at
      FROM logbook l
      LEFT JOIN pengguna p ON l.id_pengguna = p.id_pengguna
      ORDER BY l.tanggal DESC, l.created_at DESC
    `);

    console.log('Logbook data with user names:', result.rows);

    res.json({
      success: true,
      message: 'Data logbook berhasil diambil',
      data: result.rows
    });
  } catch (error) {
    console.error('Get logbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint untuk mendapatkan logbook berdasarkan ID
app.get('/api/logbook/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        l.id_logbook,
        l.tanggal,
        l.judul_logbook,
        l.keterangan,
        l.link,
        p.nama_pengguna,
        l.id_pengguna,
        l.created_at,
        l.updated_at
      FROM logbook l 
      LEFT JOIN pengguna p ON l.id_pengguna = p.id_pengguna
      WHERE l.id_logbook = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Logbook tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Data logbook berhasil diambil',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get single logbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint untuk update logbook (hanya pemilik data)
app.put('/api/logbook/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tanggal, judul_logbook, keterangan, link } = req.body;
    const userId = req.user!.userId;

    // Cek kepemilikan data
    const checkOwnership = await pool.query(
      'SELECT id_pengguna FROM logbook WHERE id_logbook = $1',
      [id]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(404).json({ error: 'Logbook tidak ditemukan' });
    }

    if (checkOwnership.rows[0].id_pengguna !== userId) {
      return res.status(403).json({ 
        error: 'Anda tidak memiliki izin untuk mengedit data ini' 
      });
    }

    // Update logbook
    const result = await pool.query(
      `UPDATE logbook 
       SET tanggal = $1, judul_logbook = $2, keterangan = $3, link = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id_logbook = $5 RETURNING *`,
      [tanggal, judul_logbook, keterangan, link || null, id]
    );

    // Ambil data yang sudah diupdate dengan nama pengguna
    const updatedResult = await pool.query(`
      SELECT 
        l.id_logbook,
        l.tanggal,
        l.judul_logbook,
        l.keterangan,
        l.link,
        p.nama_pengguna,
        l.id_pengguna,
        l.created_at,
        l.updated_at
      FROM logbook l 
      LEFT JOIN pengguna p ON l.id_pengguna = p.id_pengguna
      WHERE l.id_logbook = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Logbook berhasil diupdate',
      data: updatedResult.rows[0]
    });
  } catch (error) {
    console.error('Update logbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint untuk delete logbook (hanya pemilik data)
app.delete('/api/logbook/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Cek kepemilikan data
    const checkOwnership = await pool.query(
      'SELECT id_pengguna FROM logbook WHERE id_logbook = $1',
      [id]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(404).json({ error: 'Logbook tidak ditemukan' });
    }

    if (checkOwnership.rows[0].id_pengguna !== userId) {
      return res.status(403).json({ 
        error: 'Anda tidak memiliki izin untuk menghapus data ini' 
      });
    }

    // Delete logbook
    await pool.query('DELETE FROM logbook WHERE id_logbook = $1', [id]);

    res.json({
      success: true,
      message: 'Logbook berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete logbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint untuk mendapatkan logbook milik user yang sedang login
app.get('/api/my-logbook', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const result = await pool.query(`
      SELECT 
        l.id_logbook,
        l.tanggal,
        l.judul_logbook,
        l.keterangan,
        l.link,
        p.nama_pengguna,
        l.id_pengguna,
        l.created_at,
        l.updated_at
      FROM logbook l 
      LEFT JOIN pengguna p ON l.id_pengguna = p.id_pengguna
      WHERE l.id_pengguna = $1 
      ORDER BY l.tanggal DESC, l.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      message: 'Data logbook Anda berhasil diambil',
      data: result.rows
    });
  } catch (error) {
    console.error('Get my logbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    message: 'Tambah Logbook Server is running!',
    endpoints: {
      'POST /api/tambah-logbook': 'Tambah logbook baru',
      'GET /api/logbook': 'Ambil semua logbook',
      'GET /api/logbook/:id': 'Ambil logbook berdasarkan ID',
      'PUT /api/logbook/:id': 'Update logbook',
      'DELETE /api/logbook/:id': 'Hapus logbook',
      'GET /api/my-logbook': 'Ambil logbook milik user'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Tambah Logbook Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
