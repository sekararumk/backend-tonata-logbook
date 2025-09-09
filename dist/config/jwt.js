"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.verifyToken = exports.generateRefreshToken = exports.generateToken = exports.JWT_CONFIG = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// JWT Configuration
exports.JWT_CONFIG = {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
};
// Generate JWT token
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id_pengguna: user.id_pengguna,
        username: user.username,
        nama_pengguna: user.nama_pengguna
    }, exports.JWT_CONFIG.secret, { expiresIn: '24h' });
};
exports.generateToken = generateToken;
// Generate refresh token
const generateRefreshToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id_pengguna: user.id_pengguna,
        username: user.username,
        type: 'refresh'
    }, exports.JWT_CONFIG.secret, { expiresIn: '7d' });
};
exports.generateRefreshToken = generateRefreshToken;
// Verify JWT token
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, exports.JWT_CONFIG.secret);
    }
    catch (error) {
        throw new Error('Invalid token');
    }
};
exports.verifyToken = verifyToken;
// Decode JWT token without verification
const decodeToken = (token) => {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch (error) {
        throw new Error('Invalid token format');
    }
};
exports.decodeToken = decodeToken;
exports.default = {
    generateToken: exports.generateToken,
    generateRefreshToken: exports.generateRefreshToken,
    verifyToken: exports.verifyToken,
    decodeToken: exports.decodeToken,
    JWT_CONFIG: exports.JWT_CONFIG
};
