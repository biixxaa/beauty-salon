import { PrismaClient, Role, SalonCategory, ServiceCategory, BookingStatus, PaymentStatus, PaymentMethod, TransactionType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Ensure Postgres support for exclusion constraints and create a constraint
  // to prevent overlapping bookings for the same employee at the DB level.
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);

    await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_overlap_employee'
      ) THEN
        ALTER TABLE "Booking" ADD CONSTRAINT bookings_no_overlap_employee EXCLUDE USING GIST (
          "employeeId" WITH =,
          tstzrange("startTime", "endTime") WITH &&
        );
      END IF;
    END
    $$;
    `);
  } catch (e) {
    console.warn('Could not create exclusion constraint or extension (it may already exist or DB lacks privileges):', e);
  }

  console.log('Clearing database...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.employeeSchedule.deleteMany();
  await prisma.employeeService.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.service.deleteMany();
  await prisma.workingHours.deleteMany();
  await prisma.salonPortfolio.deleteMany();
  await prisma.salon.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding roles & users...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // 1. Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@beauty.et',
      passwordHash,
      name: 'Ephrem Hailu',
      phone: '+251911000001',
      role: Role.SUPER_ADMIN,
    },
  });

  // 2. Salon Owners
  const ownerSaba = await prisma.user.create({
    data: {
      email: 'saba@beauty.et',
      passwordHash,
      name: 'Saba Tesfaye',
      phone: '+251911000002',
      role: Role.SALON_OWNER,
    },
  });

  const ownerDawit = await prisma.user.create({
    data: {
      email: 'dawit@beauty.et',
      passwordHash,
      name: 'Dawit Girma',
      phone: '+251911000003',
      role: Role.SALON_OWNER,
    },
  });

  // 3. Customers
  const customer1 = await prisma.user.create({
    data: {
      email: 'berke@gmail.com',
      passwordHash,
      name: 'Berke Kebede',
      phone: '+251911000004',
      role: Role.CUSTOMER,
      profile: {
        create: {
          bio: 'Looking for the best nail and hair treatments in Addis.',
          hairType: 'curly',
          faceShape: 'oval',
          referralCode: 'BERKE251',
          points: 120,
          walletBalance: 750.00,
        },
      },
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'selam@gmail.com',
      passwordHash,
      name: 'Selamawit Tadesse',
      phone: '+251911000005',
      role: Role.CUSTOMER,
      profile: {
        create: {
          bio: 'Loves spa days and makeup treatments.',
          hairType: 'coily',
          faceShape: 'round',
          referralCode: 'SELAM2026',
          points: 50,
          walletBalance: 200.00,
        },
      },
    },
  });

  // 4. Employees Users - generate credentials related to salon slug for easy demo access
  function genStaffEmail(salonSlug: string, idx: number, name: string) {
    const local = `${salonSlug}.staff${idx}`.toLowerCase();
    return `${local}@beuty.local`;
  }

  function genStaffPassword(salonSlug: string, name: string, idx: number) {
    const short = name.split(' ')[0].toLowerCase();
    return `${salonSlug}_${short}_${idx}#2026`;
  }

  // We'll create placeholder users without assigning to employees yet; users for employees will be created after salons are created so we can tie emails to salon slug
  const empUser1 = { name: 'Helen Kebede', phone: '+251911222201' };
  const empUser2 = { name: 'Abrham Alemu', phone: '+251911222202' };
  const empUser3 = { name: 'Tigist Bekele', phone: '+251911222203' };

  console.log('Seeding Salons...');
  // Saba's Luxury Salon in Bole, Addis Ababa
  const salonSaba = await prisma.salon.create({
    data: {
      ownerId: ownerSaba.id,
      name: "Saba's Luxury Women's Salon",
      slug: 'saba-luxury-salon',
      description: 'The ultimate sanctuary for hair, skin care, and luxury nail services in Bole.',
      category: SalonCategory.WOMEN,
      address: 'Bole Road, Behind Edna Mall, Addis Ababa',
      latitude: 9.0012,
      longitude: 38.7845,
      phone: '+251911808080',
      email: 'info@sabasalon.com',
      bannerUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000',
      rating: 4.8,
      reviewCount: 2,
      isVerified: true,
      featured: true,
    },
  });

  // Dawit's Executive Barbershop in Kazanchis, Addis Ababa
  const salonDawit = await prisma.salon.create({
    data: {
      ownerId: ownerDawit.id,
      name: "Dawit's Executive Barbershop",
      slug: 'dawit-executive-barbershop',
      description: 'Premium grooming services for modern gentlemen in Kazanchis. Shaving, haircuts, and hot towel facial treatments.',
      category: SalonCategory.MEN,
      address: 'Kazanchis, Near Intercontinental Hotel, Addis Ababa',
      latitude: 9.0210,
      longitude: 38.7695,
      phone: '+251911909090',
      email: 'info@dawitbarber.com',
      bannerUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1000',
      rating: 4.7,
      reviewCount: 1,
      isVerified: true,
      featured: true,
    },
  });

  console.log('Seeding Working Hours...');
  const days = [0, 1, 2, 3, 4, 5, 6];
  for (const day of days) {
    await prisma.workingHours.create({
      data: {
        salonId: salonSaba.id,
        dayOfWeek: day,
        openTime: '08:00',
        closeTime: '21:00',
        isClosed: day === 0, // Closed on Sundays
      },
    });

    await prisma.workingHours.create({
      data: {
        salonId: salonDawit.id,
        dayOfWeek: day,
        openTime: '09:00',
        closeTime: '22:00',
        isClosed: false, // Open 7 days a week
      },
    });
  }

  console.log('Seeding Services...');
  // Saba Salon Services
  const sabaHaircut = await prisma.service.create({
    data: {
      salonId: salonSaba.id,
      name: 'Luxury Haircut & Blow Dry',
      description: 'Full hair consultation, wash, customized haircut, and professional blow dry styling.',
      price: 500.00,
      duration: 45,
      bufferTime: 10,
      category: ServiceCategory.HAIRCUT,
      imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=500',
    },
  });

  const sabaNails = await prisma.service.create({
    data: {
      salonId: salonSaba.id,
      name: 'Gel Manicure & Pedicure',
      description: 'Nail shaping, cuticle care, scrub, massage, and high-quality gel polish application.',
      price: 600.00,
      duration: 60,
      bufferTime: 15,
      category: ServiceCategory.NAILS,
      imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=500',
    },
  });

  const sabaFacial = await prisma.service.create({
    data: {
      salonId: salonSaba.id,
      name: 'Golden Radiance Facial',
      description: 'Deep cleansing, steaming, extractions, massage, and gold-infused hydration mask.',
      price: 1200.00,
      duration: 75,
      bufferTime: 15,
      category: ServiceCategory.FACIAL,
      imageUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=500',
    },
  });

  // Dawit Barbershop Services
  const dawitHaircut = await prisma.service.create({
    data: {
      salonId: salonDawit.id,
      name: 'Executive Gentleman Cut',
      description: 'Custom haircut, hair wash, scalp massage, styling, and signature neck shave.',
      price: 350.00,
      duration: 30,
      bufferTime: 5,
      category: ServiceCategory.HAIRCUT,
      imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=500',
    },
  });

  const dawitShave = await prisma.service.create({
    data: {
      salonId: salonDawit.id,
      name: 'Classic Hot Towel Shave',
      description: 'Traditional straight razor shave with pre-shave oil, hot towels, lather, and soothing aftershave balm.',
      price: 250.00,
      duration: 30,
      bufferTime: 5,
      category: ServiceCategory.SHAVE,
      imageUrl: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?q=80&w=500',
    },
  });

  console.log('Seeding Employees & Schedules...');
  // Create staff user accounts with credentials tied to salon slug
  const staffHelenPassword = genStaffPassword(salonSaba.slug, empUser1.name, 1);
  const staffTigistPassword = genStaffPassword(salonSaba.slug, empUser3.name, 2);
  const staffAbrhamPassword = genStaffPassword(salonDawit.slug, empUser2.name, 1);

  const empUser1Rec = await prisma.user.create({
    data: {
      email: genStaffEmail(salonSaba.slug, 1, empUser1.name),
      passwordHash: await bcrypt.hash(staffHelenPassword, salt),
      name: empUser1.name,
      phone: empUser1.phone,
      role: Role.EMPLOYEE,
      profile: { create: { referralCode: `${empUser1.name.split(' ')[0].toUpperCase()}${Math.floor(100 + Math.random() * 900)}`, walletBalance: 0.0 } },
    },
  });

  const empUser3Rec = await prisma.user.create({
    data: {
      email: genStaffEmail(salonSaba.slug, 2, empUser3.name),
      passwordHash: await bcrypt.hash(staffTigistPassword, salt),
      name: empUser3.name,
      phone: empUser3.phone,
      role: Role.EMPLOYEE,
      profile: { create: { referralCode: `${empUser3.name.split(' ')[0].toUpperCase()}${Math.floor(100 + Math.random() * 900)}`, walletBalance: 0.0 } },
    },
  });

  const empUser2Rec = await prisma.user.create({
    data: {
      email: genStaffEmail(salonDawit.slug, 1, empUser2.name),
      passwordHash: await bcrypt.hash(staffAbrhamPassword, salt),
      name: empUser2.name,
      phone: empUser2.phone,
      role: Role.EMPLOYEE,
      profile: { create: { referralCode: `${empUser2.name.split(' ')[0].toUpperCase()}${Math.floor(100 + Math.random() * 900)}`, walletBalance: 0.0 } },
    },
  });

  console.log('Created staff credentials (for demo):');
  console.log(`${empUser1Rec.email} / ${staffHelenPassword}`);
  console.log(`${empUser3Rec.email} / ${staffTigistPassword}`);
  console.log(`${empUser2Rec.email} / ${staffAbrhamPassword}`);

  // Create employee records linking to the created users
  const empHelen = await prisma.employee.create({
    data: {
      userId: empUser1Rec.id,
      salonId: salonSaba.id,
      name: 'Helen Kebede',
      bio: 'Expert stylist with over 6 years of experience in luxury coloring and custom haircuts.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
      rating: 4.9,
      reviewCount: 1,
    },
  });

  const empTigist = await prisma.employee.create({
    data: {
      userId: empUser3Rec.id,
      salonId: salonSaba.id,
      name: 'Tigist Bekele',
      bio: 'Specialist in high-end nail art, manicures, pedicures, and skincare treatments.',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200',
      rating: 4.7,
      reviewCount: 1,
    },
  });

  // Dawit Employees
  const empAbrham = await prisma.employee.create({
    data: {
      userId: empUser2Rec.id,
      salonId: salonDawit.id,
      name: 'Abrham Alemu',
      bio: 'Master barber specialized in modern skin fades, classic shaves, and beard designing.',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
      rating: 4.7,
      reviewCount: 1,
    },
  });

  // Associate services to employees
  await prisma.employeeService.createMany({
    data: [
      { employeeId: empHelen.id, serviceId: sabaHaircut.id },
      { employeeId: empHelen.id, serviceId: sabaFacial.id },
      { employeeId: empTigist.id, serviceId: sabaNails.id },
      { employeeId: empTigist.id, serviceId: sabaFacial.id },
      { employeeId: empAbrham.id, serviceId: dawitHaircut.id },
      { employeeId: empAbrham.id, serviceId: dawitShave.id },
    ],
  });

  // Employee Schedules (Monday through Saturday, 9 AM to 6 PM)
  const workingDays = [1, 2, 3, 4, 5, 6];
  for (const employeeId of [empHelen.id, empTigist.id, empAbrham.id]) {
    for (const day of workingDays) {
      await prisma.employeeSchedule.create({
        data: {
          employeeId,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '18:00',
          isBreak: false,
        },
      });

      // Daily Lunch Break 1 PM - 2 PM
      await prisma.employeeSchedule.create({
        data: {
          employeeId,
          dayOfWeek: day,
          startTime: '13:00',
          endTime: '14:00',
          isBreak: true,
        },
      });
    }
  }

  console.log('Seeding Portfolio Images...');
  await prisma.salonPortfolio.createMany({
    data: [
      { salonId: salonSaba.id, imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=500', description: 'Our beautiful spa room' },
      { salonId: salonSaba.id, imageUrl: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?q=80&w=500', description: 'Premium manicure section' },
      { salonId: salonDawit.id, imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=500', description: 'Barber chairs and setups' },
    ],
  });

  console.log('Seeding Coupons...');
  await prisma.coupon.create({
    data: {
      salonId: salonSaba.id,
      code: 'SABAWELCOME10',
      discountPercent: 10,
      maxDiscount: 200.00,
      expiryDate: new Date('2027-12-31'),
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      salonId: salonDawit.id,
      code: 'DAWITCUT20',
      discountPercent: 20,
      maxDiscount: 100.00,
      expiryDate: new Date('2027-12-31'),
      isActive: true,
    },
  });

  console.log('Seeding Bookings & Reviews...');
  // Booking 1 - Completed, Helen Haircut for Berke
  const booking1Time = new Date('2026-07-06T10:00:00Z');
  const booking1EndTime = new Date('2026-07-06T10:45:00Z');
  const booking1 = await prisma.booking.create({
    data: {
      customerId: customer1.id,
      salonId: salonSaba.id,
      serviceId: sabaHaircut.id,
      employeeId: empHelen.id,
      startTime: booking1Time,
      endTime: booking1EndTime,
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.TELEBIRR,
      paymentDetails: { transactionId: 'TXN-TB-998877', customerPhone: '+251911000004' },
      totalPrice: 500.00,
      discountApplied: 0.00,
      finalPrice: 500.00,
      notes: 'Please wash with warm water.',
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking1.id,
      customerId: customer1.id,
      salonId: salonSaba.id,
      rating: 5,
      comment: 'Excellent styling! Saba\'s salon is beautiful and Helen was very detail-oriented.',
      reply: 'Thank you Berke! We look forward to seeing you again.',
    },
  });

  // Booking 2 - Completed, Tigist Nails for Selam
  const booking2Time = new Date('2026-07-05T14:00:00Z');
  const booking2EndTime = new Date('2026-07-05T15:00:00Z');
  const booking2 = await prisma.booking.create({
    data: {
      customerId: customer2.id,
      salonId: salonSaba.id,
      serviceId: sabaNails.id,
      employeeId: empTigist.id,
      startTime: booking2Time,
      endTime: booking2EndTime,
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.CBE_BIRR,
      paymentDetails: { refNo: 'FT260909090', customerName: 'Selamawit Tadesse' },
      totalPrice: 600.00,
      discountApplied: 0.00,
      finalPrice: 600.00,
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking2.id,
      customerId: customer2.id,
      salonId: salonSaba.id,
      rating: 4,
      comment: 'Loved the gel manicure. Highly recommend Tigist!',
    },
  });

  // Booking 3 - Completed, Abrham Shave for Berke
  const booking3Time = new Date('2026-07-04T09:30:00Z');
  const booking3EndTime = new Date('2026-07-04T10:00:00Z');
  const booking3 = await prisma.booking.create({
    data: {
      customerId: customer1.id,
      salonId: salonDawit.id,
      serviceId: dawitShave.id,
      employeeId: empAbrham.id,
      startTime: booking3Time,
      endTime: booking3EndTime,
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.CASH,
      totalPrice: 250.00,
      discountApplied: 50.00,
      finalPrice: 200.00,
      couponCode: 'DAWITCUT20',
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking3.id,
      customerId: customer1.id,
      salonId: salonDawit.id,
      rating: 5,
      comment: 'Best shave in Addis. The hot towel process is very relaxing.',
    },
  });

  // Booking 4 - Upcoming, Helen Haircut for Selam
  // July 8th, 2026 at 11:00 AM (local time reference is July 7th)
  const booking4Time = new Date('2026-07-08T11:00:00Z');
  const booking4EndTime = new Date('2026-07-08T11:45:00Z');
  await prisma.booking.create({
    data: {
      customerId: customer2.id,
      salonId: salonSaba.id,
      serviceId: sabaHaircut.id,
      employeeId: empHelen.id,
      startTime: booking4Time,
      endTime: booking4EndTime,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.CASH,
      totalPrice: 500.00,
      discountApplied: 0.00,
      finalPrice: 500.00,
      notes: 'Requesting simple styling.',
    },
  });

  console.log('Seeding Audit Logs...');
  await prisma.auditLog.createMany({
    data: [
      { action: 'USER_REGISTER', details: 'User admin@beauty.et successfully registered as admin.', ipAddress: '127.0.0.1' },
      { action: 'SALON_VERIFIED', details: `Salon ${salonSaba.id} verified by super admin.`, ipAddress: '192.168.1.100' },
      { action: 'SALON_VERIFIED', details: `Salon ${salonDawit.id} verified by super admin.`, ipAddress: '192.168.1.100' },
    ],
  });

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
