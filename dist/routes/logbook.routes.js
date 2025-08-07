"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logbook_controller_1 = require("../controllers/logbook.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Semua routes logbook memerlukan autentikasi
router.use(auth_middleware_1.authenticateToken);
// Routes untuk logbook CRUD
router.get('/logbook', logbook_controller_1.getAllLogbooks);
router.get('/logbook/:id', logbook_controller_1.getLogbookById);
router.post('/add-logbook', logbook_controller_1.createLogbook); // Endpoint untuk CardAddData
router.post('/tambah-logbook', logbook_controller_1.createLogbook); // Endpoint alternatif
router.put('/logbook/:id', logbook_controller_1.updateLogbook);
router.delete('/logbook/:id', logbook_controller_1.deleteLogbook);
exports.default = router;
