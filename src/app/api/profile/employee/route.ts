// src/app/api/profile/employee/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';

// GET - Staff member's profile
export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ['EMPLOYEE']);

    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        salon: {
          select: {
            id: true,
            name: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (res) {
    return res instanceof NextResponse ? res : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// PUT - Update staff member's profile (bio, resume, avatar)
export async function PUT(request: Request) {
  try {
    const user = await requireRole(request, ['EMPLOYEE']);
    const body = await request.json();
    const { bio, resumeUrl, avatarUrl } = body;

    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(resumeUrl !== undefined && { resumeUrl }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        salon: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (res) {
    return res instanceof NextResponse ? res : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
