"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.authenticateUser = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserByUsername = exports.getUserById = exports.getAllUsers = void 0;
const pg_1 = require("pg");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// PostgreSQL connection
const pool = new pg_1.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'tonata_logbook',
    password: 'pgadmin4',
    port: 5432,
});
const JWT_SECRET = 'your-secret-key';
const JWT_EXPIRES_IN = '24h';
const getAllUsers = async () => {
    try {
        const result = await pool.query('SELECT id_pengguna, username, nama_pengguna, created_at, updated_at FROM pengguna ORDER BY created_at DESC');
        return result.rows;
    }
    catch (error) {
        console.error('Error fetching users:', error);
        throw new Error('Failed to fetch users');
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (id) => {
    try {
        const result = await pool.query('SELECT id_pengguna, username, nama_pengguna, created_at, updated_at FROM pengguna WHERE id_pengguna = $1', [id]);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('Error fetching user by ID:', error);
        throw new Error('Failed to fetch user');
    }
};
exports.getUserById = getUserById;
const getUserByUsername = async (username) => {
    try {
        const result = await pool.query('SELECT * FROM pengguna WHERE username = $1', [username]);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('Error fetching user by username:', error);
        throw new Error('Failed to fetch user');
    }
};
exports.getUserByUsername = getUserByUsername;
const createUser = async (userData) => {
    try {
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt_1.default.hash(userData.password, saltRounds);
        const result = await pool.query(`INSERT INTO pengguna (username, nama_pengguna, password)
       VALUES ($1, $2, $3)
       RETURNING id_pengguna, username, nama_pengguna`, [userData.username, userData.nama_pengguna, hashedPassword]);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error creating user:', error);
        throw new Error('Failed to create user');
    }
};
exports.createUser = createUser;
const updateUser = async (id, userData) => {
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
            const hashedPassword = await bcrypt_1.default.hash(userData.password, saltRounds);
            fields.push(`password = $${paramCount}`);
            values.push(hashedPassword);
            paramCount++;
        }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const result = await pool.query(`UPDATE pengguna SET ${fields.join(', ')} WHERE id_pengguna = $${paramCount} 
       RETURNING id_pengguna, username, nama_pengguna, created_at, updated_at`, values);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('Error updating user:', error);
        throw new Error('Failed to update user');
    }
};
exports.updateUser = updateUser;
const deleteUser = async (id) => {
    try {
        const result = await pool.query('DELETE FROM pengguna WHERE id_pengguna = $1 RETURNING id_pengguna', [id]);
        return (result.rowCount || 0) > 0;
    }
    catch (error) {
        console.error('Error deleting user:', error);
        throw new Error('Failed to delete user');
    }
};
exports.deleteUser = deleteUser;
const authenticateUser = async (loginData) => {
    try {
        const user = await (0, exports.getUserByUsername)(loginData.username);
        if (!user) {
            return null;
        }
        const isPasswordValid = await bcrypt_1.default.compare(loginData.password, user.password);
        if (!isPasswordValid) {
            return null;
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            id_pengguna: user.id_pengguna,
            username: user.username,
            nama_pengguna: user.nama_pengguna
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        // Return user data without password
        const userWithoutPassword = {
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
    }
    catch (error) {
        console.error('Error authenticating user:', error);
        throw new Error('Failed to authenticate user');
    }
};
exports.authenticateUser = authenticateUser;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new Error('Invalid token');
    }
};
exports.verifyToken = verifyToken;
