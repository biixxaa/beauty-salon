import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@beauty.et';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Password123!';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';
  const adminPhone = process.env.ADMIN_PHONE || '+251911000000';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    const updatedUser = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        passwordHash,
        role: Role.SUPER_ADMIN,
        name: adminName,
        phone: adminPhone,
      },
    });

    console.log(`Admin user updated: ${updatedUser.email}`);
  } else {
    const createdUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: adminName,
        phone: adminPhone,
        role: Role.SUPER_ADMIN,
      },
    });

    console.log(`Admin user created: ${createdUser.email}`);
  }
}

main()
  .catch((error) => {
    console.error('Failed to create admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
