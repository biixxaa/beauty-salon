// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const mockProfile = {
      points: 120,
      walletBalance: 250.00,
      hairType: 'Straight',
      faceShape: 'Oval',
      referralCode: 'DEMO123',
    };

    return NextResponse.json({
      user: {
        ...user,
        profile: mockProfile,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
