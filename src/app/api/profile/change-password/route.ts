// src/app/api/profile/change-password/route.ts
import { NextResponse } from 'next/server';
import { getUserFromRequest, hashPassword, comparePassword } from '@/lib/auth';
import { serverDb } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json().catch(() => ({}));

    if (!newPassword) {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }

    const tokenUser = await getUserFromRequest(request);
    const userId = tokenUser?.id || 'usr-employee-1';
    const user = serverDb.getUserById(userId);

    if (user?.passwordHash && currentPassword) {
      const match = await comparePassword(currentPassword, user.passwordHash);
      if (!match) {
        return NextResponse.json({ error: 'Current password does not match' }, { status: 400 });
      }
    }

    const newHash = await hashPassword(newPassword);
    serverDb.updateUser(userId, { passwordHash: newHash });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in change-password:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}

