// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { serverDb } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Try to get authenticated user from JWT token (cookie or Authorization header)
    const tokenUser = await getUserFromRequest(request);

    if (tokenUser?.id) {
      const dbUser = serverDb.getUserById(tokenUser.id) || serverDb.getUserByEmail(tokenUser.email);
      if (dbUser) {
        return NextResponse.json({
          user: {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            avatarUrl: dbUser.avatarUrl,
            phone: dbUser.phone,
            walletBalance: dbUser.walletBalance ?? 0,
            loyaltyPoints: dbUser.loyaltyPoints ?? 0,
            referralCode: dbUser.referralCode,
            profile: {
              walletBalance: dbUser.walletBalance ?? 0,
              points: dbUser.loyaltyPoints ?? 0,
              referralCode: dbUser.referralCode || `${dbUser.name.split(' ')[0].toUpperCase()}-${dbUser.id.substring(0, 4)}`,
            },
          },
        });
      }
    }

    // 2. Fallback to default demo customer user for seamless instant local preview
    const fallbackUser = serverDb.getUserById('usr-customer-1');
    if (fallbackUser) {
      return NextResponse.json({
        user: {
          id: fallbackUser.id,
          name: fallbackUser.name,
          email: fallbackUser.email,
          role: fallbackUser.role,
          avatarUrl: fallbackUser.avatarUrl,
          phone: fallbackUser.phone,
          walletBalance: fallbackUser.walletBalance ?? 450,
          loyaltyPoints: fallbackUser.loyaltyPoints ?? 120,
          referralCode: fallbackUser.referralCode ?? 'ABEBE50',
          profile: {
            walletBalance: fallbackUser.walletBalance ?? 450,
            points: fallbackUser.loyaltyPoints ?? 120,
            referralCode: fallbackUser.referralCode ?? 'ABEBE50',
          },
        },
      });
    }

    return NextResponse.json({ user: null }, { status: 401 });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

