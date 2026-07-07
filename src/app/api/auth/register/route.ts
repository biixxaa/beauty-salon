// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, phone, role, referralCodeUsed } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: phone || undefined }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email or phone already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const generatedReferralCode = `${name.split(' ')[0].toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;

    // Create user and profile
    const result = await prisma.$transaction(async (tx) => {
      // Find referrer if code was used
      let referrerProfile = null;
      if (referralCodeUsed) {
        referrerProfile = await tx.profile.findUnique({
          where: { referralCode: referralCodeUsed },
        });
      }

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          phone,
          role: role || 'CUSTOMER',
        },
      });

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          referralCode: generatedReferralCode,
          referredById: referrerProfile?.id || null,
          points: referrerProfile ? 50 : 0, // 50 points for signing up via referral
          walletBalance: 0.00,
        },
      });

      // If referred, award points to the referrer
      if (referrerProfile) {
        await tx.profile.update({
          where: { id: referrerProfile.id },
          data: {
            points: { increment: 100 }, // 100 points for inviting someone
          },
        });

        // Record transaction for referrer
        await tx.walletTransaction.create({
          data: {
            profileId: referrerProfile.id,
            type: 'REFERRAL_BONUS',
            amount: 100.00,
            description: `Referral bonus for inviting ${name}`,
          },
        });
      }

      return { user, profile };
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_REGISTER',
        details: `Registered user ${email} with role ${role || 'CUSTOMER'}.`,
      },
    });

    return NextResponse.json({
      message: 'Registration successful',
      userId: result.user.id,
      email: result.user.email,
      referralCode: result.profile.referralCode,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
