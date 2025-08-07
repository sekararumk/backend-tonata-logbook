"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Routes untuk autentikasi (tidak memerlukan token)
router.post('/register', user_controller_1.registerUser);
router.post('/login', user_controller_1.loginUser);
// Routes yang memerlukan autentikasi
router.get('/users', auth_middleware_1.authenticateToken, user_controller_1.getUsers);
router.get('/users/:id', auth_middleware_1.authenticateToken, user_controller_1.getUser);
router.put('/users/:id', auth_middleware_1.authenticateToken, user_controller_1.updateUserController);
router.delete('/users/:id', auth_middleware_1.authenticateToken, user_controller_1.deleteUserController);
exports.default = router;
