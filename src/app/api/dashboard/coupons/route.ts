// src/app/api/dashboard/coupons/route.ts
import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const coupons = serverDb.getAllCoupons();
    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, discountPercent, expiryDate, usageLimit, maxDiscount, salonId } = body;

    if (!code || !discountPercent) {
      return NextResponse.json({ error: 'Code and discount percentage are required' }, { status: 400 });
    }

    const newCoupon = serverDb.createCoupon({
      id: `cp-${Date.now()}`,
      code: String(code).toUpperCase().trim(),
      discountPercent: Number(discountPercent) || 10,
      isActive: true,
      expiryDate: expiryDate || '2027-12-31',
      usageLimit: Number(usageLimit) || 50,
      maxDiscount: Number(maxDiscount) || 300,
      salonId,
    });

    return NextResponse.json({
      message: 'Coupon created successfully',
      coupon: newCoupon,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

