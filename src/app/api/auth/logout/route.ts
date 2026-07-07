// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  // Clear cookie by setting max-age to 0
  response.headers.set(
    'Set-Cookie',
    `beauty_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  );

  return response;
}
