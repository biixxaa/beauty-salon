"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/dashboard.routes.ts
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_js_1 = require("../data/db.js");
const router = (0, express_1.Router)();
// GET /api/dashboard/coupons
router.get('/coupons', (_req, res) => {
    res.json(Array.from(db_js_1.db.coupons.values()));
});
// POST /api/dashboard/coupons
router.post('/coupons', (req, res) => {
    const { code, discountPercent, expiryDate, usageLimit, maxDiscount, salonId } = req.body || {};
    if (!code || !discountPercent) {
        res.status(400).json({ error: 'Code and discount percentage are required' });
        return;
    }
    const newCoupon = {
        id: `cp-${Date.now()}`,
        code: String(code).toUpperCase().trim(),
        discountPercent: Number(discountPercent) || 10,
        isActive: true,
        expiryDate: expiryDate || '2027-12-31',
        usageLimit: Number(usageLimit) || 50,
        maxDiscount: Number(maxDiscount) || 300,
        salonId,
    };
    db_js_1.db.coupons.set(newCoupon.id, newCoupon);
    res.status(201).json({ message: 'Coupon created successfully', coupon: newCoupon });
});
// GET /api/dashboard/salons
router.get('/salons', (_req, res) => {
    res.json(Array.from(db_js_1.db.salons.values()));
});
// PATCH /api/dashboard/salons
router.patch('/salons', (req, res) => {
    const { salonId, ...updates } = req.body || {};
    if (!salonId) {
        res.status(400).json({ error: 'Salon ID is required' });
        return;
    }
    const salon = db_js_1.db.salons.get(salonId);
    if (!salon) {
        res.status(404).json({ error: 'Salon not found' });
        return;
    }
    const updated = { ...salon, ...updates };
    db_js_1.db.salons.set(salonId, updated);
    res.json({ message: 'Salon updated successfully', salon: updated });
});
// DELETE /api/dashboard/salons
router.delete('/salons', (req, res) => {
    const { salonId } = req.body || {};
    if (!salonId || !db_js_1.db.salons.has(salonId)) {
        res.status(404).json({ error: 'Salon not found' });
        return;
    }
    db_js_1.db.salons.delete(salonId);
    res.json({ message: 'Salon deleted successfully' });
});
// GET /api/dashboard/employees
router.get('/employees', (req, res) => {
    const salonId = req.query.salonId;
    const salons = Array.from(db_js_1.db.salons.values());
    if (salonId) {
        const salon = db_js_1.db.salons.get(salonId);
        if (!salon) {
            res.json([]);
            return;
        }
        const employees = (salon.employees || []).map((e) => ({
            id: e.id,
            name: e.user.name,
            email: e.user.email,
            rating: 4.8,
            isAvailable: true,
            salonId: salon.id,
        }));
        res.json(employees);
        return;
    }
    const allEmployees = salons.flatMap((s) => (s.employees || []).map((e) => ({
        id: e.id,
        name: e.user.name,
        email: e.user.email,
        rating: 4.8,
        isAvailable: true,
        salonId: s.id,
        salonName: s.name,
    })));
    res.json(allEmployees);
});
// POST /api/dashboard/employees
router.post('/employees', async (req, res) => {
    const { salonId, name, email, phone } = req.body || {};
    if (!salonId || !name || !email) {
        res.status(400).json({ error: 'Salon ID, name, and email are required' });
        return;
    }
    const salon = db_js_1.db.salons.get(salonId);
    if (!salon) {
        res.status(404).json({ error: 'Salon not found' });
        return;
    }
    const tempPassword = `Pass@${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = await bcryptjs_1.default.hash(tempPassword, 10);
    const newEmpId = `emp-${Date.now()}`;
    const newUser = {
        id: `usr-${Date.now()}`,
        name,
        email,
        phone,
        role: 'EMPLOYEE',
        passwordHash,
        walletBalance: 0,
        loyaltyPoints: 0,
    };
    db_js_1.db.users.set(newUser.id, newUser);
    const newEmployee = {
        id: newEmpId,
        title: 'Stylist & Beauty Specialist',
        user: {
            name,
            email,
            avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
        },
    };
    salon.employees = [...(salon.employees || []), newEmployee];
    db_js_1.db.salons.set(salon.id, salon);
    res.status(201).json({
        message: 'Staff added successfully',
        employee: newEmployee,
        credentials: {
            email,
            password: tempPassword,
        },
    });
});
// POST /api/dashboard/create-salon-owner
router.post('/create-salon-owner', async (req, res) => {
    const { email, password, name, phone, salonName, address, latitude, longitude } = req.body || {};
    if (!email || !salonName) {
        res.status(400).json({ error: 'Email and Salon Name are required' });
        return;
    }
    const existing = Array.from(db_js_1.db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
    }
    let passwordHash = undefined;
    if (password) {
        passwordHash = await bcryptjs_1.default.hash(password, 10);
    }
    const ownerId = `usr-${Date.now()}`;
    const owner = {
        id: ownerId,
        name: name || salonName,
        email,
        phone,
        role: 'SALON_OWNER',
        passwordHash,
        walletBalance: 0,
        loyaltyPoints: 0,
    };
    db_js_1.db.users.set(ownerId, owner);
    const slug = salonName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newSalon = {
        id: `salon-${Date.now()}`,
        name: salonName,
        slug,
        category: 'UNISEX',
        address: address || 'Addis Ababa',
        latitude: Number(latitude) || 9.032,
        longitude: Number(longitude) || 38.7469,
        phone: phone || '+251 900 000000',
        email,
        description: `Premium beauty and grooming services at ${salonName}.`,
        bannerUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200',
        isVerified: true,
        rating: 5.0,
        featured: false,
        workingHours: [
            { id: 'wh-1', dayOfWeek: 1, openTime: '08:30', closeTime: '19:30', isClosed: false },
            { id: 'wh-2', dayOfWeek: 2, openTime: '08:30', closeTime: '19:30', isClosed: false },
            { id: 'wh-3', dayOfWeek: 3, openTime: '08:30', closeTime: '19:30', isClosed: false },
            { id: 'wh-4', dayOfWeek: 4, openTime: '08:30', closeTime: '19:30', isClosed: false },
            { id: 'wh-5', dayOfWeek: 5, openTime: '08:30', closeTime: '19:30', isClosed: false },
            { id: 'wh-6', dayOfWeek: 6, openTime: '08:30', closeTime: '19:30', isClosed: false },
            { id: 'wh-7', dayOfWeek: 0, openTime: '10:00', closeTime: '17:00', isClosed: false },
        ],
        services: [
            {
                id: `srv-${Date.now()}`,
                salonId: `salon-${Date.now()}`,
                name: 'Signature Haircut & Wash',
                description: 'Precision cut, wash, and scalp stimulation massage.',
                duration: 45,
                price: 500,
                category: 'Haircut',
            },
        ],
        employees: [],
        reviews: [],
        coupons: [],
        portfolio: [],
    };
    db_js_1.db.salons.set(newSalon.id, newSalon);
    res.status(201).json({
        message: 'Salon owner created successfully',
        user: {
            id: owner.id,
            name: owner.name,
            email: owner.email,
            role: owner.role,
        },
        salon: newSalon,
    });
});
exports.default = router;
