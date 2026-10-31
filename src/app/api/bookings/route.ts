// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { serverDb } from '@/lib/serverDb';
import { MockBooking } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role')?.toUpperCase();
    const tokenUser = await getUserFromRequest(request);
    const currentUser = tokenUser || serverDb.getUserById('usr-customer-1');

    const allBookings = serverDb.getAllBookings();

    if (role === 'CUSTOMER') {
      const customerId = currentUser?.id || 'usr-customer-1';
      const customerEmail = currentUser?.email || 'abebe@example.com';
      const filtered = allBookings.filter(
        (b) =>
          b.customerId === customerId ||
          b.customer?.id === customerId ||
          b.customer?.email?.toLowerCase() === customerEmail.toLowerCase()
      );
      return NextResponse.json(filtered);
    }

    if (role === 'EMPLOYEE') {
      const email = currentUser?.email || 'dawit@bolegrooming.et';
      const filtered = allBookings.filter(
        (b) => b.employee?.user?.email?.toLowerCase() === email.toLowerCase()
      );
      return NextResponse.json(filtered);
    }

    if (role === 'SALON_OWNER') {
      return NextResponse.json(allBookings);
    }

    return NextResponse.json(allBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { salonId, serviceId, employeeId, startTimeStr, startTime, paymentMethod, notes, totalPrice } = body;

    const salon = serverDb.getSalonByIdOrSlug(salonId || 'salon-1');
    const service = salon?.services.find((s) => s.id === serviceId) || salon?.services[0];
    const employee = salon?.employees.find((e) => e.id === employeeId);

    const tokenUser = await getUserFromRequest(request);
    const customer = tokenUser
      ? serverDb.getUserById(tokenUser.id) || { id: tokenUser.id, name: tokenUser.name, email: tokenUser.email, phone: '+251 900 000000' }
      : serverDb.getUserById('usr-customer-1') || {
          id: 'usr-customer-1',
          name: 'Abebe Kebede',
          email: 'abebe@example.com',
          phone: '+251 911 123456',
        };

    const bookingStartTime = startTimeStr || startTime || new Date(Date.now() + 86400000).toISOString();
    const price = totalPrice || service?.price || 500;
    const isCash = paymentMethod === 'CASH';

    const newBooking: MockBooking = {
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

    serverDb.createBooking(newBooking);

    return NextResponse.json(
      { message: 'Appointment booked successfully', booking: newBooking },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

