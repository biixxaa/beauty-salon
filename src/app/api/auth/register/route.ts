// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    const generatedReferralCode = `${name.split(' ')[0].toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
    const mockUserId = `mock-user-customer-${Math.floor(1000 + Math.random() * 9000)}`;

    return NextResponse.json({
      message: 'Registration successful',
      userId: mockUserId,
      email: email,
      referralCode: generatedReferralCode,
    }, { status: 201 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Registration API Error:', msg);
    return NextResponse.json({ error: msg || 'Internal Server Error' }, { status: 500 });
  }
}
