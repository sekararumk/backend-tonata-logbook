"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const debug_controller_1 = require("../controllers/debug.controller");
const router = (0, express_1.Router)();
// Health check endpoints
router.get('/health', debug_controller_1.healthCheck);
router.get('/api/health', debug_controller_1.healthCheck);
// Debug endpoints
router.get('/api/check-table-structure', debug_controller_1.checkTableStructure);
router.get('/debug/test-db', debug_controller_1.testDatabase);
exports.default = router;
