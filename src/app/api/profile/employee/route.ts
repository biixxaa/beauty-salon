// src/app/api/profile/employee/route.ts
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { serverDb } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const tokenUser = await getUserFromRequest(request);
    const user = tokenUser
      ? serverDb.getUserById(tokenUser.id) || serverDb.getUserByEmail(tokenUser.email)
      : serverDb.getUserById('usr-employee-1');

    return NextResponse.json({
      id: user?.id || 'usr-employee-1',
      name: user?.name || 'Dawit Alemu',
      bio: 'Certified master stylist with 8+ years specializing in modern fades, hair design, and luxury treatments.',
      resumeUrl: '',
      avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
      rating: 4.9,
      user: {
        email: user?.email || 'dawit@bolegrooming.et',
        phone: user?.phone || '+251 922 445566',
      },
      salon: {
        id: 'salon-2',
        name: "Bole Gentlemen's Grooming Lounge",
      },
    });
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const tokenUser = await getUserFromRequest(request);
    const userId = tokenUser?.id || 'usr-employee-1';

    const updatedUser = serverDb.updateUser(userId, {
      avatarUrl: body.avatarUrl,
    });

    return NextResponse.json({
      id: userId,
      name: updatedUser?.name || 'Dawit Alemu',
      bio: body.bio || '',
      resumeUrl: body.resumeUrl || '',
      avatarUrl: body.avatarUrl || updatedUser?.avatarUrl,
      rating: 4.9,
      user: {
        email: updatedUser?.email || 'dawit@bolegrooming.et',
        phone: updatedUser?.phone || '+251 922 445566',
      },
      salon: {
        id: 'salon-2',
        name: "Bole Gentlemen's Grooming Lounge",
      },
    });
  } catch (error) {
    console.error('Error updating employee profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

