// src/lib/serverDb.ts
import { INITIAL_SALONS, DEMO_USERS, INITIAL_BOOKINGS, MockSalon, MockBooking, DemoUser } from './mockData';

export interface DbUser extends DemoUser {
  passwordHash?: string;
  profile?: {
    walletBalance: number;
    points: number;
    referralCode?: string;
  };
}

export interface DbCoupon {
  id: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
  expiryDate: string;
  salonId?: string;
  usageLimit?: number;
  maxDiscount?: number;
}

interface ServerDatabase {
  users: Map<string, DbUser>;
  bookings: Map<string, MockBooking>;
  salons: Map<string, MockSalon>;
  coupons: Map<string, DbCoupon>;
}

// Preserve database across hot-reloads in Next.js development
const globalForDb = globalThis as unknown as {
  __teraz_server_db?: ServerDatabase;
};

function initDatabase(): ServerDatabase {
  const users = new Map<string, DbUser>();
  const bookings = new Map<string, MockBooking>();
  const salons = new Map<string, MockSalon>();
  const coupons = new Map<string, DbCoupon>();

  // 1. Seed demo users
  Object.values(DEMO_USERS).forEach((u) => {
    users.set(u.id, {
      ...u,
      walletBalance: u.walletBalance ?? (u.role === 'CUSTOMER' ? 450 : 0),
      loyaltyPoints: u.loyaltyPoints ?? (u.role === 'CUSTOMER' ? 120 : 0),
      referralCode: u.referralCode ?? (u.role === 'CUSTOMER' ? 'ABEBE50' : undefined),
      profile: {
        walletBalance: u.walletBalance ?? (u.role === 'CUSTOMER' ? 450 : 0),
        points: u.loyaltyPoints ?? (u.role === 'CUSTOMER' ? 120 : 0),
        referralCode: u.referralCode ?? (u.role === 'CUSTOMER' ? 'ABEBE50' : undefined),
      },
    });
  });

  // 2. Seed bookings
  INITIAL_BOOKINGS.forEach((b) => {
    bookings.set(b.id, { ...b });
  });

  // 3. Seed salons
  INITIAL_SALONS.forEach((s) => {
    salons.set(s.id, { ...s });
  });

  // 4. Seed coupons
  const defaultCoupons: DbCoupon[] = [
    { id: 'cp-1', code: 'BEAUTY20', discountPercent: 20, isActive: true, expiryDate: '2027-12-31' },
    { id: 'cp-2', code: 'ETHIO10', discountPercent: 10, isActive: true, expiryDate: '2027-12-31' },
  ];
  defaultCoupons.forEach((cp) => coupons.set(cp.id, cp));

  return { users, bookings, salons, coupons };
}

const db = globalForDb.__teraz_server_db ?? initDatabase();
if (process.env.NODE_ENV !== 'production') {
  globalForDb.__teraz_server_db = db;
}

// Helper methods
export const serverDb = {
  // Users
  getUserById(id: string): DbUser | null {
    const user = db.users.get(id);
    if (!user) return null;
    return {
      ...user,
      profile: user.profile ?? {
        walletBalance: user.walletBalance ?? 0,
        points: user.loyaltyPoints ?? 0,
        referralCode: user.referralCode,
      },
    };
  },

  getUserByEmail(email: string): DbUser | null {
    const target = email.toLowerCase().trim();
    for (const user of db.users.values()) {
      if (user.email.toLowerCase().trim() === target) {
        return {
          ...user,
          profile: user.profile ?? {
            walletBalance: user.walletBalance ?? 0,
            points: user.loyaltyPoints ?? 0,
            referralCode: user.referralCode,
          },
        };
      }
    }
    return null;
  },

  createUser(userData: Partial<DbUser> & { email: string; name: string }): DbUser {
    const id = userData.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const wallet = userData.walletBalance ?? 50;
    const points = userData.loyaltyPoints ?? 10;
    const refCode = userData.referralCode || `${userData.name.split(' ')[0].toUpperCase()}-${id.substring(0, 4)}`;

    const user: DbUser = {
      id,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'CUSTOMER',
      avatarUrl: userData.avatarUrl,
      phone: userData.phone,
      walletBalance: wallet,
      loyaltyPoints: points,
      referralCode: refCode,
      passwordHash: userData.passwordHash,
      profile: {
        walletBalance: wallet,
        points,
        referralCode: refCode,
      },
    };

    db.users.set(id, user);
    return user;
  },

  updateUser(id: string, updates: Partial<DbUser>): DbUser | null {
    const existing = db.users.get(id);
    if (!existing) return null;

    const updated: DbUser = {
      ...existing,
      ...updates,
      profile: {
        walletBalance: updates.walletBalance ?? existing.walletBalance ?? existing.profile?.walletBalance ?? 0,
        points: updates.loyaltyPoints ?? existing.loyaltyPoints ?? existing.profile?.points ?? 0,
        referralCode: updates.referralCode ?? existing.referralCode ?? existing.profile?.referralCode,
      },
    };

    db.users.set(id, updated);
    return updated;
  },

  // Bookings
  getAllBookings(): MockBooking[] {
    return Array.from(db.bookings.values()).sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  },

  getBookingById(id: string): MockBooking | null {
    return db.bookings.get(id) || null;
  },

  getBookingsByCustomer(customerIdOrEmail: string): MockBooking[] {
    const list = Array.from(db.bookings.values()).filter(
      (b) =>
        b.customerId === customerIdOrEmail ||
        b.customer?.id === customerIdOrEmail ||
        b.customer?.email?.toLowerCase() === customerIdOrEmail.toLowerCase()
    );
    return list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  },

  getBookingsByEmployee(employeeEmail: string): MockBooking[] {
    const list = Array.from(db.bookings.values()).filter(
      (b) => b.employee?.user?.email?.toLowerCase() === employeeEmail.toLowerCase()
    );
    return list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  },

  getBookingsBySalon(salonId: string): MockBooking[] {
    const list = Array.from(db.bookings.values()).filter((b) => b.salonId === salonId);
    return list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  },

  createBooking(booking: MockBooking): MockBooking {
    db.bookings.set(booking.id, booking);
    return booking;
  },

  updateBooking(id: string, updates: Partial<MockBooking>): MockBooking | null {
    const existing = db.bookings.get(id);
    if (!existing) return null;

    const updated: MockBooking = {
      ...existing,
      ...updates,
    };

    db.bookings.set(id, updated);
    return updated;
  },

  deleteBooking(id: string): boolean {
    return db.bookings.delete(id);
  },

  // Salons
  getAllSalons(): MockSalon[] {
    return Array.from(db.salons.values());
  },

  getSalonByIdOrSlug(idOrSlug: string): MockSalon | null {
    const salons = Array.from(db.salons.values());
    return salons.find((s) => s.id === idOrSlug || s.slug === idOrSlug) || null;
  },

  createSalon(salon: MockSalon): MockSalon {
    db.salons.set(salon.id, salon);
    return salon;
  },

  updateSalon(id: string, updates: Partial<MockSalon>): MockSalon | null {
    const existing = db.salons.get(id);
    if (!existing) return null;

    const updated: MockSalon = {
      ...existing,
      ...updates,
    };
    db.salons.set(id, updated);
    return updated;
  },

  deleteSalon(id: string): boolean {
    return db.salons.delete(id);
  },

  // Coupons
  getAllCoupons(): DbCoupon[] {
    return Array.from(db.coupons.values());
  },

  createCoupon(coupon: DbCoupon): DbCoupon {
    db.coupons.set(coupon.id, coupon);
    return coupon;
  },
};

