import express, { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Define custom Request interface with user property
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    [key: string]: any;
  };
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('Connected to PostgreSQL database successfully!');
    release();
  }
});

// Create pengguna table if it doesn't exist
const createPenggunaTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS pengguna (
        id_pengguna SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nama_pengguna VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
    console.log('Pengguna table created or already exists');
  } catch (error) {
    console.error('Error creating pengguna table:', error);
  }
};

// Create logbook table if it doesn't exist
const createLogbookTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS logbook (
        id_logbook SERIAL PRIMARY KEY,
        judul VARCHAR(200) NOT NULL,
        deskripsi TEXT NOT NULL,
        tanggal DATE NOT NULL,
        kategori VARCHAR(50) DEFAULT 'Umum',
        id_pengguna INTEGER REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
    console.log('Logbook table created or already exists');
  } catch (error) {
    console.error('Error creating logbook table:', error);
  }
};

// Initialize database
const initializeDatabase = async () => {
  await createPenggunaTable();
  await createLogbookTable();
};

initializeDatabase();

// Routes

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ message: 'Server is running!' });
});

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, nama_pengguna } = req.body;

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Cek apakah username sudah ada
    const userCheck = await pool.query(
      'SELECT * FROM pengguna WHERE username = $1',
      [username]
    );
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password dengan bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Simpan user baru ke database
    const result = await pool.query(
      'INSERT INTO pengguna (username, password, nama_pengguna) VALUES ($1, $2, $3) RETURNING id_pengguna, username, nama_pengguna',
      [username, hashedPassword, nama_pengguna || username]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    console.log("\n--- Login attempt started ---");
    
    // 1. Cek apa yang diterima dari frontend
    console.log("Request body received:", req.body);
    const { username, password } = req.body;

    // Pastikan username dan password tidak kosong
    if (!username || !password) {
        console.log("Login failed: Username or password missing in request.");
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        // 2. Cari user di database
        console.log(`Searching for user: '${username}' in the database...`);
        const user = await pool.query('SELECT * FROM pengguna WHERE username = $1', [username]);

        // 3. Cek apakah user ditemukan
        if (user.rows.length === 0) {
            console.log("Login failed: User not found in database.");
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const foundUser = user.rows[0];
        console.log("User found in DB:", foundUser);

        // 4. Bandingkan password
        console.log("Comparing passwords...");
        console.log("  - Plain password from form:", password);
        console.log("  - Password from DB:", foundUser.password);

        // Cek apakah password di database sudah di-hash atau masih plain text
        let isPasswordMatch = false;
        if (foundUser.password.startsWith('$2b$') || foundUser.password.startsWith('$2a$')) {
            // Password sudah di-hash, gunakan bcrypt.compare
            console.log("Password is hashed, using bcrypt.compare");
            isPasswordMatch = await bcrypt.compare(password, foundUser.password);
        } else {
            // Password masih plain text, bandingkan langsung
            console.log("Password is plain text, comparing directly");
            isPasswordMatch = (password === foundUser.password);
        }
        
        // 5. Cek hasil perbandingan
        console.log("Password comparison result:", isPasswordMatch);

        if (!isPasswordMatch) {
            console.log("Login failed: Passwords do not match.");
            return res.status(401).json({ message: "Invalid username or password" });
        }

        console.log("Login successful! Generating token...");
        // Generate JWT token
        const token = jwt.sign(
          { userId: foundUser.id_pengguna, username: foundUser.username },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );

        // Jika berhasil, lanjutkan dengan logika token Anda
        res.status(200).json({
          message: "Login successful",
          token,
          redirectUrl: '/homepage',
          user: {
            id: foundUser.id_pengguna,
            username: foundUser.username,
            nama_pengguna: foundUser.nama_pengguna
          }
        });

    } catch (error) {
        console.error("SERVER ERROR during login:", error);
        res.status(500).json({ message: "Server error" });
    } finally {
        console.log("--- Login attempt finished ---\n");
    }
});

