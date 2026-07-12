import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { telebirr, verifyWebhookSignature } from '@/lib/payments/telebirr';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-telebirr-signature') || request.headers.get('x-signature') || request.headers.get('x-hub-signature-256');

    const secret = process.env.TELEBIRR_WEBHOOK_SECRET;
    const sigOk = verifyWebhookSignature(secret, rawBody, signature || null);
    if (!sigOk) {
      console.warn('Telebirr webhook signature verification failed');
      return NextResponse.json({ ok: false, error: 'Signature verification failed' }, { status: 400 });
    }

    const body = JSON.parse(rawBody) as Record<string, unknown>;
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId : undefined;
    const outTradeNo = typeof body.outTradeNo === 'string' ? body.outTradeNo : undefined;

    const verified = telebirr.verifyCallback(rawBody);
    if (!verified) {
      console.warn('Telebirr webhook payload not verified', body);
      return NextResponse.json({ ok: false, error: 'Payload verification failed' }, { status: 400 });
    }

    // Resolve bookingId if outTradeNo was used (format: TB-<bookingId>-<suffix>)
    let targetBookingId = bookingId;
    if (!targetBookingId && outTradeNo && typeof outTradeNo === 'string') {
      const parts = outTradeNo.split('-');
      if (parts.length >= 2) targetBookingId = parts[1];
    }

    if (!targetBookingId) {
      return NextResponse.json({ ok: false, error: 'No booking identifier provided' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: targetBookingId }, include: { customer: true } });
    if (!booking) return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });

    const providerTxId = outTradeNo || `telebirr-${booking.id}-${Date.now().toString().slice(-6)}`;
    const existingTxn = await prisma.paymentTransaction.findUnique({ where: { providerTxId } });
    if (existingTxn && existingTxn.status === 'PAID') {
      return NextResponse.json({ ok: true, booking });
    }

    const amount = booking.finalPrice ?? booking.totalPrice;
    const transaction = await prisma.paymentTransaction.upsert({
      where: { providerTxId },
      update: {
        status: 'PAID',
        rawPayload: body,
        receivedAt: new Date(),
      },
      create: {
        bookingId: booking.id,
        provider: 'TELEBIRR',
        providerTxId,
        status: 'PAID',
        method: 'TELEBIRR',
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
        paymentMethod: 'TELEBIRR',
        paymentDetails: { ...((booking.paymentDetails as Record<string, unknown>) || {}), ...body, providerTxId },
        status: 'CONFIRMED',
      },
    });

    if (!existingTxn) {
      await prisma.auditLog.create({ data: { userId: booking.customerId, action: 'PAYMENT_TELEBIRR', details: `Telebirr payment received for booking ${booking.id}` } });
      await prisma.notification.create({ data: { userId: booking.customerId, title: 'Payment received', message: `We received your Telebirr payment for booking at ${booking.salonId}.`, type: 'BOOKING_REMINDER' } });

      try {
        if (booking.customer?.email) {
          await sendEmail({ to: booking.customer.email, subject: 'Payment received', text: `We received payment for your booking ${booking.id}.` });
        }
        {
          const paymentDetails = (booking.paymentDetails as Record<string, unknown> | undefined) ?? {};
          const phoneFromDetails = typeof (paymentDetails as Record<string, unknown>)['customerPhone'] === 'string' ? (paymentDetails as Record<string, unknown>)['customerPhone'] as string : undefined;
          const to = phoneFromDetails || booking.customer?.phone;
          if (to) await sendSms({ to, message: `Payment received for booking ${booking.id}. See your app for details.` });
        }
      } catch (e) {
        console.warn('Notification send failed', e);
      }
    }

    // Send optional email / SMS notifications (simulated if services not configured)
    try {
      if (booking.customer?.email) {
        await sendEmail({ to: booking.customer.email, subject: 'Payment received', text: `We received payment for your booking ${booking.id}.` });
      }
      {
        const paymentDetails = (booking.paymentDetails as Record<string, unknown> | undefined) ?? {};
        const phoneFromDetails = typeof (paymentDetails as Record<string, unknown>)['customerPhone'] === 'string' ? (paymentDetails as Record<string, unknown>)['customerPhone'] as string : undefined;
        const to = phoneFromDetails || booking.customer?.phone;
        if (to) await sendSms({ to, message: `Payment received for booking ${booking.id}. See your app for details.` });
      }
    } catch (e) {
      console.warn('Notification send failed', e);
    }

    return NextResponse.json({ ok: true, booking: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Telebirr webhook error:', msg);
    return NextResponse.json({ ok: false, error: msg || 'Internal Server Error' }, { status: 500 });
  }
}
