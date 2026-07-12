// src/lib/payments/telebirr.ts

import crypto from 'crypto';
export interface PaymentRequest {
  appId: string;
  merchCode: string;
  prepayId: string;
  subject: string;
  totalAmount: number;
  outTradeNo: string;
  notifyUrl: string;
  returnUrl: string;
  receiveName: string;
}

export class TelebirrService {
  private appId = process.env.TELEBIRR_APP_ID || 'MOCK_APP_ID';
  private merchCode = process.env.TELEBIRR_MERCHANT_CODE || 'MOCK_MERCHANT_CODE';
  private apiKey = process.env.TELEBIRR_API_KEY || 'MOCK_API_KEY';
  private apiBase = process.env.TELEBIRR_API_URL || '';
  private apiSecret = process.env.TELEBIRR_API_SECRET || '';
  private rsaPrivateKey = process.env.TELEBIRR_RSA_PRIVATE_KEY || '';

  /**
   * Simulates the creation of a Telebirr request
   */
  async createPaymentUrl(bookingId: string, amount: number): Promise<string> {
    // If TELEBIRR_API_URL is configured, call the provider API.
    if (this.apiBase) {
      const outTradeNo = `TB-${bookingId}-${Date.now().toString().slice(-6)}`;
      const payload = {
        appId: this.appId,
        merchCode: this.merchCode,
        outTradeNo,
        totalAmount: amount,
        subject: `Booking ${bookingId}`,
        bookingId,
        notifyUrl: process.env.TELEBIRR_NOTIFY_URL || `${process.env.BASE_URL || ''}/api/payments/webhooks/telebirr`,
        returnUrl: process.env.TELEBIRR_RETURN_URL || `${process.env.BASE_URL || ''}/checkout/return`,
      };

      const body = JSON.stringify(payload);

      // signature: support HMAC-SHA256 (preferred) or RSA signing if private key provided
      let signatureHeader = '';
      try {
        if (this.rsaPrivateKey) {
          const sign = crypto.createSign('RSA-SHA256');
          sign.update(body, 'utf8');
          signatureHeader = sign.sign(this.rsaPrivateKey, 'base64');
        } else if (this.apiSecret) {
          const h = crypto.createHmac('sha256', this.apiSecret);
          h.update(body, 'utf8');
          signatureHeader = `sha256=${h.digest('hex')}`;
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('Telebirr signing failed', msg);
      }

      try {
        const resp = await fetch(this.apiBase, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
            ...(signatureHeader ? { 'X-Signature': signatureHeader } : {}),
          },
          body,
        });

        const json = await resp.json().catch(() => ({}));
        // Provider responses vary. Try common fields.
        const paymentUrl = json.paymentUrl || json.redirectUrl || json.data?.paymentUrl;
        const returnedOutTradeNo = json.outTradeNo || json.data?.outTradeNo || outTradeNo;
        if (paymentUrl) return paymentUrl;
        // Fallback to local checkout gateway with returnedOutTradeNo
        const qp = new URLSearchParams({ bookingId, amount: amount.toString(), outTradeNo: returnedOutTradeNo, provider: 'telebirr' });
        return `/checkout/payment-gateway?${qp.toString()}`;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('Telebirr API call failed', msg);
        const fallback = new URLSearchParams({ bookingId, amount: amount.toString(), outTradeNo: `TB-${bookingId}-${Date.now()}` , provider: 'telebirr' });
        return `/checkout/payment-gateway?${fallback.toString()}`;
      }
    }

    // No provider configured; return a mock URL
    const outTradeNo = `TB-${bookingId}-${Date.now().toString().slice(-6)}`;
    const queryParams = new URLSearchParams({ bookingId, amount: amount.toString(), outTradeNo, provider: 'telebirr' });
    return `/checkout/payment-gateway?${queryParams.toString()}`;
  }

  /**
   * Simulates verification of Telebirr callback notification
   */
  verifyCallback(decryptedText: string): boolean {
    try {
      const data = JSON.parse(decryptedText);
      // Accept a range of success indicators used in sandbox or production
      return data.code === '200' || data.status === 'SUCCESS' || data.result === 'OK';
    } catch {
      return false;
    }
  }
}

export class CbeBirrService {
  private merchantId = process.env.CBE_BIRR_MERCHANT_ID || 'MOCK_CBE_ID';
  private apiBase = process.env.CBE_API_URL || '';
  private apiKey = process.env.CBE_API_KEY || '';
  private apiSecret = process.env.CBE_API_SECRET || '';

  async createPaymentUrl(bookingId: string, amount: number): Promise<string> {
    if (this.apiBase) {
      const outTradeNo = `CBE-${bookingId}-${Date.now().toString().slice(-6)}`;
      const payload = { merchantId: this.merchantId, outTradeNo, amount, bookingId, notifyUrl: process.env.CBE_NOTIFY_URL || `${process.env.BASE_URL || ''}/api/payments/webhooks/cbe`, returnUrl: process.env.CBE_RETURN_URL || `${process.env.BASE_URL || ''}/checkout/return` };
      const body = JSON.stringify(payload);
      let signatureHeader = '';
      try {
        if (this.apiSecret) {
          const h = crypto.createHmac('sha256', this.apiSecret);
          h.update(body, 'utf8');
          signatureHeader = `sha256=${h.digest('hex')}`;
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('CBE signing failed', msg);
      }

      try {
        const resp = await fetch(this.apiBase, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
            ...(signatureHeader ? { 'X-Signature': signatureHeader } : {}),
          },
          body,
        });
        const json = await resp.json().catch(() => ({}));
        const paymentUrl = json.paymentUrl || json.redirectUrl || json.data?.paymentUrl;
        const returnedOutTradeNo = json.outTradeNo || json.data?.outTradeNo || outTradeNo;
        if (paymentUrl) return paymentUrl;
        const qp = new URLSearchParams({ bookingId, amount: amount.toString(), outTradeNo: returnedOutTradeNo, provider: 'cbe_birr' });
        return `/checkout/payment-gateway?${qp.toString()}`;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('CBE API call failed', msg);
        const fallback = new URLSearchParams({ bookingId, amount: amount.toString(), outTradeNo: `CBE-${bookingId}-${Date.now()}` , provider: 'cbe_birr' });
        return `/checkout/payment-gateway?${fallback.toString()}`;
      }
    }

    const outTradeNo = `CBE-${bookingId}-${Date.now().toString().slice(-6)}`;
    const queryParams = new URLSearchParams({ bookingId, amount: amount.toString(), outTradeNo, provider: 'cbe_birr' });
    return `/checkout/payment-gateway?${queryParams.toString()}`;
  }
}

export function verifyWebhookSignature(secret: string | undefined, rawBody: string, signature?: string | null) {
  if (!secret) return false;
  if (!signature) return false;

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody, 'utf8');
    const expected = hmac.digest('hex');

    const sig = signature.startsWith('sha256=') ? signature.split('=')[1] : signature;

    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(sig, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Signature verification error', msg);
    return false;
  }
}

export const telebirr = new TelebirrService();
export const cbeBirr = new CbeBirrService();
