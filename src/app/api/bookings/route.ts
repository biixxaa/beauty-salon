// src/app/api/bookings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { BookingStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || user.role;

    let bookings: unknown[] = [];

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      bookings = await prisma.booking.findMany({
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          salon: { select: { name: true, slug: true } },
          service: { select: { name: true, duration: true } },
          employee: { select: { name: true } },
        },
        orderBy: { startTime: 'desc' },
      });
    } else if (role === 'SALON_OWNER') {
      // Find salon owned by this user
      const ownedSalons = await prisma.salon.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      });
      const salonIds = ownedSalons.map((s: { id: string }) => s.id);

      bookings = await prisma.booking.findMany({
        where: { salonId: { in: salonIds } },
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          service: { select: { name: true, duration: true } },
          employee: { select: { name: true } },
        },
        orderBy: { startTime: 'desc' },
      });
    } else if (role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
      });

      if (!employee) {
        return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
      }

      bookings = await prisma.booking.findMany({
        where: { employeeId: employee.id },
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          service: { select: { name: true, duration: true } },
        },
        orderBy: { startTime: 'desc' },
      });
    } else {
      // Customer
      bookings = await prisma.booking.findMany({
        where: { customerId: user.id },
        include: {
          salon: { select: { name: true, slug: true, bannerUrl: true, address: true } },
          service: { select: { name: true, duration: true } },
          employee: { select: { name: true } },
          review: true,
        },
        orderBy: { startTime: 'desc' },
      });
    }

    return NextResponse.json(bookings);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Fetch Bookings API Error:', msg);
    return NextResponse.json({ error: msg || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { salonId, serviceId, employeeId, startTimeStr, paymentMethod, couponCode, notes } = body;

    if (!salonId || !serviceId || !employeeId || !startTimeStr) {
      return NextResponse.json({ error: 'Missing required booking parameters' }, { status: 400 });
    }

    const startTime = new Date(startTimeStr);
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const duration = service.duration;
    const bufferTime = service.bufferTime;
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    // 1. Double Booking Check
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        employeeId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.RESCHEDULED] },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      },
    });

    if (overlappingBooking) {
      return NextResponse.json({ error: 'This time slot is already booked for the selected professional' }, { status: 409 });
    }

    // 2. Working Hours Check
    const bookingDay = startTime.getDay(); // 0 is Sunday
    const workingHours = await prisma.workingHours.findUnique({
      where: { salonId_dayOfWeek: { salonId, dayOfWeek: bookingDay } },
    });

    if (!workingHours || workingHours.isClosed) {
      return NextResponse.json({ error: 'The salon is closed on this day' }, { status: 400 });
    }

    // Convert start/end times to HH:MM format for simple comparisons
    const formatTime = (date: Date) => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const bookingStartTimeStr = formatTime(startTime);
    const bookingEndTimeStr = formatTime(endTime);

    if (bookingStartTimeStr < workingHours.openTime || bookingEndTimeStr > workingHours.closeTime) {
      return NextResponse.json({
        error: `Booking time must be within salon hours (${workingHours.openTime} - ${workingHours.closeTime})`,
      }, { status: 400 });
    }

    // 3. Employee Breaks Check
    const overlappingBreaks = await prisma.employeeSchedule.findFirst({
      where: {
        employeeId,
        dayOfWeek: bookingDay,
        isBreak: true,
        OR: [
          {
            startTime: { lt: bookingEndTimeStr },
            endTime: { gt: bookingStartTimeStr },
          },
        ],
      },
    });

    if (overlappingBreaks) {
      return NextResponse.json({ error: 'The professional is on a break during this slot' }, { status: 400 });
    }

    // 4. Coupon Code Application (validate in JS since Prisma can't compare fields to fields)
    let discount = 0.0;
    let appliedCouponId: string | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          salonId,
          code: couponCode,
          isActive: true,
          expiryDate: { gte: new Date() },
        },
      });

      if (!coupon) {
        return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
      }

      // Ensure usage limit not exceeded
      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 });
      }

      appliedCouponId = coupon.id;
      const discountPercentage = coupon.discountPercent;
      const calculatedDiscount = (Number(service.price) * discountPercentage) / 100;
      discount = Math.min(calculatedDiscount, Number(coupon.maxDiscount));
    }

    const finalPrice = Math.max(0, Number(service.price) - discount);

    // 5. Booking Creation & Transaction Logic (use advisory lock per-employee to avoid race conditions)
    const booking = await prisma.$transaction(async (tx: any) => {
      // Acquire a PostgreSQL advisory lock scoped to the employeeId for this transaction
      // This prevents concurrent transactions from creating overlapping bookings for the same employee
      try {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${employeeId}::text))`;
      } catch (e) {
        // If advisory lock cannot be acquired or hashtext isn't available, continue — transaction will still proceed
        console.warn('Advisory lock acquire warning:', e);
      }

      // Re-check overlapping bookings inside the lock/transaction
      const overlappingBookingTx = await tx.booking.findFirst({
        where: {
          employeeId,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.RESCHEDULED] },
          OR: [
            {
              startTime: { lt: endTime },
              endTime: { gt: startTime },
            },
          ],
        },
      });

      if (overlappingBookingTx) {
        throw new Error('This time slot is already booked for the selected professional');
      }

      // Increment coupon usage count if used
      if (appliedCouponId) {
        await tx.coupon.update({
          where: { id: appliedCouponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      // Check user wallet if CBE or Telebirr was directly selected to deduct from wallet balance
      let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
      if (paymentMethod === PaymentMethod.TELEBIRR || paymentMethod === PaymentMethod.CBE_BIRR) {
        const profile = await tx.profile.findUnique({ where: { userId: user.id } });

        if (profile && Number(profile.walletBalance) >= finalPrice) {
          // Deduct from wallet directly
          await tx.profile.update({ where: { id: profile.id }, data: { walletBalance: { decrement: finalPrice } } });

          // Record wallet transaction
          await tx.walletTransaction.create({
            data: {
              profileId: profile.id,
              type: 'BOOKING_SPEND',
              amount: finalPrice,
              description: `Paid for booking at salon`,
            },
          });

          paymentStatus = PaymentStatus.PAID;
        }
      }

      // Create the booking
      const newBooking = await tx.booking.create({
        data: {
          customerId: user.id,
          salonId,
          serviceId,
          employeeId,
          startTime,
          endTime,
          status: BookingStatus.PENDING,
          paymentStatus,
          paymentMethod: paymentMethod || PaymentMethod.CASH,
          totalPrice: service.price,
          discountApplied: discount,
          finalPrice: finalPrice,
          couponCode: couponCode || null,
          notes,
        },
      });

      // Add Loyalty Points (10% of final price)
      const pointsEarned = Math.floor(finalPrice / 10);
      if (pointsEarned > 0) {
        await tx.profile.update({ where: { userId: user.id }, data: { points: { increment: pointsEarned } } });
      }

      // Send simulated notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Appointment Booked!',
          message: `Your appointment for ${service.name} has been booked. Wait for salon approval.`,
          type: 'BOOKING_REMINDER',
        },
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'BOOKING_CREATE',
          details: `User booked service ${service.name} at salon. Final Price: ${finalPrice} ETB.`,
        },
      });

      return newBooking;
    });

    return NextResponse.json({ message: 'Booking created successfully', booking }, { status: 201 });
  } catch (error: any) {
    console.error('Create Booking API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
