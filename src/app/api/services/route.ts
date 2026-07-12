import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const salonId = url.searchParams.get('salonId');
    const q = url.searchParams.get('q') || undefined;

    const where: any = {};
    if (salonId) where.salonId = salonId;
    if (q) where.name = { contains: q, mode: 'insensitive' };

    const services = await prisma.service.findMany({ where, orderBy: { price: 'asc' } });
    return NextResponse.json(services);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Services GET error:', msg);
    return NextResponse.json({ error: msg || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { salonId, name, description, price, duration, bufferTime, category, imageUrl } = body;

    if (!salonId || !name || !price || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: { salonId, name, description, price: Number(price), duration: Number(duration), bufferTime: Number(bufferTime || 0), category, imageUrl },
    });

    await prisma.auditLog.create({ data: { userId: null, action: 'SERVICE_CREATE', details: `Created service ${service.id} for salon ${salonId}` } });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Services POST error:', msg);
    return NextResponse.json({ error: msg || 'Internal Server Error' }, { status: 500 });
  }
}
