// src/app/api/salons/[slug]/route.ts
import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const salon = serverDb.getSalonByIdOrSlug(slug);

    if (!salon) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    return NextResponse.json(salon);
  } catch (error) {
    console.error('Error fetching salon by slug:', error);
    return NextResponse.json({ error: 'Failed to fetch salon' }, { status: 500 });
  }
}

