// src/app/api/bookings/[id]/route.ts
import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = serverDb.getBookingById(id);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking by id:', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingBooking = serverDb.getBookingById(id);

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = { ...body };

    // Handle rescheduling
    if (body.startTimeStr) {
      updates.startTime = body.startTimeStr;
      if (existingBooking.status === 'CONFIRMED' || existingBooking.status === 'PENDING') {
        updates.status = 'RESCHEDULED';
      }
    }

    // Handle cancellation and refund
    if (body.status === 'CANCELLED') {
      updates.status = 'CANCELLED';
      if (existingBooking.paymentStatus === 'PAID') {
        updates.paymentStatus = 'REFUNDED';
        // Refund prepaid fees to customer's wallet balance
        const customerId = existingBooking.customerId || existingBooking.customer?.id;
        if (customerId) {
          const user = serverDb.getUserById(customerId);
          if (user) {
            const currentWallet = user.walletBalance ?? user.profile?.walletBalance ?? 0;
            const refundAmount = existingBooking.totalPrice || 0;
            serverDb.updateUser(user.id, {
              walletBalance: currentWallet + refundAmount,
            });
          }
        }
      }
    }

    const updatedBooking = serverDb.updateBooking(id, updates);

    return NextResponse.json({
      message: 'Booking updated successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = serverDb.deleteBooking(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
