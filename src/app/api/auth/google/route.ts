import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signToken, hashPassword } from '@/lib/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    // Verify token with Google's tokeninfo endpoint
    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!tokenInfoRes.ok) {
      return NextResponse.json({ error: 'Invalid Google ID token' }, { status: 401 });
    }

    const tokenInfo = await tokenInfoRes.json();

    // Validate audience
    if (GOOGLE_CLIENT_ID && tokenInfo.aud !== GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: 'Invalid token audience' }, { status: 401 });
    }

    const email = tokenInfo.email;
    const name = tokenInfo.name || tokenInfo.email.split('@')[0];
    const picture = tokenInfo.picture;
    const googleId = tokenInfo.sub;

    if (!email || !googleId) {
      return NextResponse.json({ error: 'Google token missing required fields' }, { status: 400 });
    }

    // Upsert user
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({ where: { id: user.id }, data: { googleId, avatarUrl: picture } });
      }
    } else {
      // Create a random password hash to satisfy schema; user signs in via Google
      const pw = Math.random().toString(36).slice(-12) + Date.now().toString(36).slice(-4);
      const passwordHash = await hashPassword(pw);

      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          googleId,
          avatarUrl: picture,
          role: 'CUSTOMER',
          profile: {
            create: {
              referralCode: `${name.split(' ')[0].toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
              walletBalance: 0.0,
            },
          },
        },
      });
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    const response = NextResponse.json({ message: 'Login successful', user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl } });

    response.headers.set(
      'Set-Cookie',
      `beauty_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
    );

    await prisma.auditLog.create({ data: { userId: user.id, action: 'USER_LOGIN_GOOGLE', details: `User logged in with Google (${email})` } });

    return response;
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
