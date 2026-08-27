// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Determine role from email
    let role = 'CUSTOMER';
    let name = 'Demo Customer';
    if (email.includes('admin')) {
      role = 'ADMIN';
      name = 'Demo Admin';
    } else if (email.includes('owner')) {
      role = 'SALON_OWNER';
      name = 'Demo Salon Owner';
    } else if (email.includes('employee') || email.includes('staff')) {
      role = 'EMPLOYEE';
      name = 'Demo Employee';
    }

    const userId = `mock-user-${role.toLowerCase()}`;

    // Sign JWT
    const token = signToken({
      id: userId,
      email: email,
      name: name,
      role: role,
    });

    // Set cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: userId,
        email: email,
        name: name,
        role: role,
        avatarUrl: null,
      },
    });

    response.headers.set(
      'Set-Cookie',
      `beauty_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
    );

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Login API Error:', msg);
    return NextResponse.json({ error: msg || 'Internal Server Error' }, { status: 500 });
  }
}
