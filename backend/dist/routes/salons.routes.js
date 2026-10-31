"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/salons.routes.ts
const express_1 = require("express");
const db_js_1 = require("../data/db.js");
const router = (0, express_1.Router)();
// GET /api/salons
router.get('/', (req, res) => {
    let salons = Array.from(db_js_1.db.salons.values());
    const category = req.query.category;
    const query = req.query.query?.toLowerCase();
    const featured = req.query.featured === 'true';
    const ratingStr = req.query.rating;
    if (featured) {
        salons = salons.filter((s) => s.featured);
    }
    if (category && category.toUpperCase() !== 'ALL') {
        salons = salons.filter((s) => s.category.toUpperCase() === category.toUpperCase());
    }
    if (query) {
        salons = salons.filter((s) => s.name.toLowerCase().includes(query) ||
            s.description.toLowerCase().includes(query) ||
            s.address.toLowerCase().includes(query));
    }
    if (ratingStr) {
        const min = parseFloat(ratingStr);
        if (!isNaN(min)) {
            salons = salons.filter((s) => s.rating >= min);
        }
    }
    res.json(salons);
});
// POST /api/salons
router.post('/', (req, res) => {
    const body = req.body || {};
    const name = body.name || 'New Beauty Salon';
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newSalon = {
        id: `salon-${Date.now()}`,
        name,
        slug,
        category: body.category || 'UNISEX',
        address: body.address || 'Addis Ababa',
        latitude: Number(body.latitude) || 9.032,
        longitude: Number(body.longitude) || 38.7469,
        phone: body.phone || '+251 900 000000',
        email: body.email || 'contact@salon.et',
        description: body.description || 'Modern beauty salon in Addis Ababa.',
        bannerUrl: body.bannerUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200',
        isVerified: false,
        rating: 5.0,
        featured: false,
        workingHours: [
            { id: 'wh-1', dayOfWeek: 1, openTime: '08:00', closeTime: '20:00', isClosed: false },
            { id: 'wh-2', dayOfWeek: 2, openTime: '08:00', closeTime: '20:00', isClosed: false },
            { id: 'wh-3', dayOfWeek: 3, openTime: '08:00', closeTime: '20:00', isClosed: false },
            { id: 'wh-4', dayOfWeek: 4, openTime: '08:00', closeTime: '20:00', isClosed: false },
            { id: 'wh-5', dayOfWeek: 5, openTime: '08:00', closeTime: '20:00', isClosed: false },
            { id: 'wh-6', dayOfWeek: 6, openTime: '08:00', closeTime: '20:00', isClosed: false },
            { id: 'wh-7', dayOfWeek: 0, openTime: '09:00', closeTime: '18:00', isClosed: false },
        ],
        services: body.services || [],
        employees: body.employees || [],
        reviews: [],
        coupons: [],
        portfolio: [],
    };
    db_js_1.db.salons.set(newSalon.id, newSalon);
    res.status(201).json({
        message: 'Salon registered successfully',
        salon: newSalon,
    });
});
// GET /api/salons/:slug
router.get('/:slug', (req, res) => {
    const slug = String(req.params.slug);
    const salon = Array.from(db_js_1.db.salons.values()).find((s) => s.slug === slug || s.id === slug);
    if (!salon) {
        res.status(404).json({ error: 'Salon not found' });
        return;
    }
    res.json(salon);
});
exports.default = router;
