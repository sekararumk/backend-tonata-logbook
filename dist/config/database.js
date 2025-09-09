"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePool = exports.testConnection = exports.pool = void 0;
const pg_1 = require("pg");
// Database configuration
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'tonata_logbook',
    password: process.env.DB_PASSWORD || 'pgadmin4',
    port: parseInt(process.env.DB_PORT || '5432'),
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};
// Create connection pool
exports.pool = new pg_1.Pool(dbConfig);
// Test database connection
const testConnection = async () => {
    try {
        const client = await exports.pool.connect();
        console.log('✅ Database connected successfully');
        client.release();
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};
exports.testConnection = testConnection;
// Graceful shutdown
const closePool = async () => {
    try {
        await exports.pool.end();
        console.log('✅ Database pool closed successfully');
    }
    catch (error) {
        console.error('❌ Error closing database pool:', error);
    }
};
exports.closePool = closePool;
// Handle pool errors
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
exports.default = exports.pool;
