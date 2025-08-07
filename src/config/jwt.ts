import jwt from 'jsonwebtoken';
import { AuthUser } from '../models/user.model';

// JWT Configuration
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
};

// Generate JWT token
export const generateToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      id_pengguna: user.id_pengguna,
      username: user.username,
      nama_pengguna: user.nama_pengguna
    },
    JWT_CONFIG.secret,
    { expiresIn: '24h' }
  );
};

// Generate refresh token
export const generateRefreshToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      id_pengguna: user.id_pengguna,
      username: user.username,
      type: 'refresh'
    },
    JWT_CONFIG.secret,
    { expiresIn: '7d' }
  );
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_CONFIG.secret as jwt.Secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Decode JWT token without verification
export const decodeToken = (token: string): any => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Invalid token format');
  }
};

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  JWT_CONFIG
}; 