// backend/src/types/index.ts

export type Role = 'CUSTOMER' | 'SALON_OWNER' | 'EMPLOYEE' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  phone?: string;
  passwordHash?: string;
  walletBalance: number;
  loyaltyPoints: number;
  referralCode?: string;
  profile?: {
    walletBalance: number;
    points: number;
    referralCode?: string;
  };
}

export interface Salon {
  id: string;
  name: string;
  slug: string;
  category: 'WOMEN' | 'MEN' | 'KIDS' | 'UNISEX';
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  description: string;
  bannerUrl: string;
  isVerified: boolean;
  rating: number;
  featured: boolean;
  workingHours: Array<{
    id: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
  services: Array<{
    id: string;
    salonId: string;
    name: string;
    description: string;
    duration: number; // minutes
    price: number; // ETB
    category: string;
  }>;
  employees: Array<{
    id: string;
    title?: string;
    user: {
      name: string;
      email: string;
      avatarUrl?: string;
    };
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    customer: {
      name: string;
      avatarUrl?: string;
    };
  }>;
  coupons: Array<{
    id: string;
    code: string;
    discountPercent: number;
    isActive: boolean;
    expiryDate: string;
  }>;
  portfolio: Array<{
    id: string;
    imageUrl: string;
    title: string;
  }>;
}

export interface Booking {
  id: string;
  salonId: string;
  serviceId: string;
  employeeId?: string;
  customerId: string;
  startTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  paymentMethod: 'CASH' | 'TELEBIRR' | 'CBE_BIRR';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  totalPrice: number;
  notes?: string;
  salon: {
    id: string;
    name: string;
    address: string;
    slug: string;
    bannerUrl?: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  employee?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
  expiryDate: string;
  usageLimit?: number;
  maxDiscount?: number;
  salonId?: string;
}

