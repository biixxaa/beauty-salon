// backend/src/data/db.ts
import { User, Salon, Booking, Coupon } from '../types/index.js';

class InMemoryDatabase {
  users: Map<string, User> = new Map();
  salons: Map<string, Salon> = new Map();
  bookings: Map<string, Booking> = new Map();
  coupons: Map<string, Coupon> = new Map();

  constructor() {
    this.seed();
  }

  seed() {
    // 1. Seed demo users
    const initialUsers: User[] = [
      {
        id: 'usr-customer-1',
        name: 'Abebe Kebede',
        email: 'abebe@example.com',
        role: 'CUSTOMER',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
        phone: '+251 911 123456',
        walletBalance: 450,
        loyaltyPoints: 120,
        referralCode: 'ABEBE50',
        profile: {
          walletBalance: 450,
          points: 120,
          referralCode: 'ABEBE50',
        },
      },
      {
        id: 'usr-owner-1',
        name: 'Saba Mengistu',
        email: 'saba@sabaluxury.et',
        role: 'SALON_OWNER',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200',
        phone: '+251 911 223344',
        walletBalance: 0,
        loyaltyPoints: 0,
      },
      {
        id: 'usr-employee-1',
        name: 'Dawit Alemu',
        email: 'dawit@bolegrooming.et',
        role: 'EMPLOYEE',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
        phone: '+251 922 445566',
        walletBalance: 0,
        loyaltyPoints: 0,
      },
      {
        id: 'usr-admin-1',
        name: 'Super Admin',
        email: 'admin@terazbeauty.et',
        role: 'ADMIN',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200',
        walletBalance: 0,
        loyaltyPoints: 0,
      },
    ];

    initialUsers.forEach((u) => this.users.set(u.id, u));

    // 2. Seed initial salons
    const initialSalons: Salon[] = [
      {
        id: 'salon-1',
        name: "Saba's Luxury Hair & Spa Lounge",
        slug: 'saba-luxury-salon',
        category: 'WOMEN',
        address: 'Bole Medhanialem, Behind Edna Mall, Addis Ababa',
        latitude: 9.0012,
        longitude: 38.7845,
        phone: '+251 911 223344',
        email: 'contact@sabaluxury.et',
        description: 'Addis Ababa premier beauty destination offering luxury hair styling, organic Moroccan oil treatments, bridal packages, and relaxing head-to-toe spa services.',
        bannerUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200',
        isVerified: true,
        rating: 4.9,
        featured: true,
        workingHours: [
          { id: 'wh-1', dayOfWeek: 1, openTime: '08:30', closeTime: '19:30', isClosed: false },
          { id: 'wh-2', dayOfWeek: 2, openTime: '08:30', closeTime: '19:30', isClosed: false },
          { id: 'wh-3', dayOfWeek: 3, openTime: '08:30', closeTime: '19:30', isClosed: false },
          { id: 'wh-4', dayOfWeek: 4, openTime: '08:30', closeTime: '19:30', isClosed: false },
          { id: 'wh-5', dayOfWeek: 5, openTime: '08:30', closeTime: '19:30', isClosed: false },
          { id: 'wh-6', dayOfWeek: 6, openTime: '08:30', closeTime: '19:30', isClosed: false },
          { id: 'wh-7', dayOfWeek: 0, openTime: '10:00', closeTime: '17:00', isClosed: false },
        ],
        services: [
          {
            id: 'srv-1',
            salonId: 'salon-1',
            name: 'Deep Conditioning & Moroccan Hydration',
            description: 'Intense moisture bath with authentic Moroccan Argan oil and scalp massage.',
            duration: 60,
            price: 950,
            category: 'Treatment',
          },
          {
            id: 'srv-2',
            salonId: 'salon-1',
            name: 'Luxury Haircut & Blow Dry',
            description: 'Custom cut tailored to your face shape, followed by volume blow dry.',
            duration: 50,
            price: 700,
            category: 'Haircut',
          },
        ],
        employees: [
          {
            id: 'emp-1',
            title: 'Master Colorist & Stylist',
            user: {
              name: 'Saba Mengistu',
              email: 'saba@sabaluxury.et',
              avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200',
            },
          },
        ],
        reviews: [
          {
            id: 'rev-1',
            rating: 5,
            comment: 'Saba and her staff are wonderful! My hair has never felt softer.',
            createdAt: '2026-06-15T10:00:00.000Z',
            customer: {
              name: 'Hanna Tadesse',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
            },
          },
        ],
        coupons: [],
        portfolio: [],
      },
      {
        id: 'salon-2',
        name: "Bole Gentlemen's Grooming Lounge",
        slug: 'bole-gentlemens-grooming',
        category: 'MEN',
        address: 'Atlas Hotel Area, Namibia St, Addis Ababa',
        latitude: 9.0156,
        longitude: 38.7734,
        phone: '+251 922 445566',
        email: 'info@bolegrooming.et',
        description: 'Elite barbering, hot towel shaves, beard architecture, and executive grooming in an upscale gentleman club ambiance.',
        bannerUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200',
        isVerified: true,
        rating: 4.8,
        featured: true,
        workingHours: [
          { id: 'wh-8', dayOfWeek: 1, openTime: '08:00', closeTime: '21:00', isClosed: false },
          { id: 'wh-9', dayOfWeek: 2, openTime: '08:00', closeTime: '21:00', isClosed: false },
          { id: 'wh-10', dayOfWeek: 3, openTime: '08:00', closeTime: '21:00', isClosed: false },
          { id: 'wh-11', dayOfWeek: 4, openTime: '08:00', closeTime: '21:00', isClosed: false },
          { id: 'wh-12', dayOfWeek: 5, openTime: '08:00', closeTime: '21:00', isClosed: false },
          { id: 'wh-13', dayOfWeek: 6, openTime: '08:00', closeTime: '21:00', isClosed: false },
          { id: 'wh-14', dayOfWeek: 0, openTime: '09:00', closeTime: '19:00', isClosed: false },
        ],
        services: [
          {
            id: 'srv-4',
            salonId: 'salon-2',
            name: 'Executive Gentleman Cut & Style',
            description: 'Custom scissors & clipper cut, energizing wash, and styling with premium pomade.',
            duration: 45,
            price: 550,
            category: 'Barbering',
          },
        ],
        employees: [
          {
            id: 'emp-3',
            title: 'Lead Barber',
            user: {
              name: 'Dawit Alemu',
              email: 'dawit@bolegrooming.et',
              avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
            },
          },
        ],
        reviews: [],
        coupons: [],
        portfolio: [],
      },
    ];

    initialSalons.forEach((s) => this.salons.set(s.id, s));

    // 3. Seed initial bookings
    const initialBookings: Booking[] = [
      {
        id: 'bk-101',
        salonId: 'salon-1',
        serviceId: 'srv-1',
        employeeId: 'emp-1',
        customerId: 'usr-customer-1',
        startTime: new Date(Date.now() + 86400000 * 2).toISOString(),
        status: 'CONFIRMED',
        paymentMethod: 'TELEBIRR',
        paymentStatus: 'PAID',
        totalPrice: 950,
        notes: 'Please prepare organic Moroccan oils.',
        salon: {
          id: 'salon-1',
          name: "Saba's Luxury Hair & Spa Lounge",
          address: 'Bole Medhanialem, Behind Edna Mall, Addis Ababa',
          slug: 'saba-luxury-salon',
          bannerUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=300',
        },
        service: {
          id: 'srv-1',
          name: 'Deep Conditioning & Moroccan Hydration',
          duration: 60,
          price: 950,
        },
        employee: {
          id: 'emp-1',
          user: {
            name: 'Saba Mengistu',
            email: 'saba@sabaluxury.et',
          },
        },
        customer: {
          id: 'usr-customer-1',
          name: 'Abebe Kebede',
          email: 'abebe@example.com',
          phone: '+251 911 123456',
        },
      },
      {
        id: 'bk-102',
        salonId: 'salon-2',
        serviceId: 'srv-4',
        employeeId: 'emp-3',
        customerId: 'usr-customer-1',
        startTime: new Date(Date.now() - 86400000 * 3).toISOString(),
        status: 'COMPLETED',
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        totalPrice: 550,
        salon: {
          id: 'salon-2',
          name: "Bole Gentlemen's Grooming Lounge",
          address: 'Atlas Hotel Area, Namibia St, Addis Ababa',
          slug: 'bole-gentlemens-grooming',
          bannerUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=300',
        },
        service: {
          id: 'srv-4',
          name: 'Executive Gentleman Cut & Style',
          duration: 45,
          price: 550,
        },
        employee: {
          id: 'emp-3',
          user: {
            name: 'Dawit Alemu',
            email: 'dawit@bolegrooming.et',
          },
        },
        customer: {
          id: 'usr-customer-1',
          name: 'Abebe Kebede',
          email: 'abebe@example.com',
          phone: '+251 911 123456',
        },
      },
    ];

    initialBookings.forEach((b) => this.bookings.set(b.id, b));

    // 4. Seed initial coupons
    const initialCoupons: Coupon[] = [
      { id: 'cp-1', code: 'BEAUTY20', discountPercent: 20, isActive: true, expiryDate: '2027-12-31' },
      { id: 'cp-2', code: 'ETHIO10', discountPercent: 10, isActive: true, expiryDate: '2027-12-31' },
    ];
    initialCoupons.forEach((cp) => this.coupons.set(cp.id, cp));
  }
}

export const db = new InMemoryDatabase();

