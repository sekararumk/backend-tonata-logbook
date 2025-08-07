import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { corsMiddleware } from '../middleware/cors.middleware';

// Create Express application
export const createApp = () => {
  const app = express();

  // Basic middleware
  app.use(corsMiddleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true })); // Untuk parsing form data
  app.use(cookieParser());

  // Serve static files dari frontend build (jika ada)
  app.use(express.static(path.join(__dirname, '../../../build')));

  // Serve static files dari backend public directory (untuk script integrasi)
  app.use('/integration', express.static(path.join(__dirname, '../../public')));

  return app;
};

// Error handling middleware
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
};

// 404 handler untuk SPA routing
export const notFoundHandler = (req: express.Request, res: express.Response) => {
  // Jika request bukan untuk API, serve frontend
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../../../build/index.html'), (err) => {
      if (err) {
        res.status(404).json({ error: 'Page not found' });
      }
    });
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
};
