// backend/src/routes/auth.routes.ts
import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../data/db.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { User } from '../types/index.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-beauty-salon-booking-saas-2026';

// GET /api/auth/me
router.get('/me', (req: AuthRequest, res: Response) => {
  const user = req.user || db.users.get('usr-customer-1');
  if (!user) {
    res.status(401).json({ user: null });
    return;
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      walletBalance: user.walletBalance ?? 0,
      loyaltyPoints: user.loyaltyPoints ?? 0,
      referralCode: user.referralCode,
      profile: {
        walletBalance: user.walletBalance ?? 0,
        points: user.loyaltyPoints ?? 0,
        referralCode: user.referralCode || `${user.name.split(' ')[0].toUpperCase()}-${user.id.substring(0, 4)}`,
      },
    },
  });
});

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body || {};
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  let user = Array.from(db.users.values()).find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim()
  );

  if (user && user.passwordHash && password) {
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid password credentials' });
      return;
    }
  }

  if (!user) {
    // Auto-provision demo account
    const id = `usr-${Date.now()}`;
    user = {
      id,
      name: email.split('@')[0],
      email,
      role: 'CUSTOMER',
      walletBalance: 300,
      loyaltyPoints: 50,
      referralCode: `${email.split('@')[0].toUpperCase()}-100`,
      profile: {
        walletBalance: 300,
        points: 50,
        referralCode: `${email.split('@')[0].toUpperCase()}-100`,
      },
    };
    db.users.set(id, user);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('beauty_session', token, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    message: 'Login successful',
    user: {
      ...user,
      profile: {
        walletBalance: user.walletBalance,
        points: user.loyaltyPoints,
        referralCode: user.referralCode,
      },
    },
    token,
  });
});

// POST /api/auth/register
router.post('/register', async (req: AuthRequest, res: Response) => {
  const { name, email, password, phone, role, referralCodeUsed } = req.body || {};
  if (!email || !name) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }

  const existing = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(409).json({ error: 'User with this email already exists' });
    return;
  }

  let passwordHash = undefined;
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  const id = `usr-${Date.now()}`;
  const newUser: User = {
    id,
    name,
    email,
    phone,
    role: role === 'SALON_OWNER' ? 'SALON_OWNER' : 'CUSTOMER',
    passwordHash,
    walletBalance: 50, // Welcome reward bonus
    loyaltyPoints: 10,
    referralCode: `${name.split(' ')[0].toUpperCase()}-${id.substring(0, 4)}`,
    profile: {
      walletBalance: 50,
      points: 10,
      referralCode: `${name.split(' ')[0].toUpperCase()}-${id.substring(0, 4)}`,
    },
  };

  db.users.set(id, newUser);

  // Referral bonus to referrer
  if (referralCodeUsed) {
    for (const u of db.users.values()) {
      if (u.referralCode?.toLowerCase() === referralCodeUsed.toLowerCase()) {
        u.walletBalance = (u.walletBalance || 0) + 100;
        break;
      }
    }
  }

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('beauty_session', token, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    message: 'Registration successful',
    user: newUser,
    token,
  });
});

// POST /api/auth/logout
router.post('/logout', (_req: AuthRequest, res: Response) => {
  res.clearCookie('beauty_session', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

export default router;

