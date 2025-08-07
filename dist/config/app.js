"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const cors_middleware_1 = require("../middleware/cors.middleware");
// Create Express application
const createApp = () => {
    const app = (0, express_1.default)();
    // Basic middleware
    app.use(cors_middleware_1.corsMiddleware);
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true })); // Untuk parsing form data
    app.use((0, cookie_parser_1.default)());
    // Serve static files dari frontend build (jika ada)
    app.use(express_1.default.static(path_1.default.join(__dirname, '../../../build')));
    // Serve static files dari backend public directory (untuk script integrasi)
    app.use('/integration', express_1.default.static(path_1.default.join(__dirname, '../../public')));
    return app;
};
exports.createApp = createApp;
// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
};
exports.errorHandler = errorHandler;
// 404 handler untuk SPA routing
const notFoundHandler = (req, res) => {
    // Jika request bukan untuk API, serve frontend
    if (!req.path.startsWith('/api')) {
        res.sendFile(path_1.default.join(__dirname, '../../../build/index.html'), (err) => {
            if (err) {
                res.status(404).json({ error: 'Page not found' });
            }
        });
    }
    else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
};
exports.notFoundHandler = notFoundHandler;
