import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, CreateUserRequest, UpdateUserRequest, LoginRequest, LoginResponse, UserWithoutPassword } from '../models/user.model';

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tonata_logbook',
  password: 'pgadmin4',
  port: 5432,
});

const JWT_SECRET = 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

export const getAllUsers = async (): Promise<UserWithoutPassword[]> => {
  try {
    const result = await pool.query(
      'SELECT id_pengguna, username, nama_pengguna, created_at, updated_at FROM pengguna ORDER BY created_at DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};

export const getUserById = async (id: number): Promise<UserWithoutPassword | null> => {
  try {
    const result = await pool.query(
      'SELECT id_pengguna, username, nama_pengguna, created_at, updated_at FROM pengguna WHERE id_pengguna = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw new Error('Failed to fetch user');
  }
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const result = await pool.query(
      'SELECT * FROM pengguna WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user by username:', error);
    throw new Error('Failed to fetch user');
  }
};

export const createUser = async (userData: CreateUserRequest): Promise<UserWithoutPassword> => {
  try {
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const result = await pool.query(
      `INSERT INTO pengguna (username, nama_pengguna, password)
       VALUES ($1, $2, $3)
       RETURNING id_pengguna, username, nama_pengguna`,
      [userData.username, userData.nama_pengguna, hashedPassword]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
};

export const updateUser = async (id: number, userData: UpdateUserRequest): Promise<UserWithoutPassword | null> => {
  try {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (userData.username !== undefined) {
      fields.push(`username = $${paramCount}`);
      values.push(userData.username);
      paramCount++;
    }
    if (userData.nama_pengguna !== undefined) {
      fields.push(`nama_pengguna = $${paramCount}`);
      values.push(userData.nama_pengguna);
      paramCount++;
    }
    if (userData.password !== undefined) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      fields.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE pengguna SET ${fields.join(', ')} WHERE id_pengguna = $${paramCount} 
       RETURNING id_pengguna, username, nama_pengguna, created_at, updated_at`,
      values
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
};

export const deleteUser = async (id: number): Promise<boolean> => {
  try {
    const result = await pool.query(
      'DELETE FROM pengguna WHERE id_pengguna = $1 RETURNING id_pengguna',
      [id]
    );
    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};

export const authenticateUser = async (loginData: LoginRequest): Promise<LoginResponse | null> => {
  try {
    const user = await getUserByUsername(loginData.username);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id_pengguna: user.id_pengguna,
        username: user.username,
        nama_pengguna: user.nama_pengguna
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data without password
    const userWithoutPassword: UserWithoutPassword = {
      id_pengguna: user.id_pengguna,
      username: user.username,
      nama_pengguna: user.nama_pengguna,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return {
      token,
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw new Error('Failed to authenticate user');
  }
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};