// Protected route example
app.get('/api/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    const result = await pool.query(
      'SELECT id_pengguna, username, nama_pengguna FROM pengguna WHERE id_pengguna = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get all users (for admin purposes)
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id_pengguna, username, nama_pengguna FROM pengguna ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Redirect endpoint after successful login
app.post('/api/login/redirect', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    // Get user info
    const result = await pool.query(
      'SELECT id_pengguna, username, nama_pengguna FROM pengguna WHERE id_pengguna = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return redirect information
    res.json({
      success: true,
      redirectUrl: '/homepage',
      user: result.rows[0],
      message: 'Redirecting to homepage...'
    });
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Middleware untuk verifikasi token
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Create logbook entry (POST)
app.post('/api/logbook', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { judul, deskripsi, tanggal, kategori } = req.body;
    const userId = req.user!.userId;

    if (!judul || !deskripsi || !tanggal) {
      return res.status(400).json({ error: 'Judul, deskripsi, dan tanggal diperlukan' });
    }

    const result = await pool.query(
      'INSERT INTO logbook (judul, deskripsi, tanggal, kategori, id_pengguna) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [judul, deskripsi, tanggal, kategori || 'Umum', userId]
    );

    res.status(201).json({
      message: 'Logbook berhasil dibuat',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create logbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all logbook entries (GET) - semua user bisa view
app.get('/api/logbook', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT l.*, p.username, p.nama_pengguna 
      FROM logbook l 
      JOIN pengguna p ON l.id_pengguna = p.id_pengguna 
      ORDER BY l.tanggal DESC
    `);

    res.json({
      message: 'Data logbook berhasil diambil',
      data: result.rows
    });
  } catch (error) {
    console.error('Get logbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single logbook entry (GET) - semua user bisa view
app.get('/api/logbook/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT l.*, p.username, p.nama_pengguna 
      FROM logbook l 
      JOIN pengguna p ON l.id_pengguna = p.id_pengguna 
      WHERE l.id_logbook = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Logbook tidak ditemukan' });
    }

    res.json({
      message: 'Data logbook berhasil diambil',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get single logbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update logbook entry (PUT) - hanya pemilik data yang bisa edit
app.put('/api/logbook/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { judul, deskripsi, tanggal, kategori } = req.body;
    const userId = req.user!.userId;

    // Cek apakah data milik user yang sedang login
    const checkOwnership = await pool.query(
      'SELECT id_pengguna FROM logbook WHERE id_logbook = $1',
      [id]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(404).json({ error: 'Logbook tidak ditemukan' });
    }

    if (checkOwnership.rows[0].id_pengguna !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki izin untuk mengedit data ini' });
    }

    const result = await pool.query(
      'UPDATE logbook SET judul = $1, deskripsi = $2, tanggal = $3, kategori = $4 WHERE id_logbook = $5 RETURNING *',
      [judul, deskripsi, tanggal, kategori || 'Umum', id]
    );

    res.json({
      message: 'Logbook berhasil diupdate',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update logbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete logbook entry (DELETE) - hanya pemilik data yang bisa hapus
app.delete('/api/logbook/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Cek apakah data milik user yang sedang login
    const checkOwnership = await pool.query(
      'SELECT id_pengguna FROM logbook WHERE id_logbook = $1',
      [id]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(404).json({ error: 'Logbook tidak ditemukan' });
    }

    if (checkOwnership.rows[0].id_pengguna !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki izin untuk menghapus data ini' });
    }

    await pool.query('DELETE FROM logbook WHERE id_logbook = $1', [id]);

    res.json({
      message: 'Logbook berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete logbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's own logbook entries (GET) - untuk mengecek data milik sendiri
app.get('/api/my-logbook', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const result = await pool.query(
      'SELECT * FROM logbook WHERE id_pengguna = $1 ORDER BY tanggal DESC',
      [userId]
    );

    res.json({
      message: 'Data logbook Anda berhasil diambil',
      data: result.rows
    });
  } catch (error) {
    console.error('Get my logbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
app.post('/api/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Verify token untuk memastikan token valid
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      console.log(`User ${decoded.username} logged out successfully`);
    } catch (error) {
      // Token sudah invalid/expired, tetap proses logout
      console.log('Token invalid/expired during logout');
    }

    // Logout berhasil - frontend akan menghapus token dari localStorage
    res.json({
      success: true,
      message: 'Logout successful',
      redirectUrl: '/'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;