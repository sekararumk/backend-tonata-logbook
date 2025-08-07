import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id_pengguna: number;
        username: string;
      };
    }
  }
}
