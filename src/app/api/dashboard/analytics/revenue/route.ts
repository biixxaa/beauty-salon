import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ['SALON_OWNER', 'ADMIN', 'SUPER_ADMIN']);

    // Find salon(s) owned by this user
    const ownedSalons = await prisma.salon.findMany({ where: { ownerId: user.id }, select: { id: true } });
    const salonIds = ownedSalons.map((s: { id: string }) => s.id);

    // Aggregate monthly revenue for the past 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const revenues = await prisma.$queryRaw`
      SELECT date_trunc('month', "createdAt") as month, SUM("finalPrice") as total
      FROM "Booking"
      WHERE "salonId" = ANY(${salonIds}::uuid[])
        AND "paymentStatus" = 'PAID'
        AND "createdAt" >= ${twelveMonthsAgo}
      GROUP BY month
      ORDER BY month ASC
    `;

    return NextResponse.json({ revenues });
  } catch (res) {
    return res instanceof NextResponse ? res : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
