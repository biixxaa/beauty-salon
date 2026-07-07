import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cbeBirr, verifyWebhookSignature } from '@/lib/payments/telebirr';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-cbe-signature') || request.headers.get('x-signature') || request.headers.get('x-hub-signature-256');
    const secret = process.env.CBE_WEBHOOK_SECRET;
    const sigOk = verifyWebhookSignature(secret, rawBody, signature || null);
    if (!sigOk) {
      console.warn('CBE webhook signature verification failed');
      return NextResponse.json({ ok: false, error: 'Signature verification failed' }, { status: 400 });
    }

    const body = JSON.parse(rawBody);
    const { bookingId, outTradeNo } = body as any;

    let targetBookingId = bookingId;
    if (!targetBookingId && outTradeNo && typeof outTradeNo === 'string') {
      const parts = outTradeNo.split('-');
      if (parts.length >= 2) targetBookingId = parts[1];
    }

    if (!targetBookingId) return NextResponse.json({ ok: false, error: 'No booking identifier provided' }, { status: 400 });

    const booking = await prisma.booking.findUnique({ where: { id: targetBookingId }, include: { customer: true } });
    if (!booking) return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });

    const providerTxId = outTradeNo || `cbe-${booking.id}-${Date.now().toString().slice(-6)}`;
    const existingTxn = await prisma.paymentTransaction.findUnique({ where: { providerTxId } });
    if (existingTxn && existingTxn.status === 'PAID') {
      return NextResponse.json({ ok: true, booking });
    }

    const amount = booking.finalPrice ?? booking.totalPrice;
    await prisma.paymentTransaction.upsert({
      where: { providerTxId },
      update: {
        status: 'PAID',
        rawPayload: body,
        receivedAt: new Date(),
      },
      create: {
        bookingId: booking.id,
        provider: 'CBE_BIRR',
        providerTxId,
        status: 'PAID',
        method: 'CBE_BIRR',
        amount: amount.toString ? amount.toString() : amount,
        rawPayload: body,
        receivedAt: new Date(),
        createdAt: new Date(),
      },
    });

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: 'CBE_BIRR',
        paymentDetails: { ...(booking.paymentDetails as any) || {}, ...body, providerTxId },
        status: 'CONFIRMED',
      },
    });

    if (!existingTxn) {
      await prisma.auditLog.create({ data: { userId: booking.customerId, action: 'PAYMENT_CBE', details: `CBE Birr payment received for booking ${booking.id}` } });
      await prisma.notification.create({ data: { userId: booking.customerId, title: 'Payment received', message: `We received your CBE Birr payment for booking at ${booking.salonId}.`, type: 'BOOKING_REMINDER' } });

      try {
        if (booking.customer?.email) await sendEmail({ to: booking.customer.email, subject: 'Payment received', text: `We received payment for your booking ${booking.id}.` });
        if ((booking as any).paymentDetails?.customerPhone || booking.customer?.phone) {
          const to = (booking as any).paymentDetails?.customerPhone || booking.customer?.phone;
          await sendSms({ to, message: `Payment received for booking ${booking.id}.` });
        }
      } catch (e) {
        console.warn('Notification send failed', e);
      }
    }

    try {
      if (booking.customer?.email) await sendEmail({ to: booking.customer.email, subject: 'Payment received', text: `We received payment for your booking ${booking.id}.` });
      if ((booking as any).paymentDetails?.customerPhone || booking.customer?.phone) {
        const to = (booking as any).paymentDetails?.customerPhone || booking.customer?.phone;
        await sendSms({ to, message: `Payment received for booking ${booking.id}.` });
      }
    } catch (e) {
      console.warn('Notification send failed', e);
    }

    return NextResponse.json({ ok: true, booking: updated });
  } catch (error: any) {
    console.error('CBE webhook error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
