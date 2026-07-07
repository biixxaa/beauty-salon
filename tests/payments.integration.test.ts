import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { verifyWebhookSignature, telebirr, cbeBirr } from '../src/lib/payments/telebirr';

describe('Payment signing and provider client', () => {
  it('verifies HMAC-SHA256 webhook signature', () => {
    const secret = 'test-secret-123';
    const payload = { bookingId: 'B123', amount: 2500, outTradeNo: 'TB-B123-000001' };
    const raw = JSON.stringify(payload);

    const h = crypto.createHmac('sha256', secret);
    h.update(raw, 'utf8');
    const digest = h.digest('hex');
    const header = `sha256=${digest}`;

    const ok = verifyWebhookSignature(secret, raw, header);
    expect(ok).toBe(true);
  });

  describe('telebirr client', () => {
    const originalFetch = globalThis.fetch;
    beforeEach(() => {
      // mock fetch
      globalThis.fetch = vi.fn(async (url: any, opts: any) => {
        return {
          json: async () => ({ paymentUrl: 'https://pay.telebirr.example/checkout?tx=abc123', outTradeNo: 'TB-B123-abc123' }),
        } as any;
      }) as any;
    });
    afterEach(() => {
      globalThis.fetch = originalFetch;
      vi.restoreAllMocks();
    });

    it('returns provider paymentUrl when TELEBIRR_API_URL configured', async () => {
      // temporarily set apiBase on the instance
      (telebirr as any).apiBase = 'https://api.telebirr.example/pay';
      (telebirr as any).apiKey = 'testkey';
      (telebirr as any).apiSecret = 'apisecret';

      const url = await telebirr.createPaymentUrl('B123', 2500);
      expect(url).toContain('telebirr.example');
    });
  });

  describe('cbe client', () => {
    const originalFetch = globalThis.fetch;
    beforeEach(() => {
      globalThis.fetch = vi.fn(async (url: any, opts: any) => {
        return {
          json: async () => ({ paymentUrl: 'https://pay.cbe.example/checkout?tx=xyz', outTradeNo: 'CBE-B123-xyz' }),
        } as any;
      }) as any;
    });
    afterEach(() => {
      globalThis.fetch = originalFetch;
      vi.restoreAllMocks();
    });

    it('returns provider paymentUrl when CBE_API_URL configured', async () => {
      (cbeBirr as any).apiBase = 'https://api.cbe.example/pay';
      (cbeBirr as any).apiKey = 'testkey';
      (cbeBirr as any).apiSecret = 'cbe-secret';

      const url = await cbeBirr.createPaymentUrl('B123', 3000);
      expect(url).toContain('cbe.example');
    });
  });
});
