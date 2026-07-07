import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ['SALON_OWNER', 'ADMIN', 'SUPER_ADMIN']);
    const ownedSalon = await prisma.salon.findFirst({ where: { ownerId: user.id } });
    if (!ownedSalon) return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    return NextResponse.json(ownedSalon);
  } catch (res) {
    return res instanceof NextResponse ? res : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireRole(request, ['SALON_OWNER', 'ADMIN', 'SUPER_ADMIN']);
    const ownedSalon = await prisma.salon.findFirst({ where: { ownerId: user.id } });
    if (!ownedSalon) return NextResponse.json({ error: 'Salon not found' }, { status: 404 });

    const body = await request.json();
    const { name, description, address, phone, email, bannerUrl, isVerified, featured } = body;

    const updated = await prisma.salon.update({ where: { id: ownedSalon.id }, data: { name, description, address, phone, email, bannerUrl, isVerified, featured } });

    await prisma.auditLog.create({ data: { userId: user.id, action: 'SALON_UPDATE', details: `Updated salon ${updated.id}` } });

    return NextResponse.json({ salon: updated });
  } catch (res) {
    return res instanceof NextResponse ? res : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
