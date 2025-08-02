const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 3001;


app.use(cors());
app.use(bodyParser.json());


const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tonata_logbook',
  password: 'pgadmin4',
  port: 5432,
});


pool.on('connect', () => {
  console.log('✅ Terhubung ke database PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error koneksi database:', err);
});


app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connected!', timestamp: result.rows[0].now });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  console.log('🔐 Login attempt:', { username, password: password ? '***' : 'empty' });
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Username dan password wajib diisi.' 
    });
  }

  try {
   
    const result = await pool.query(
      'SELECT id_pengguna, username, nama_pengguna FROM pengguna WHERE username = $1 AND password = $2',
      [username, password]
    );
    
    console.log('📊 Query result rows:', result.rows.length);
    
    if (result.rows.length > 0) {
     
      const user = result.rows[0];
      console.log('✅ Login successful for user:', user.username);
      
      res.json({
        success: true,
        message: 'Login berhasil!',
        user: {
          id_pengguna: user.id_pengguna,
          username: user.username,
          nama_pengguna: user.nama_pengguna,
        },
        redirect: '/Homepage',
      });
    } else {
      // Login gagal
      console.log('❌ Login failed: username/password tidak cocok');
      res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah.' 
      });
    }
  } catch (error) {
    console.error('💥 ERROR DETAIL:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan pada server.', 
      error: error.message 
    });
  }
});

// API logout
app.post('/api/logout', async (req, res) => {
  try {
    console.log('🚪 Logout request received');
    
    // Logout berhasil
    res.json({
      success: true,
      message: 'Logout berhasil!',
      redirect: '/',
    });
  } catch (error) {
    console.error('💥 LOGOUT ERROR:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan saat logout.', 
      error: error.message 
    });
  }
});


app.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`);
  console.log(`📝 Test koneksi: http://localhost:${port}/api/test`);
});
