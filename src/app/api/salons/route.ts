// src/app/api/salons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/serverDb';
import { MockSalon } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let salons = serverDb.getAllSalons();

    const category = searchParams.get('category');
    const query = searchParams.get('query')?.toLowerCase();
    const featured = searchParams.get('featured') === 'true';
    const ratingStr = searchParams.get('rating');

    if (featured) {
      salons = salons.filter((s) => s.featured);
    }

    if (category && category.toUpperCase() !== 'ALL') {
      salons = salons.filter((s) => s.category.toUpperCase() === category.toUpperCase());
    }

    if (query) {
      salons = salons.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.address.toLowerCase().includes(query)
      );
    }

    if (ratingStr) {
      const min = parseFloat(ratingStr);
      if (!isNaN(min)) {
        salons = salons.filter((s) => s.rating >= min);
      }
    }

    return NextResponse.json(salons);
  } catch (error) {
    console.error('Error fetching salons:', error);
    return NextResponse.json({ error: 'Failed to fetch salons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name || 'New Beauty Salon';
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newSalon: MockSalon = {
      id: `salon-${Date.now()}`,
      name,
      slug,
      category: body.category || 'UNISEX',
      address: body.address || 'Addis Ababa',
      latitude: Number(body.latitude) || 9.032,
      longitude: Number(body.longitude) || 38.7469,
      phone: body.phone || '+251 900 000000',
      email: body.email || 'contact@salon.et',
      description: body.description || 'Modern beauty salon in Addis Ababa.',
      bannerUrl: body.bannerUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200',
      isVerified: false,
      rating: 5.0,
      featured: false,
      workingHours: [
        { id: 'wh-1', dayOfWeek: 1, openTime: '08:00', closeTime: '20:00', isClosed: false },
        { id: 'wh-2', dayOfWeek: 2, openTime: '08:00', closeTime: '20:00', isClosed: false },
        { id: 'wh-3', dayOfWeek: 3, openTime: '08:00', closeTime: '20:00', isClosed: false },
        { id: 'wh-4', dayOfWeek: 4, openTime: '08:00', closeTime: '20:00', isClosed: false },
        { id: 'wh-5', dayOfWeek: 5, openTime: '08:00', closeTime: '20:00', isClosed: false },
        { id: 'wh-6', dayOfWeek: 6, openTime: '08:00', closeTime: '20:00', isClosed: false },
        { id: 'wh-7', dayOfWeek: 0, openTime: '09:00', closeTime: '18:00', isClosed: false },
      ],
      services: body.services || [],
      employees: body.employees || [],
      reviews: [],
      coupons: [],
      portfolio: [],
    };

    serverDb.createSalon(newSalon);

    return NextResponse.json(
      { message: 'Salon registered successfully', salon: newSalon },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating salon:', error);
    return NextResponse.json({ error: 'Failed to create salon' }, { status: 500 });
  }
}

