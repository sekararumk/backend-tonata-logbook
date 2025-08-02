const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// PostgreSQL connection configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tonata_logbook',
  password: 'pgadmin4',
  port: 5432,
});

async function createTestUser() {
  try {
    // First, check if admin user already exists
    const existingUser = await pool.query(
      'SELECT * FROM pengguna WHERE username = $1',
      ['admin']
    );

    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists. Updating password...');
      
      // Update the existing user with hashed password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin', saltRounds);
      
      await pool.query(
        'UPDATE pengguna SET password = $1 WHERE username = $2',
        [hashedPassword, 'admin']
      );
      
      console.log('Admin user password updated successfully!');
    } else {
      console.log('Creating new admin user...');
      
      // Create new admin user with hashed password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin', saltRounds);
      
      const result = await pool.query(
        'INSERT INTO pengguna (username, password, nama_pengguna) VALUES ($1, $2, $3) RETURNING *',
        ['admin', hashedPassword, 'Administrator']
      );
      
      console.log('Admin user created successfully!', result.rows[0]);
    }
    
    // Verify the user exists
    const verifyUser = await pool.query(
      'SELECT id_pengguna, username, nama_pengguna FROM pengguna WHERE username = $1',
      ['admin']
    );
    
    console.log('Verified user in database:', verifyUser.rows[0]);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();
