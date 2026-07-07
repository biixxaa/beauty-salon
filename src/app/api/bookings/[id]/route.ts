// src/app/api/bookings/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, startTimeStr, paymentStatus } = body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Role-based authorization check
    // Customers can cancel or reschedule. Owners/Employees can update status.
    const isOwnerOfBooking = booking.customerId === user.id;

    const ownedSalons = await prisma.salon.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });
    const ownedSalonIds = ownedSalons.map((s) => s.id);
    const isSalonOwner = ownedSalonIds.includes(booking.salonId);

    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
    });
    const isAssignedEmployee = employee && booking.employeeId === employee.id;

    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    const canModify = isOwnerOfBooking || isSalonOwner || isAssignedEmployee || isAdmin;

    if (!canModify) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rescheduling logic
    if (startTimeStr) {
      if (!isOwnerOfBooking && !isSalonOwner && !isAdmin) {
        return NextResponse.json({ error: 'Only client, salon owner or admin can reschedule' }, { status: 403 });
      }

      const newStartTime = new Date(startTimeStr);
      const newEndTime = new Date(newStartTime.getTime() + booking.service.duration * 60 * 1000);

      // Check double booking again, excluding current booking
      const overlappingBooking = await prisma.booking.findFirst({
        where: {
          id: { not: id },
          employeeId: booking.employeeId,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.RESCHEDULED] },
          OR: [
            {
              startTime: { lt: newEndTime },
              endTime: { gt: newStartTime },
            },
          ],
        },
      });

      if (overlappingBooking) {
        return NextResponse.json({ error: 'This time slot is already booked for the selected professional' }, { status: 409 });
      }

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
          status: BookingStatus.RESCHEDULED,
        },
      });

      // Notify customer
      await prisma.notification.create({
        data: {
          userId: booking.customerId,
          title: 'Appointment Rescheduled',
          message: `Your appointment has been rescheduled to ${newStartTime.toLocaleString()}.`,
          type: 'BOOKING_REMINDER',
        },
      });

      return NextResponse.json(updated);
    }

    // Status modification logic
    if (status) {
      const targetStatus = status as BookingStatus;

      // Customers can only cancel
      if (isOwnerOfBooking && targetStatus !== BookingStatus.CANCELLED) {
        return NextResponse.json({ error: 'Clients can only request cancellation' }, { status: 403 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        // If cancellation is requested and it was prepaid, refund wallet!
        let finalPaymentStatus = booking.paymentStatus;
        if (targetStatus === BookingStatus.CANCELLED && booking.paymentStatus === PaymentStatus.PAID) {
          const profile = await tx.profile.findUnique({
            where: { userId: booking.customerId },
          });

          if (profile) {
            await tx.profile.update({
              where: { id: profile.id },
              data: {
                walletBalance: { increment: booking.finalPrice },
              },
            });

            await tx.walletTransaction.create({
              data: {
                profileId: profile.id,
                type: 'REFUNDED' as any, // CASHBACK/TOP_UP or refund
                amount: booking.finalPrice,
                description: `Refund for cancelled booking #${booking.id}`,
              },
            });

            finalPaymentStatus = PaymentStatus.REFUNDED;
          }
        }

        const res = await tx.booking.update({
          where: { id },
          data: {
            status: targetStatus,
            paymentStatus: paymentStatus || finalPaymentStatus,
          },
        });

        // Notify client about status updates
        await tx.notification.create({
          data: {
            userId: booking.customerId,
            title: `Appointment ${targetStatus.toLowerCase()}`,
            message: `Your appointment at the salon is now ${targetStatus.toLowerCase()}.`,
            type: 'SYSTEM',
          },
        });

        return res;
      });

      return NextResponse.json(updated);
    }

    // Direct payment status updates
    if (paymentStatus) {
      if (!isSalonOwner && !isAdmin) {
        return NextResponse.json({ error: 'Only salon owners or admins can update payment status' }, { status: 403 });
      }

      const updated = await prisma.booking.update({
        where: { id },
        data: { paymentStatus: paymentStatus as PaymentStatus },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  } catch (error: any) {
    console.error('Update Booking API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
