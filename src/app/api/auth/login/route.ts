// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { signToken, comparePassword } from '@/lib/auth';
import { serverDb } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json().catch(() => ({}));

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find existing user or create on-the-fly demo session
    let user = serverDb.getUserByEmail(email);

    if (user && user.passwordHash && password) {
      const match = await comparePassword(password, user.passwordHash);
      if (!match) {
        return NextResponse.json({ error: 'Invalid password credentials' }, { status: 401 });
      }
    }

    if (!user) {
      // Auto-provision user for quick demo access
      user = serverDb.createUser({
        name: email.split('@')[0],
        email,
        role: 'CUSTOMER',
        walletBalance: 300,
        loyaltyPoints: 50,
      });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const safeUser = {
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
        referralCode: user.referralCode,
      },
    };

    const response = NextResponse.json({
      message: 'Login successful',
      user: safeUser,
      token,
    });

    response.cookies.set('beauty_session', token, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

