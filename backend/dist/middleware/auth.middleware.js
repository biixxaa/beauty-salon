"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_js_1 = require("../data/db.js");
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-beauty-salon-booking-saas-2026';
function authenticate(req, res, next) {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    }
    else if (req.headers.cookie) {
        const cookies = req.headers.cookie.split(';').reduce((acc, c) => {
            const [key, val] = c.trim().split('=');
            acc[key] = val;
            return acc;
        }, {});
        token = cookies['beauty_session'] || '';
    }
    if (!token) {
        // If no token is provided, fall back to default demo customer so frontend works out of the box
        const demoCustomer = db_js_1.db.users.get('usr-customer-1');
        if (demoCustomer) {
            req.user = demoCustomer;
        }
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = db_js_1.db.users.get(decoded.id) || Array.from(db_js_1.db.users.values()).find((u) => u.email === decoded.email);
        if (user) {
            req.user = user;
        }
    }
    catch (error) {
        console.warn('JWT verification failed in standalone backend:', error);
    }
    next();
}
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        next();
    };
}
