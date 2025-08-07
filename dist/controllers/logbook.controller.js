"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLogbook = exports.updateLogbook = exports.createLogbook = exports.getLogbookById = exports.getAllLogbooks = void 0;
const logbook_service_1 = require("../services/logbook.service");
const getAllLogbooks = async (req, res) => {
    try {
        const currentUser = req.user;
        const logbooks = await (0, logbook_service_1.getLogbookData)();
        // Tambahkan info permission untuk setiap logbook
        const logbooksWithPermissions = logbooks.map((logbook) => ({
            ...logbook,
            canEdit: logbook.owner_username === currentUser.username,
            canDelete: logbook.owner_username === currentUser.username,
            canView: true // Semua user bisa view
        }));
        res.json(logbooksWithPermissions);
    }
    catch (error) {
        console.error('Error in getAllLogbooks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllLogbooks = getAllLogbooks;
const getLogbookById = async (req, res) => {
    try {
        const currentUser = req.user;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const logbook = await (0, logbook_service_1.getLogbookDetail)(id);
        if (!logbook) {
            return res.status(404).json({ error: 'Logbook not found' });
        }
        // Tambahkan info permission
        const logbookWithPermissions = {
            ...logbook,
            canEdit: logbook.owner_username === currentUser.username,
            canDelete: logbook.owner_username === currentUser.username,
            canView: true
        };
        res.json(logbookWithPermissions);
    }
    catch (error) {
        console.error('Error in getLogbookById:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getLogbookById = getLogbookById;
const createLogbook = async (req, res) => {
    try {
        const currentUser = req.user;
        const logbookData = req.body;
        // Validasi data yang diperlukan
        if (!logbookData.tanggal || !logbookData.judul_kegiatan || !logbookData.detail_kegiatan) {
            return res.status(400).json({
                error: 'Missing required fields: tanggal, judul_kegiatan, detail_kegiatan'
            });
        }
        const newLogbook = await (0, logbook_service_1.addLogbookData)(logbookData, currentUser.id_pengguna);
        // Tambahkan permission info ke response
        const newLogbookWithPermissions = {
            ...newLogbook,
            canEdit: true,
            canDelete: true,
            canView: true
        };
        res.status(201).json(newLogbookWithPermissions);
    }
    catch (error) {
        console.error('Error in createLogbook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createLogbook = createLogbook;
const updateLogbook = async (req, res) => {
    try {
        const currentUser = req.user;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        // Cek apakah logbook exist dan apakah user memiliki permission
        const existingLogbook = await (0, logbook_service_1.getLogbookDetail)(id);
        if (!existingLogbook) {
            return res.status(404).json({ error: 'Logbook not found' });
        }
        // Cek permission - hanya pemilik yang bisa edit
        if (existingLogbook.owner_username !== currentUser.username) {
            return res.status(403).json({ error: 'Access denied. You can only edit your own logbook entries.' });
        }
        const updateData = req.body;
        // Validasi bahwa setidaknya ada satu field yang diupdate
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        const updatedLogbook = await (0, logbook_service_1.updateLogbookData)(id, updateData);
        if (!updatedLogbook) {
            return res.status(404).json({ error: 'Logbook not found' });
        }
        // Tambahkan permission info
        const updatedLogbookWithPermissions = {
            ...updatedLogbook,
            canEdit: true,
            canDelete: true,
            canView: true
        };
        res.json(updatedLogbookWithPermissions);
    }
    catch (error) {
        console.error('Error in updateLogbook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateLogbook = updateLogbook;
const deleteLogbook = async (req, res) => {
    try {
        const currentUser = req.user;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        // Cek apakah logbook exist dan apakah user memiliki permission
        const existingLogbook = await (0, logbook_service_1.getLogbookDetail)(id);
        if (!existingLogbook) {
            return res.status(404).json({ error: 'Logbook not found' });
        }
        // Cek permission - hanya pemilik yang bisa delete
        if (existingLogbook.owner_username !== currentUser.username) {
            return res.status(403).json({ error: 'Access denied. You can only delete your own logbook entries.' });
        }
        const deleted = await (0, logbook_service_1.deleteLogbookData)(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Logbook not found' });
        }
        res.json({ message: 'Logbook deleted successfully' });
    }
    catch (error) {
        console.error('Error in deleteLogbook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteLogbook = deleteLogbook;
