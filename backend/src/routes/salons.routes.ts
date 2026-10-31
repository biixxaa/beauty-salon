// backend/src/routes/salons.routes.ts
import { Router, Request, Response } from 'express';
import { db } from '../data/db.js';
import { Salon } from '../types/index.js';

const router = Router();

// GET /api/salons
router.get('/', (req: Request, res: Response) => {
  let salons = Array.from(db.salons.values());

  const category = req.query.category as string;
  const query = (req.query.query as string)?.toLowerCase();
  const featured = req.query.featured === 'true';
  const ratingStr = req.query.rating as string;

  if (featured) {
    salons = salons.filter((s) => s.featured);
  }

  if (category && category.toUpperCase() !== 'ALL') {
    salons = salons.filter((s) => s.category.toUpperCase() === category.toUpperCase());
  }

  if (query) {
    salons = salons.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.address.toLowerCase().includes(query)
    );
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
router.post('/', (req: Request, res: Response) => {
  const body = req.body || {};
  const name = body.name || 'New Beauty Salon';
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const newSalon: Salon = {
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

  db.salons.set(newSalon.id, newSalon);

  res.status(201).json({
    message: 'Salon registered successfully',
    salon: newSalon,
  });
});

// GET /api/salons/:slug
router.get('/:slug', (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const salon = Array.from(db.salons.values()).find((s) => s.slug === slug || s.id === slug);

  if (!salon) {
    res.status(404).json({ error: 'Salon not found' });
    return;
  }

  res.json(salon);
});

export default router;

