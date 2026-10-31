// backend/src/routes/bookings.routes.ts
import { Router, Response } from 'express';
import { db } from '../data/db.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { Booking } from '../types/index.js';

const router = Router();

// GET /api/bookings
router.get('/', (req: AuthRequest, res: Response) => {
  const role = (req.query.role as string)?.toUpperCase();
  const currentUser = req.user || db.users.get('usr-customer-1');
  const allBookings = Array.from(db.bookings.values()).sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  if (role === 'CUSTOMER') {
    const customerId = currentUser?.id || 'usr-customer-1';
    const customerEmail = currentUser?.email || 'abebe@example.com';
    const filtered = allBookings.filter(
      (b) =>
        b.customerId === customerId ||
        b.customer?.id === customerId ||
        b.customer?.email?.toLowerCase() === customerEmail.toLowerCase()
    );
    res.json(filtered);
    return;
  }

  if (role === 'EMPLOYEE') {
    const email = currentUser?.email || 'dawit@bolegrooming.et';
    const filtered = allBookings.filter(
      (b) => b.employee?.user?.email?.toLowerCase() === email.toLowerCase()
    );
    res.json(filtered);
    return;
  }

  if (role === 'SALON_OWNER') {
    res.json(allBookings);
    return;
  }

  res.json(allBookings);
});

// POST /api/bookings
router.post('/', (req: AuthRequest, res: Response) => {
  const { salonId, serviceId, employeeId, startTimeStr, startTime, paymentMethod, notes, totalPrice } = req.body || {};

  const salon = db.salons.get(salonId) || Array.from(db.salons.values())[0];
  const service = salon?.services.find((s) => s.id === serviceId) || salon?.services[0];
  const employee = salon?.employees.find((e) => e.id === employeeId);

  const currentUser = req.user || db.users.get('usr-customer-1');
  const customer = currentUser || {
    id: 'usr-customer-1',
    name: 'Abebe Kebede',
    email: 'abebe@example.com',
    phone: '+251 911 123456',
  };

  const bookingStartTime = startTimeStr || startTime || new Date(Date.now() + 86400000).toISOString();
  const price = totalPrice || service?.price || 500;
  const isCash = paymentMethod === 'CASH';

  const newBooking: Booking = {
    id: `bk-${Date.now()}`,
    salonId: salon?.id || salonId || 'salon-1',
    serviceId: service?.id || serviceId || 'srv-1',
    employeeId,
    customerId: customer.id,
    startTime: bookingStartTime,
    status: isCash ? 'PENDING' : 'CONFIRMED',
    paymentMethod: paymentMethod || 'CASH',
    paymentStatus: isCash ? 'UNPAID' : 'PAID',
    totalPrice: price,
    notes,
    salon: {
      id: salon?.id || 'salon-1',
      name: salon?.name || 'Luxury Salon',
      address: salon?.address || 'Addis Ababa',
      slug: salon?.slug || 'saba-luxury-salon',
      bannerUrl: salon?.bannerUrl,
    },
    service: {
      id: service?.id || 'srv-1',
      name: service?.name || 'Beauty Treatment',
      duration: service?.duration || 60,
      price,
    },
    employee: employee
      ? {
          id: employee.id,
          user: {
            name: employee.user.name,
            email: employee.user.email,
          },
        }
      : undefined,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
  };

  db.bookings.set(newBooking.id, newBooking);

  res.status(201).json({
    message: 'Appointment booked successfully',
    booking: newBooking,
  });
});

// GET /api/bookings/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const booking = db.bookings.get(id);
  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }
  res.json(booking);
});

// PATCH /api/bookings/:id
router.patch('/:id', (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const existing = db.bookings.get(id);
  if (!existing) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }

  const updates = req.body || {};
  const updated: Booking = { ...existing, ...updates };

  // Rescheduling handler
  if (updates.startTimeStr) {
    updated.startTime = updates.startTimeStr;
    if (existing.status === 'CONFIRMED' || existing.status === 'PENDING') {
      updated.status = 'RESCHEDULED';
    }
  }

  // Cancellation and automatic refund handler
  if (updates.status === 'CANCELLED') {
    updated.status = 'CANCELLED';
    if (existing.paymentStatus === 'PAID') {
      updated.paymentStatus = 'REFUNDED';
      // Refund money to user's wallet
      const customerId = existing.customerId || existing.customer?.id;
      if (customerId) {
        const user = db.users.get(customerId);
        if (user) {
          const refundAmount = existing.totalPrice || 0;
          user.walletBalance = (user.walletBalance || 0) + refundAmount;
          if (user.profile) {
            user.profile.walletBalance = user.walletBalance;
          }
        }
      }
    }
  }

  db.bookings.set(id, updated);

  res.json({
    message: 'Booking updated successfully',
    booking: updated,
  });
});

// DELETE /api/bookings/:id
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  if (!db.bookings.has(id)) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }
  db.bookings.delete(id);
  res.json({ message: 'Booking deleted successfully' });
});

export default router;

