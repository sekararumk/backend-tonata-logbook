import { Router } from 'express';
import { 
  getUsers, 
  getUser, 
  registerUser, 
  loginUser, 
  updateUserController, 
  deleteUserController 
} from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Routes untuk autentikasi (tidak memerlukan token)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Routes yang memerlukan autentikasi
router.get('/users', authenticateToken, getUsers);
router.get('/users/:id', authenticateToken, getUser);
router.put('/users/:id', authenticateToken, updateUserController);
router.delete('/users/:id', authenticateToken, deleteUserController);

export default router;
