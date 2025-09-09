"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLoginInput = exports.validateUserInput = exports.validateLogbookInput = void 0;
const validateLogbookInput = (req, res, next) => {
    const { tanggal, judul_kegiatan, detail_kegiatan } = req.body;
    if (!tanggal) {
        return res.status(400).json({ error: 'Tanggal is required' });
    }
    if (!judul_kegiatan) {
        return res.status(400).json({ error: 'Judul kegiatan is required' });
    }
    if (!detail_kegiatan) {
        return res.status(400).json({ error: 'Detail kegiatan is required' });
    }
    // Validasi format tanggal
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(tanggal)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    next();
};
exports.validateLogbookInput = validateLogbookInput;
const validateUserInput = (req, res, next) => {
    const { username, nama_pengguna, password } = req.body;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }
    if (!nama_pengguna) {
        return res.status(400).json({ error: 'Nama pengguna is required' });
    }
    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    next();
};
exports.validateUserInput = validateUserInput;
const validateLoginInput = (req, res, next) => {
    const { username, password } = req.body;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }
    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }
    next();
};
exports.validateLoginInput = validateLoginInput;
