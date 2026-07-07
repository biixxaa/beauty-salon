// src/app/api/salons/[slug]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const salon = await prisma.salon.findUnique({
      where: { slug },
      include: {
        portfolio: true,
        workingHours: true,
        services: {
          include: {
            employees: {
              include: {
                employee: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        email: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        employees: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            services: {
              include: {
                service: true,
              },
            },
          },
        },
        reviews: {
          include: {
            customer: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        coupons: {
          where: {
            isActive: true,
            expiryDate: { gte: new Date() },
          },
        },
      },
    });

    if (!salon) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    return NextResponse.json(salon);
  } catch (error: any) {
    console.error('Fetch Salon Detail API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
