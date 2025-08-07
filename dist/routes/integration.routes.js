"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const integration_controller_1 = require("../controllers/integration.controller");
const router = (0, express_1.Router)();
// Routes untuk integrasi frontend (dengan /api prefix)
router.get('/table-data', integration_controller_1.getTableData);
router.post('/add-logbook', integration_controller_1.addLogbook);
router.post('/table-action', integration_controller_1.handleTableAction);
exports.default = router;
