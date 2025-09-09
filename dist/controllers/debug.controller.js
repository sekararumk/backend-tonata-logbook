"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabase = exports.checkTableStructure = exports.healthCheck = void 0;
const database_1 = __importDefault(require("../config/database"));
// GET /api/health - Health check endpoint
const healthCheck = (req, res) => {
    res.json({ status: 'OK', message: 'TONATA Logbook API is running' });
};
exports.healthCheck = healthCheck;
// GET /api/check-table-structure - Mengecek struktur tabel logbook
const checkTableStructure = async (req, res) => {
    try {
        // Cek apakah tabel logbook ada
        const tableExists = await database_1.default.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'logbook'
      );
    `);
        if (!tableExists.rows[0].exists) {
            return res.json({
                success: false,
                error: 'Table logbook does not exist',
                suggestion: 'Please create the logbook table first'
            });
        }
        // Ambil struktur tabel logbook
        const tableStructure = await database_1.default.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'logbook'
      ORDER BY ordinal_position
    `);
        // Coba ambil sample data
        const sampleData = await database_1.default.query('SELECT * FROM logbook LIMIT 1');
        res.json({
            success: true,
            tableExists: true,
            tableStructure: tableStructure.rows,
            sampleData: sampleData.rows.length > 0 ? sampleData.rows[0] : null,
            totalRows: (await database_1.default.query('SELECT COUNT(*) FROM logbook')).rows[0].count
        });
    }
    catch (error) {
        console.error('Error checking table structure:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check table structure',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.checkTableStructure = checkTableStructure;
// GET /debug/test-db - Test database connection dan lihat users
const testDatabase = async (req, res) => {
    try {
        // Cek struktur tabel terlebih dahulu
        const tableInfo = await database_1.default.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'logbook'
      ORDER BY ordinal_position
    `);
        const userTableInfo = await database_1.default.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'pengguna'
      ORDER BY ordinal_position
    `);
        const userResult = await database_1.default.query('SELECT id_pengguna, username, nama_pengguna, password FROM pengguna ORDER BY id_pengguna');
        const logbookResult = await database_1.default.query('SELECT * FROM logbook ORDER BY created_at DESC');
        res.json({
            status: 'OK',
            message: 'Database connected successfully',
            logbook_table_structure: tableInfo.rows,
            pengguna_table_structure: userTableInfo.rows,
            users: userResult.rows.map(user => ({
                id_pengguna: user.id_pengguna,
                username: user.username,
                nama_pengguna: user.nama_pengguna,
                password_length: user.password.length,
                password_preview: user.password.substring(0, 20) + '...',
                is_hashed: user.password.startsWith('$2b$')
            })),
            logbooks: logbookResult.rows,
            logbook_count: logbookResult.rows.length
        });
    }
    catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection failed',
            error: error.message
        });
    }
};
exports.testDatabase = testDatabase;
