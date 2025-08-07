import { Router } from 'express';
import { 
  healthCheck, 
  checkTableStructure, 
  testDatabase 
} from '../controllers/debug.controller';

const router = Router();

// Health check endpoints
router.get('/health', healthCheck);
router.get('/api/health', healthCheck);

// Debug endpoints
router.get('/api/check-table-structure', checkTableStructure);
router.get('/debug/test-db', testDatabase);

export default router;
