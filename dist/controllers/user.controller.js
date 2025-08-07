"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserController = exports.updateUserController = exports.loginUser = exports.registerUser = exports.getUser = exports.getUsers = void 0;
const user_service_1 = require("../services/user.service");
const getUsers = async (req, res) => {
    try {
        const users = await (0, user_service_1.getAllUsers)();
        res.json(users);
    }
    catch (error) {
        console.error('Error in getUsers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUsers = getUsers;
const getUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const user = await (0, user_service_1.getUserById)(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error in getUser:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUser = getUser;
const registerUser = async (req, res) => {
    try {
        const userData = req.body;
        // Validasi data yang diperlukan
        if (!userData.username || !userData.nama_pengguna || !userData.password) {
            return res.status(400).json({
                error: 'Missing required fields: username, nama_pengguna, password'
            });
        }
        // Validasi panjang password minimal
        if (userData.password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }
        const newUser = await (0, user_service_1.createUser)(userData);
        res.status(201).json(newUser);
    }
    catch (error) {
        console.error('Error in registerUser:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        const loginData = req.body;
        // Validasi data yang diperlukan
        if (!loginData.username || !loginData.password) {
            return res.status(400).json({
                error: 'Missing required fields: username, password'
            });
        }
        const authResult = await (0, user_service_1.authenticateUser)(loginData);
        if (!authResult) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }
        res.json({
            success: true,
            ...authResult
        });
    }
    catch (error) {
        console.error('Error in loginUser:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.loginUser = loginUser;
const updateUserController = async (req, res) => {
    try {
        const currentUser = req.user;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        // Cek apakah user yang login sama dengan user yang akan diupdate
        if (currentUser.id_pengguna !== id) {
            return res.status(403).json({ error: 'Access denied. You can only update your own profile.' });
        }
        const updateData = req.body;
        // Validasi bahwa setidaknya ada satu field yang diupdate
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        // Validasi panjang password minimal jika password diupdate
        if (updateData.password && updateData.password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }
        const updatedUser = await (0, user_service_1.updateUser)(id, updateData);
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Error in updateUser:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateUserController = updateUserController;
const deleteUserController = async (req, res) => {
    try {
        const currentUser = req.user;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        // Cek apakah user yang login sama dengan user yang akan dihapus
        if (currentUser.id_pengguna !== id) {
            return res.status(403).json({ error: 'Access denied. You can only delete your own account.' });
        }
        const deleted = await (0, user_service_1.deleteUser)(id);
        if (!deleted) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Error in deleteUser:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteUserController = deleteUserController;
