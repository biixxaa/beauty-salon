"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/profile.routes.ts
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_js_1 = require("../data/db.js");
const router = (0, express_1.Router)();
// GET /api/profile/employee
router.get('/employee', (req, res) => {
    const user = req.user || db_js_1.db.users.get('usr-employee-1');
    res.json({
        id: user?.id || 'usr-employee-1',
        name: user?.name || 'Dawit Alemu',
        bio: 'Certified master stylist with 8+ years specializing in modern fades, hair design, and luxury treatments.',
        resumeUrl: '',
        avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
        rating: 4.9,
        user: {
            email: user?.email || 'dawit@bolegrooming.et',
            phone: user?.phone || '+251 922 445566',
        },
        salon: {
            id: 'salon-2',
            name: "Bole Gentlemen's Grooming Lounge",
        },
    });
});
// PUT /api/profile/employee
router.put('/employee', (req, res) => {
    const user = req.user || db_js_1.db.users.get('usr-employee-1');
    const { bio, resumeUrl, avatarUrl } = req.body || {};
    if (user) {
        if (avatarUrl)
            user.avatarUrl = avatarUrl;
    }
    res.json({
        id: user?.id || 'usr-employee-1',
        name: user?.name || 'Dawit Alemu',
        bio: bio || '',
        resumeUrl: resumeUrl || '',
        avatarUrl: avatarUrl || user?.avatarUrl,
        rating: 4.9,
        user: {
            email: user?.email || 'dawit@bolegrooming.et',
            phone: user?.phone || '+251 922 445566',
        },
        salon: {
            id: 'salon-2',
            name: "Bole Gentlemen's Grooming Lounge",
        },
    });
});
// POST /api/profile/change-password
router.post('/change-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword) {
        res.status(400).json({ error: 'New password is required' });
        return;
    }
    const user = req.user || db_js_1.db.users.get('usr-employee-1');
    if (user?.passwordHash && currentPassword) {
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            res.status(400).json({ error: 'Current password does not match' });
            return;
        }
    }
    if (user) {
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
    }
    res.json({ message: 'Password updated successfully' });
});
exports.default = router;
