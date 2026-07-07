// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Retrieve wallet and points from profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: {
        points: true,
        walletBalance: true,
        hairType: true,
        faceShape: true,
        referralCode: true,
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        profile,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
