import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getMe } from '../src/app/api/auth/me/route';
import { GET as getBookings, POST as createBooking } from '../src/app/api/bookings/route';
import { GET as getBookingById, PATCH as updateBooking } from '../src/app/api/bookings/[id]/route';
import { serverDb } from '../src/lib/serverDb';
import { signToken } from '../src/lib/auth';

describe('Customer Dashboard Backend Endpoints', () => {
  const customerId = 'usr-customer-1';
  const customerEmail = 'abebe@example.com';

  beforeEach(() => {
    // Reset customer initial wallet balance
    serverDb.updateUser(customerId, {
      walletBalance: 450,
      loyaltyPoints: 120,
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the profile details for the default customer', async () => {
      const req = new Request('http://localhost:3000/api/auth/me');
      const res = await getMe(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.role).toBe('CUSTOMER');
      expect(data.user.profile).toBeDefined();
      expect(data.user.profile.walletBalance).toBeGreaterThanOrEqual(0);
      expect(data.user.profile.points).toBeGreaterThanOrEqual(0);
      expect(data.user.profile.referralCode).toBeDefined();
    });

    it('returns specific authenticated user when valid JWT token header is provided', async () => {
      const token = signToken({
        id: customerId,
        email: customerEmail,
        name: 'Abebe Kebede',
        role: 'CUSTOMER',
      });

      const req = new Request('http://localhost:3000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const res = await getMe(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.user.id).toBe(customerId);
      expect(data.user.email).toBe(customerEmail);
    });
  });

  describe('GET /api/bookings?role=CUSTOMER', () => {
    it('returns customer bookings with proper salon and service relations', async () => {
      const req = new NextRequest('http://localhost:3000/api/bookings?role=CUSTOMER');
      const res = await getBookings(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      const first = data[0];
      expect(first.salon).toBeDefined();
      expect(first.salon.name).toBeDefined();
      expect(first.service).toBeDefined();
      expect(first.service.name).toBeDefined();
      expect(first.startTime).toBeDefined();
      expect(first.status).toBeDefined();
    });
  });

  describe('GET /api/bookings/[id]', () => {
    it('retrieves an existing booking by its ID', async () => {
      const req = new Request('http://localhost:3000/api/bookings/bk-101');
      const res = await getBookingById(req, { params: Promise.resolve({ id: 'bk-101' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBe('bk-101');
      expect(data.salon).toBeDefined();
    });

    it('returns 404 for a non-existent booking', async () => {
      const req = new Request('http://localhost:3000/api/bookings/non-existent-id');
      const res = await getBookingById(req, { params: Promise.resolve({ id: 'non-existent-id' }) });
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/bookings/[id]', () => {
    it('reschedules an appointment with a new time slot', async () => {
      const newTime = new Date(Date.now() + 86400000 * 5).toISOString();
      const req = new Request('http://localhost:3000/api/bookings/bk-101', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTimeStr: newTime }),
      });

      const res = await updateBooking(req, { params: Promise.resolve({ id: 'bk-101' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.booking.startTime).toBe(newTime);
      expect(data.booking.status).toBe('RESCHEDULED');
    });

    it('cancels an appointment and automatically refunds prepaid amount to customer wallet', async () => {
      const userBefore = serverDb.getUserById(customerId);
      const initialWallet = userBefore?.walletBalance || 450;

      // Ensure booking bk-101 is PAID with price 950
      serverDb.updateBooking('bk-101', {
        paymentStatus: 'PAID',
        totalPrice: 950,
      });

      const req = new Request('http://localhost:3000/api/bookings/bk-101', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      const res = await updateBooking(req, { params: Promise.resolve({ id: 'bk-101' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.booking.status).toBe('CANCELLED');
      expect(data.booking.paymentStatus).toBe('REFUNDED');

      // Verify wallet balance was refunded
      const userAfter = serverDb.getUserById(customerId);
      expect(userAfter?.walletBalance).toBe(initialWallet + 950);
    });

    it('returns 404 when attempting to update a non-existent booking', async () => {
      const req = new Request('http://localhost:3000/api/bookings/non-existent-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      const res = await updateBooking(req, { params: Promise.resolve({ id: 'non-existent-id' }) });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/bookings', () => {
    it('creates a new booking successfully', async () => {
      const newBookingPayload = {
        salonId: 'salon-1',
        serviceId: 'srv-1',
        paymentMethod: 'TELEBIRR',
        totalPrice: 950,
        notes: 'Testing new booking creation',
      };

      const req = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBookingPayload),
      });

      const res = await createBooking(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.booking).toBeDefined();
      expect(data.booking.notes).toBe('Testing new booking creation');
      expect(data.booking.status).toBe('CONFIRMED');
      expect(data.booking.paymentStatus).toBe('PAID');
    });
  });
});
