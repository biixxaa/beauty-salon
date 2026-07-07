import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(request, ['SALON_OWNER', 'ADMIN', 'SUPER_ADMIN']);
    const body = await request.json();
    const { salonId, isVerified, featured, name, description, address, phone, email, bannerUrl } = body;

    if (!salonId) {
      return NextResponse.json({ error: 'Missing salonId' }, { status: 400 });
    }

    const salon = await prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    if (salon.ownerId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.salon.update({
      where: { id: salonId },
      data: {
        name: name ?? salon.name,
        description: description ?? salon.description,
        address: address ?? salon.address,
        phone: phone ?? salon.phone,
        email: email ?? salon.email,
        bannerUrl: bannerUrl ?? salon.bannerUrl,
        featured: featured ?? salon.featured,
        isVerified: isVerified ?? salon.isVerified,
      },
    });

    await prisma.auditLog.create({ data: { userId: user.id, action: 'SALON_UPDATE', details: `Updated salon ${salonId}` } });

    return NextResponse.json({ salon: updated });
  } catch (res) {
    return res instanceof NextResponse ? res : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
