// src/lib/auth.ts
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from './db';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-beauty-salon-booking-saas-2026';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { id: string; email: string; name: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { id: string; email: string; name: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string; role: string };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('verifyToken error:', msg);
    return null;
  }
}

export async function getUserFromRequest(request: Request) {
  try {
    // Check Authorization header or Cookie header
    let token = '';
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Parse from cookies
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, val] = cookie.trim().split('=');
          acc[key] = val;
          return acc;
        }, {} as Record<string, string>);
        token = cookies['beauty_session'] || '';
      }
    }

    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      avatarUrl: null,
    };

    return user;
  } catch (error) {
    console.error('Error fetching user from request:', error);
    return null;
  }
}

export async function requireRole(request: Request, allowedRoles: string[]) {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!allowedRoles.includes(user.role)) {
    throw new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  return user;
}
