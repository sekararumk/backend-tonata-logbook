import { createApp, errorHandler, notFoundHandler } from './config/app';
import { testConnection } from './config/database';
import userRoutes from './routes/user.routes';
import logbookRoutes from './routes/logbook.routes';
import integrationRoutes from './routes/integration.routes';
import debugRoutes from './routes/debug.routes';
import utilityRoutes from './routes/utility.routes';

const PORT = process.env.PORT || 5001;

// Create Express application with middleware
const app = createApp();

// Test database connection
testConnection();

// Routes
app.use('/', debugRoutes); // Health check dan debug routes
app.use('/api', userRoutes); // User authentication routes
app.use('/api', integrationRoutes); // Integration routes
app.use('/', utilityRoutes); // Utility routes (homepage, logout)
app.use('/api', logbookRoutes); // Logbook CRUD routes

// 404 handler dan error handling
app.use('*', notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Debug endpoint: http://localhost:${PORT}/debug/test-db`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

export default app;