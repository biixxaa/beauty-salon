// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../data/db.js';
import { User } from '../types/index.js';

export interface AuthRequest extends Request {
  user?: User;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-beauty-salon-booking-saas-2026';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  let token = '';

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, c) => {
      const [key, val] = c.trim().split('=');
      acc[key] = val;
      return acc;
    }, {} as Record<string, string>);
    token = cookies['beauty_session'] || '';
  }

  if (!token) {
    // If no token is provided, fall back to default demo customer so frontend works out of the box
    const demoCustomer = db.users.get('usr-customer-1');
    if (demoCustomer) {
      req.user = demoCustomer;
    }
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const user = db.users.get(decoded.id) || Array.from(db.users.values()).find((u) => u.email === decoded.email);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    console.warn('JWT verification failed in standalone backend:', error);
  }

  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
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

