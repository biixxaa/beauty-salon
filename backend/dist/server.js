"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_middleware_js_1 = require("./middleware/auth.middleware.js");
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const bookings_routes_js_1 = __importDefault(require("./routes/bookings.routes.js"));
const salons_routes_js_1 = __importDefault(require("./routes/salons.routes.js"));
const dashboard_routes_js_1 = __importDefault(require("./routes/dashboard.routes.js"));
const profile_routes_js_1 = __importDefault(require("./routes/profile.routes.js"));
const ai_routes_js_1 = __importDefault(require("./routes/ai.routes.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
// Global Middleware
app.use((0, cors_1.default)({
    origin: CORS_ORIGIN,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(auth_middleware_js_1.authenticate);
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        service: 'beauty-backend',
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'healthy',
        service: 'beauty-backend',
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});
// Mount API routes
app.use('/api/auth', auth_routes_js_1.default);
app.use('/api/bookings', bookings_routes_js_1.default);
app.use('/api/salons', salons_routes_js_1.default);
app.use('/api/dashboard', dashboard_routes_js_1.default);
app.use('/api/profile', profile_routes_js_1.default);
app.use('/api/ai', ai_routes_js_1.default);
// Fallback 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`✨ Beuty standalone backend server running on http://localhost:${PORT}`);
        console.log(`🔗 Connected with frontend origin: ${CORS_ORIGIN}`);
    });
}
exports.default = app;
