// src/app/api/dashboard/salons/route.ts
import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const salons = serverDb.getAllSalons();
    return NextResponse.json(salons);
  } catch (error) {
    console.error('Error fetching dashboard salons:', error);
    return NextResponse.json({ error: 'Failed to fetch salons' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { salonId, ...updates } = body;

    if (!salonId) {
      return NextResponse.json({ error: 'Salon ID is required' }, { status: 400 });
    }

    const updated = serverDb.updateSalon(salonId, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Salon updated successfully', salon: updated });
  } catch (error) {
    console.error('Error updating salon:', error);
    return NextResponse.json({ error: 'Failed to update salon' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { salonId } = body;

    if (!salonId) {
      return NextResponse.json({ error: 'Salon ID is required' }, { status: 400 });
    }

    const deleted = serverDb.deleteSalon(salonId);
    if (!deleted) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Salon deleted successfully' });
  } catch (error) {
    console.error('Error deleting salon:', error);
    return NextResponse.json({ error: 'Failed to delete salon' }, { status: 500 });
  }
}

