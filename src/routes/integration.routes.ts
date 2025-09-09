import { Router } from 'express';
import {
  getTableData,
  addLogbook,
  handleTableAction,
  handleFormLogin
} from '../controllers/integration.controller';

const router = Router();

// Routes untuk integrasi frontend (dengan /api prefix)
router.get('/table-data', getTableData);
router.post('/add-logbook', addLogbook);
router.post('/table-action', handleTableAction);

export default router;
