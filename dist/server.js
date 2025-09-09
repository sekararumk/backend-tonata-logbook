"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./config/app");
const database_1 = require("./config/database");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const logbook_routes_1 = __importDefault(require("./routes/logbook.routes"));
const integration_routes_1 = __importDefault(require("./routes/integration.routes"));
const debug_routes_1 = __importDefault(require("./routes/debug.routes"));
const utility_routes_1 = __importDefault(require("./routes/utility.routes"));
const PORT = process.env.PORT || 5001;
// Create Express application with middleware
const app = (0, app_1.createApp)();
// Test database connection
(0, database_1.testConnection)();
// Routes
app.use('/', debug_routes_1.default); // Health check dan debug routes
app.use('/api', user_routes_1.default); // User authentication routes
app.use('/api', integration_routes_1.default); // Integration routes
app.use('/', utility_routes_1.default); // Utility routes (homepage, logout)
app.use('/api', logbook_routes_1.default); // Logbook CRUD routes
// 404 handler dan error handling
app.use('*', app_1.notFoundHandler);
app.use(app_1.errorHandler);
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔧 Debug endpoint: http://localhost:${PORT}/debug/test-db`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
exports.default = app;
