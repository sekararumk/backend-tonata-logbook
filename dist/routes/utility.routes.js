"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const integration_controller_1 = require("../controllers/integration.controller");
const router = (0, express_1.Router)();
// Route untuk homepage - redirect ke frontend
router.get('/homepage', (req, res) => {
    // Redirect langsung ke frontend React
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000/Homepage');
});
// Route logout langsung tanpa /api prefix untuk kemudahan akses
router.get('/logout', (req, res) => {
    try {
        // Clear cookies jika ada
        res.clearCookie('token');
        res.clearCookie('user');
        console.log('Direct logout accessed, redirecting to login page...');
        // Redirect langsung ke halaman login frontend
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000/');
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).send('Logout error');
    }
});
// Route untuk form login (tanpa /api prefix)
router.post('/login-form', integration_controller_1.handleFormLogin);
exports.default = router;
