import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';

function makeInvitationCode() {
  return `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

export async function GET(request: Request) {
  try {
    await requireRole(request, ['ADMIN', 'SUPER_ADMIN']);

    const invites = await prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invites);
  } catch (res) {
    return res instanceof NextResponse ? res : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
    const body = await request.json();
    const { targetEmail, role, expiresInDays } = body;

    const inviteCode = makeInvitationCode();
    const expiresAt = expiresInDays ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000) : null;

    const invitation = await prisma.invitation.create({
      data: {
        code: inviteCode,
        targetEmail: targetEmail ? targetEmail.toLowerCase() : null,
        role: role || 'SALON_OWNER',
        expiresAt: expiresAt || undefined,
        createdById: user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'INVITE_CREATE',
        details: `Created invitation ${invitation.code} for role ${invitation.role}`,
      },
    });

    return NextResponse.json({ invitation });
  } catch (res) {
    return res instanceof NextResponse ? res : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
