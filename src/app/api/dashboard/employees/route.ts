// src/app/api/dashboard/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/serverDb';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const salonId = request.nextUrl.searchParams.get('salonId');
    const salons = serverDb.getAllSalons();

    if (salonId) {
      const salon = serverDb.getSalonByIdOrSlug(salonId);
      if (!salon) return NextResponse.json([]);
      const employees = (salon.employees || []).map((e) => ({
        id: e.id,
        name: e.user.name,
        email: e.user.email,
        rating: 4.8,
        isAvailable: true,
        salonId: salon.id,
      }));
      return NextResponse.json(employees);
    }

    const allEmployees = salons.flatMap((s) =>
      (s.employees || []).map((e) => ({
        id: e.id,
        name: e.user.name,
        email: e.user.email,
        rating: 4.8,
        isAvailable: true,
        salonId: s.id,
        salonName: s.name,
      }))
    );

    return NextResponse.json(allEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { salonId, name, email, phone } = body;

    if (!salonId || !name || !email) {
      return NextResponse.json({ error: 'Salon ID, name, and email are required' }, { status: 400 });
    }

    const salon = serverDb.getSalonByIdOrSlug(salonId);
    if (!salon) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    const tempPassword = `Pass@${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = await hashPassword(tempPassword);

    serverDb.createUser({
      name,
      email,
      phone,
      role: 'EMPLOYEE',
      passwordHash,
    });

    const newEmpId = `emp-${Date.now()}`;
    const newEmployee = {
      id: newEmpId,
      title: 'Stylist & Beauty Specialist',
      user: {
        name,
        email,
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
      },
    };

    salon.employees = [...(salon.employees || []), newEmployee];
    serverDb.updateSalon(salon.id, { employees: salon.employees });

    return NextResponse.json({
      message: 'Staff added successfully',
      employee: newEmployee,
      credentials: {
        email,
        password: tempPassword,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding employee:', error);
    return NextResponse.json({ error: 'Failed to add employee' }, { status: 500 });
  }
}
