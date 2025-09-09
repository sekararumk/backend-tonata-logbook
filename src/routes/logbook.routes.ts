import { Router } from 'express';
import {
  getAllLogbooks,
  getLogbookById,
  createLogbook,
  updateLogbook,
  deleteLogbook
} from '../controllers/logbook.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Semua routes logbook memerlukan autentikasi
router.use(authenticateToken);

// Routes untuk logbook CRUD
router.get('/logbook', getAllLogbooks);
router.get('/logbook/:id', getLogbookById);
router.post('/add-logbook', createLogbook); // Endpoint untuk CardAddData
router.post('/tambah-logbook', createLogbook); // Endpoint alternatif
router.put('/logbook/:id', updateLogbook);
router.delete('/logbook/:id', deleteLogbook);

export default router; 