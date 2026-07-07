import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, hashPassword } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ['SALON_OWNER', 'ADMIN', 'SUPER_ADMIN']);
    // Find salons owned by this user
    const ownedSalons = await prisma.salon.findMany({ where: { ownerId: user.id }, select: { id: true } });
    const salonIds = ownedSalons.map((s) => s.id);

    const employees = await prisma.employee.findMany({ where: { salonId: { in: salonIds } }, include: { user: { select: { email: true, name: true, phone: true } } } });
    return NextResponse.json(employees);
  } catch (res) {
    return res instanceof NextResponse ? res : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, ['SALON_OWNER', 'ADMIN', 'SUPER_ADMIN']);
    const body = await request.json();
    const { salonId, name, phone, avatarUrl } = body;

    if (!salonId || !name) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    // Only allow owner of salon to create employees
    const salon = await prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon || salon.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Create user account for employee with email derived from salon slug
    const localPart = `${salon.slug}.${name.split(' ')[0].toLowerCase()}`;
    const email = `${localPart}@beuty.local`;
    const rawPassword = `${salon.slug}_${name.split(' ')[0].toLowerCase()}#${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const userRec = await prisma.user.create({ data: { email, passwordHash, name, phone, role: 'EMPLOYEE', profile: { create: { referralCode: `${name.split(' ')[0].toUpperCase()}${Math.floor(100 + Math.random() * 900)}`, walletBalance: 0.0 } } } });

    const employee = await prisma.employee.create({ data: { userId: userRec.id, salonId, name, avatarUrl } });

    await prisma.auditLog.create({ data: { userId: user.id, action: 'EMPLOYEE_CREATE', details: `Created employee ${employee.id} for salon ${salonId}` } });

    return NextResponse.json({ employee, credentials: { email: userRec.email, password: rawPassword } }, { status: 201 });
  } catch (res) {
    return res instanceof NextResponse ? res : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
