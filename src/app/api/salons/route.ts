import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SalonCategory, Prisma } from '@prisma/client';

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const query = searchParams.get('query');
    const ratingStr = searchParams.get('rating');
    const latStr = searchParams.get('latitude');
    const lngStr = searchParams.get('longitude');
    const radiusStr = searchParams.get('radius'); // in km, default 10km
    const featuredOnly = searchParams.get('featured') === 'true';

    const whereClause: Prisma.SalonWhereInput = {};

    if (category && category.toUpperCase() !== 'ALL') {
      whereClause.category = category.toUpperCase() as SalonCategory;
    }

    if (featuredOnly) {
      whereClause.featured = true;
    }

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (ratingStr) {
      const minRating = parseFloat(ratingStr);
      if (!isNaN(minRating)) {
        whereClause.rating = { gte: minRating };
      }
    }

    const salons = await prisma.salon.findMany({
      where: whereClause,
      include: {
        services: true,
        workingHours: true,
      },
    });

    if (latStr && lngStr) {
      const clientLat = parseFloat(latStr);
      const clientLng = parseFloat(lngStr);
      const radiusLimit = radiusStr ? parseFloat(radiusStr) : 10.0;

      if (!isNaN(clientLat) && !isNaN(clientLng)) {
        const salonsWithDistance = salons
          .map((salon) => {
            const distance = getDistance(clientLat, clientLng, salon.latitude, salon.longitude);
            return { ...salon, distance: parseFloat(distance.toFixed(2)) };
          })
          .filter((salon) => isNaN(radiusLimit) || salon.distance <= radiusLimit);

        salonsWithDistance.sort((a, b) => a.distance - b.distance);
        return NextResponse.json(salonsWithDistance);
      }
    }

    return NextResponse.json(salons);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('List Salons API Error:', msg);
    return NextResponse.json({ error: msg || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, ownerId, category, address, latitude, longitude, phone, email, description, bannerUrl } = body;

    if (!name || !ownerId || !phone || !email || !address) {
      return NextResponse.json({ error: 'Missing required business registration fields' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const salon = await prisma.salon.create({
      data: {
        name,
        slug,
        ownerId,
        category: category || 'UNISEX',
        address,
        latitude: parseFloat(latitude) || 9.0,
        longitude: parseFloat(longitude) || 38.7,
        phone,
        email,
        description,
        bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000',
        isVerified: false,
      },
    });

    for (let day = 0; day <= 6; day++) {
      await prisma.workingHours.create({
        data: {
          salonId: salon.id,
          dayOfWeek: day,
          openTime: '08:00',
          closeTime: '20:00',
          isClosed: day === 0,
        },
      });
    }

    return NextResponse.json({ message: 'Salon registered successfully', salon }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Create Salon API Error:', msg);
    return NextResponse.json({ error: msg || 'Internal Server Error' }, { status: 500 });
  }
}
