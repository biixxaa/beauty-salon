import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ['SALON_OWNER', 'ADMIN', 'SUPER_ADMIN']);
    const ownedSalons = await prisma.salon.findMany({ where: { ownerId: user.id }, select: { id: true } });
    const salonIds = ownedSalons.map((s) => s.id);

    const coupons = await prisma.coupon.findMany({
      where: {
        salonId: { in: salonIds },
        isActive: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    return NextResponse.json(coupons);
  } catch (res) {
    return res instanceof NextResponse ? res : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, ['SALON_OWNER', 'ADMIN', 'SUPER_ADMIN']);
    const body = await request.json();
    const { salonId, code, discountPercent, maxDiscount, expiryDate, usageLimit } = body;

    if (!salonId || !code || discountPercent == null || maxDiscount == null || !expiryDate) {
      return NextResponse.json({ error: 'Missing required coupon fields' }, { status: 400 });
    }

    const salon = await prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    if (salon.ownerId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.coupon.findUnique({ where: { salonId_code: { salonId, code } } });
    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists for this salon' }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        salonId,
        code: code.toUpperCase(),
        discountPercent: Number(discountPercent),
        maxDiscount: Number(maxDiscount),
        expiryDate: new Date(expiryDate),
        usageLimit: Number(usageLimit) || 100,
        isActive: true,
      },
    });

    await prisma.auditLog.create({ data: { userId: user.id, action: 'COUPON_CREATE', details: `Created coupon ${coupon.code} for salon ${salonId}` } });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (res) {
    return res instanceof NextResponse ? res : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
