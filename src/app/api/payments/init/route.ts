import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { telebirr, cbeBirr } from '@/lib/payments/telebirr';
import crypto from 'crypto';

type Provider = 'TELEBIRR' | 'CBE_BIRR' | 'CARD';

function signPayload(secret: string | undefined, payload: unknown) {
  if (!secret) return null;
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload), 'utf8');
    return hmac.digest('hex');
  } catch (e) {
    console.warn('Signing error', e);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId : undefined;
    const provider = (typeof body.provider === 'string' ? (body.provider as Provider) : undefined) as Provider | undefined;
    const returnUrl = typeof body.returnUrl === 'string' ? body.returnUrl : undefined;

    if (!bookingId || !provider) {
      return NextResponse.json({ error: 'bookingId and provider are required' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const amount = Number(booking.finalPrice || booking.totalPrice || 0);
    const timestamp = Math.floor(Date.now() / 1000);
    let paymentUrl = '';
    let outTradeNo = '';
    let signature: string | null = null;

    let providerMethod: 'TELEBIRR' | 'CBE_BIRR' | 'CARD' = provider;
    if (provider === 'TELEBIRR') {
      paymentUrl = await telebirr.createPaymentUrl(booking.id, amount);
      try {
        const url = new URL(paymentUrl, 'http://example.com');
        outTradeNo = url.searchParams.get('outTradeNo') || '';
      } catch {}

      const payload = { bookingId: booking.id, amount, outTradeNo, timestamp, returnUrl };
      signature = signPayload(process.env.TELEBIRR_API_SECRET, payload);
    } else if (provider === 'CBE_BIRR') {
      paymentUrl = await cbeBirr.createPaymentUrl(booking.id, amount);
      try {
        const url = new URL(paymentUrl, 'http://example.com');
        outTradeNo = url.searchParams.get('outTradeNo') || '';
      } catch {}

      const payload = { bookingId: booking.id, amount, outTradeNo, timestamp, returnUrl };
      signature = signPayload(process.env.CBE_API_SECRET || process.env.CBE_WEBHOOK_SECRET, payload);
    } else {
      providerMethod = 'CARD';
      outTradeNo = `CARD-${booking.id}-${Date.now().toString().slice(-6)}`;
      paymentUrl = `/checkout/payment-gateway?bookingId=${booking.id}&provider=card&outTradeNo=${outTradeNo}`;
      const payload = { bookingId: booking.id, amount, outTradeNo, timestamp, returnUrl };
      signature = signPayload(process.env.CARD_API_SECRET, payload);
    }

    const providerTxId = outTradeNo || `${provider}-${booking.id}-${timestamp}`;
    const initiatedAt = new Date().toISOString();
    const paymentDetails = { ...((booking.paymentDetails as Record<string, unknown>) || {}), initiatedAt, provider, providerTxId, outTradeNo, signature, returnUrl, status: 'INITIATED' };

    await prisma.$transaction([
      prisma.booking.update({ where: { id: booking.id }, data: { paymentDetails } }),
      prisma.paymentTransaction.create({ data: { bookingId: booking.id, provider, providerTxId, status: 'PENDING', method: providerMethod, amount: amount.toString(), rawPayload: { bookingId: booking.id, provider, amount, outTradeNo, returnUrl, timestamp }, receivedAt: new Date(), createdAt: new Date() } }),
    ]);

    return NextResponse.json({ paymentUrl, outTradeNo, signature });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Payment init error:', msg);
    return NextResponse.json({ error: msg || 'Internal Server Error' }, { status: 500 });
  }
}
