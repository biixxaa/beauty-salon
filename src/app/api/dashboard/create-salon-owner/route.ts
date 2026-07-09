import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { requireRole } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
    const body = await request.json();
    const { email, password, name, phone, salonName, address, latitude, longitude } = body;

    if (!email || !password || !name || !salonName) {
      return NextResponse.json(
        { error: 'Email, password, name, and salon name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone: phone || undefined }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user and profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          phone,
          role: 'SALON_OWNER',
        },
      });

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          referralCode: `${name.split(' ')[0].toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
          points: 0,
          walletBalance: 0.00,
        },
      });

      // Create salon
      const salon = await tx.salon.create({
        data: {
          ownerId: user.id,
          name: salonName,
          slug: salonName.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(7),
          address: address || 'To be updated',
          latitude: latitude !== undefined && latitude !== null ? parseFloat(latitude) : 9.0320,
          longitude: longitude !== undefined && longitude !== null ? parseFloat(longitude) : 38.7469,
          phone: phone || 'N/A',
          email: email,
          category: 'UNISEX',
          isVerified: false,
        },
      });

      return { user, profile, salon };
    });

    // Log audit
    const user = await prisma.user.findUnique({
      where: { email: request.headers.get('x-user-email') || 'system' },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        action: 'SALON_OWNER_CREATED',
        details: `Admin created salon owner account: ${email} with salon: ${salonName}`,
      },
    });

    return NextResponse.json(
      {
        message: 'Salon owner account created successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        salon: {
          id: result.salon.id,
          name: result.salon.name,
          slug: result.salon.slug,
        },
      },
      { status: 201 }
    );
  } catch (res) {
    return res instanceof NextResponse
      ? res
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
