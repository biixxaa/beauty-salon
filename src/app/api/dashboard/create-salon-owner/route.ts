// src/app/api/dashboard/create-salon-owner/route.ts
import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { serverDb } from '@/lib/serverDb';
import { MockSalon } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, name, phone, salonName, address, latitude, longitude } = body;

    if (!email || !salonName) {
      return NextResponse.json({ error: 'Email and Salon Name are required' }, { status: 400 });
    }

    const existingUser = serverDb.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    let passwordHash = undefined;
    if (password) {
      passwordHash = await hashPassword(password);
    }

    const owner = serverDb.createUser({
      name: name || salonName,
      email,
      phone,
      role: 'SALON_OWNER',
      passwordHash,
    });

    const slug = salonName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newSalon: MockSalon = {
      id: `salon-${Date.now()}`,
      name: salonName,
      slug,
      category: 'UNISEX',
      address: address || 'Addis Ababa',
      latitude: Number(latitude) || 9.032,
      longitude: Number(longitude) || 38.7469,
      phone: phone || '+251 900 000000',
      email,
      description: `Premium beauty and grooming services at ${salonName}.`,
      bannerUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200',
      isVerified: true,
      rating: 5.0,
      featured: false,
      workingHours: [
        { id: 'wh-1', dayOfWeek: 1, openTime: '08:30', closeTime: '19:30', isClosed: false },
        { id: 'wh-2', dayOfWeek: 2, openTime: '08:30', closeTime: '19:30', isClosed: false },
        { id: 'wh-3', dayOfWeek: 3, openTime: '08:30', closeTime: '19:30', isClosed: false },
        { id: 'wh-4', dayOfWeek: 4, openTime: '08:30', closeTime: '19:30', isClosed: false },
        { id: 'wh-5', dayOfWeek: 5, openTime: '08:30', closeTime: '19:30', isClosed: false },
        { id: 'wh-6', dayOfWeek: 6, openTime: '08:30', closeTime: '19:30', isClosed: false },
        { id: 'wh-7', dayOfWeek: 0, openTime: '10:00', closeTime: '17:00', isClosed: false },
      ],
      services: [
        {
          id: `srv-${Date.now()}-1`,
          salonId: `salon-${Date.now()}`,
          name: 'Signature Haircut & Wash',
          description: 'Customized precision haircut, organic wash, and scalp stimulation massage.',
          duration: 45,
          price: 500,
          category: 'Haircut',
        },
      ],
      employees: [],
      reviews: [],
      coupons: [],
      portfolio: [],
    };

    serverDb.createSalon(newSalon);

    return NextResponse.json({
      message: 'Salon owner created successfully',
      user: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
      },
      salon: newSalon,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in create-salon-owner:', error);
    return NextResponse.json({ error: 'Failed to create salon owner' }, { status: 500 });
  }
}

