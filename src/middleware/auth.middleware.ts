import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/user.service';
import { AuthUser } from '../models/user.model';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = verifyToken(token) as AuthUser;
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}; 