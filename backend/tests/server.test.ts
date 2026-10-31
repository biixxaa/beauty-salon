import { describe, it, expect } from 'vitest';
import app from '../src/server.js';

describe('Standalone Express Backend Tests', () => {
  it('responds with healthy status on /health', async () => {
    // In Node 18+, fetch is available globally. We can test via lightweight HTTP server or app handler.
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/health`);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('beauty-backend');
    } finally {
      server.close();
    }
  });

  it('retrieves customer profile on GET /api/auth/me', async () => {
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/auth/me`);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.role).toBe('CUSTOMER');
      expect(data.user.profile.walletBalance).toBeGreaterThanOrEqual(0);
    } finally {
      server.close();
    }
  });

  it('retrieves customer bookings on GET /api/bookings?role=CUSTOMER', async () => {
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/bookings?role=CUSTOMER`);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].salon).toBeDefined();
    } finally {
      server.close();
    }
  });

  it('updates booking appointment time on PATCH /api/bookings/:id', async () => {
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const newTime = new Date(Date.now() + 86400000 * 3).toISOString();
      const res = await fetch(`http://localhost:${port}/api/bookings/bk-101`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTimeStr: newTime }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.booking.startTime).toBe(newTime);
      expect(data.booking.status).toBe('RESCHEDULED');
    } finally {
      server.close();
    }
  });

  it('retrieves salons on GET /api/salons', async () => {
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/salons`);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    } finally {
      server.close();
    }
  });
});

