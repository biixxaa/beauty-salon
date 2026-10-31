// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { hashPassword, signToken } from '@/lib/auth';
import { serverDb } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { name, email, password, phone, role, referralCodeUsed } = await request.json().catch(() => ({}));

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const existing = serverDb.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    let passwordHash = undefined;
    if (password) {
      passwordHash = await hashPassword(password);
    }

    // Welcome reward bonus
    const newUser = serverDb.createUser({
      name,
      email,
      phone,
      role: role === 'SALON_OWNER' ? 'SALON_OWNER' : 'CUSTOMER',
      passwordHash,
      walletBalance: 50, // 50 ETB welcome bonus
      loyaltyPoints: 10,  // 10 welcome points
    });

    // If referral code used, reward referrer with 100 ETB
    if (referralCodeUsed) {
      const allUsers = ['usr-customer-1', 'usr-owner-1', 'usr-employee-1', 'usr-admin-1'];
      for (const uid of allUsers) {
        const u = serverDb.getUserById(uid);
        if (u && u.referralCode?.toLowerCase() === referralCodeUsed.toLowerCase()) {
          serverDb.updateUser(u.id, {
            walletBalance: (u.walletBalance || 0) + 100,
          });
          break;
        }
      }
    }

    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      walletBalance: newUser.walletBalance,
      loyaltyPoints: newUser.loyaltyPoints,
      referralCode: newUser.referralCode,
      profile: {
        walletBalance: newUser.walletBalance,
        points: newUser.loyaltyPoints,
        referralCode: newUser.referralCode,
      },
    };

    const response = NextResponse.json({
      message: 'Registration successful',
      user: safeUser,
      token,
    }, { status: 201 });

    response.cookies.set('beauty_session', token, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Error in /api/auth/register:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

