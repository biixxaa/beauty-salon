import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, method, paymentReference } = body;

    if (!bookingId || !method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    // Simulate payment success for supported methods
    let status = PaymentStatus.PENDING;
    if (method === PaymentMethod.TELEBIRR || method === PaymentMethod.CBE_BIRR || method === PaymentMethod.CARD) {
      status = PaymentStatus.PAID;
    }

    const updated = await prisma.booking.update({ where: { id: bookingId }, data: { paymentStatus: status, paymentDetails: { paymentReference } } });

    await prisma.auditLog.create({ data: { userId: booking.customerId, action: 'PAYMENT_UPDATE', details: `Payment ${status} for booking ${bookingId}` } });

    return NextResponse.json({ booking: updated });
  } catch (error: any) {
    console.error('Payments POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
