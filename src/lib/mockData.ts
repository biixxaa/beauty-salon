// src/lib/mockData.ts

export interface MockSalon {
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
    duration: number; // in minutes
    price: number; // in ETB
    category: string;
    employees?: Array<{
      employee: {
        id: string;
        user: {
          name: string;
          email: string;
          avatarUrl?: string;
        };
      };
    }>;
  }>;
  employees: Array<{
    id: string;
    title?: string;
    user: {
      name: string;
      email: string;
      avatarUrl?: string;
    };
    services?: Array<{
      service: {
        id: string;
        name: string;
      };
    }>;
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

export const INITIAL_SALONS: MockSalon[] = [
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
    description:
      'Addis Ababa premier beauty destination offering luxury hair styling, organic Moroccan oil treatments, bridal packages, and relaxing head-to-toe spa services.',
    bannerUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200',
    isVerified: true,
    rating: 4.9,
    featured: true,
    workingHours: [
      { id: 'wh-1-0', dayOfWeek: 0, openTime: '10:00', closeTime: '18:00', isClosed: false },
      { id: 'wh-1-1', dayOfWeek: 1, openTime: '08:30', closeTime: '20:30', isClosed: false },
      { id: 'wh-1-2', dayOfWeek: 2, openTime: '08:30', closeTime: '20:30', isClosed: false },
      { id: 'wh-1-3', dayOfWeek: 3, openTime: '08:30', closeTime: '20:30', isClosed: false },
      { id: 'wh-1-4', dayOfWeek: 4, openTime: '08:30', closeTime: '20:30', isClosed: false },
      { id: 'wh-1-5', dayOfWeek: 5, openTime: '08:30', closeTime: '21:00', isClosed: false },
      { id: 'wh-1-6', dayOfWeek: 6, openTime: '08:00', closeTime: '21:00', isClosed: false },
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
      {
        id: 'emp-2',
        title: 'Senior Hair Artist',
        user: {
          name: 'Tigist Bekele',
          email: 'tigist@sabaluxury.et',
          avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200',
        },
      },
    ],
    services: [
      {
        id: 'srv-1',
        salonId: 'salon-1',
        name: 'Deep Conditioning & Moroccan Hydration',
        description: 'Restores dry, damaged curls with authentic organic Argan oil steam therapy.',
        duration: 60,
        price: 950,
        category: 'HAIR_CARE',
        employees: [
          { employee: { id: 'emp-1', user: { name: 'Saba Mengistu', email: 'saba@sabaluxury.et' } } },
          { employee: { id: 'emp-2', user: { name: 'Tigist Bekele', email: 'tigist@sabaluxury.et' } } },
        ],
      },
      {
        id: 'srv-2',
        salonId: 'salon-1',
        name: 'Bridal Traditional Albaso & Braiding',
        description: 'Intricate traditional Ethiopian braiding styles for weddings and holidays.',
        duration: 90,
        price: 1800,
        category: 'STYLING',
        employees: [
          { employee: { id: 'emp-1', user: { name: 'Saba Mengistu', email: 'saba@sabaluxury.et' } } },
        ],
      },
      {
        id: 'srv-3',
        salonId: 'salon-1',
        name: 'Luxury Gel Manicure & Hand Massage',
        description: 'Cuticle revitalization, nail shaping, premium gel polish with hand massage.',
        duration: 45,
        price: 750,
        category: 'NAILS',
        employees: [
          { employee: { id: 'emp-2', user: { name: 'Tigist Bekele', email: 'tigist@sabaluxury.et' } } },
        ],
      },
    ],
    reviews: [
      {
        id: 'rev-1',
        rating: 5,
        comment: 'Absolutely spectacular service! The Moroccan oil steam treatment transformed my hair completely.',
        createdAt: '2026-08-20T14:32:00Z',
        customer: { name: 'Hanna Tadesse', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200' },
      },
      {
        id: 'rev-2',
        rating: 5,
        comment: 'Saba is the best hair artist in Bole. Clean atmosphere and very polite staff.',
        createdAt: '2026-08-15T11:20:00Z',
        customer: { name: 'Meron Assefa', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' },
      },
    ],
    coupons: [
      { id: 'c-1', code: 'BEAUTY20', discountPercent: 20, isActive: true, expiryDate: '2027-12-31' },
      { id: 'c-2', code: 'WELCOME10', discountPercent: 10, isActive: true, expiryDate: '2027-12-31' },
    ],
    portfolio: [
      { id: 'p-1', title: 'Silk Press & Treatment', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600' },
      { id: 'p-2', title: 'Bridal Updo', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600' },
    ],
  },
  {
    id: 'salon-2',
    name: "Bole Gentlemen's Grooming Lounge",
    slug: 'bole-gentlemens-grooming',
    category: 'MEN',
    address: 'Atlas Hotel Area, Namibia St, Addis Ababa',
    latitude: 9.0145,
    longitude: 38.7792,
    phone: '+251 922 445566',
    email: 'info@bolegrooming.et',
    description:
      'An upscale men’s salon and barbershop featuring master fades, straight razor hot-towel shaves, scalp care, and facial relaxation.',
    bannerUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200',
    isVerified: true,
    rating: 4.8,
    featured: true,
    workingHours: [
      { id: 'wh-2-0', dayOfWeek: 0, openTime: '09:00', closeTime: '19:00', isClosed: false },
      { id: 'wh-2-1', dayOfWeek: 1, openTime: '08:00', closeTime: '21:00', isClosed: false },
      { id: 'wh-2-2', dayOfWeek: 2, openTime: '08:00', closeTime: '21:00', isClosed: false },
      { id: 'wh-2-3', dayOfWeek: 3, openTime: '08:00', closeTime: '21:00', isClosed: false },
      { id: 'wh-2-4', dayOfWeek: 4, openTime: '08:00', closeTime: '21:00', isClosed: false },
      { id: 'wh-2-5', dayOfWeek: 5, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { id: 'wh-2-6', dayOfWeek: 6, openTime: '08:00', closeTime: '22:00', isClosed: false },
    ],
    employees: [
      {
        id: 'emp-3',
        title: 'Head Barber',
        user: {
          name: 'Dawit Alemu',
          email: 'dawit@bolegrooming.et',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
        },
      },
    ],
    services: [
      {
        id: 'srv-4',
        salonId: 'salon-2',
        name: 'Executive Gentleman Cut & Style',
        description: 'Precision scissor and clipper taper cut tailored to facial structure with styling.',
        duration: 45,
        price: 550,
        category: 'HAIRCUT',
        employees: [
          { employee: { id: 'emp-3', user: { name: 'Dawit Alemu', email: 'dawit@bolegrooming.et' } } },
        ],
      },
      {
        id: 'srv-5',
        salonId: 'salon-2',
        name: 'Classic Hot Towel Shave & Beard Sculpt',
        description: 'Eucalyptus essential oil warm towel wrap, straight razor shave, and soothing balm.',
        duration: 35,
        price: 450,
        category: 'BEARD',
        employees: [
          { employee: { id: 'emp-3', user: { name: 'Dawit Alemu', email: 'dawit@bolegrooming.et' } } },
        ],
      },
    ],
    reviews: [
      {
        id: 'rev-3',
        rating: 5,
        comment: 'Best fade in the city. The hot towel shave is an incredible experience.',
        createdAt: '2026-08-18T16:10:00Z',
        customer: { name: 'Yared Teshome', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200' },
      },
    ],
    coupons: [
      { id: 'c-3', code: 'GROOM15', discountPercent: 15, isActive: true, expiryDate: '2027-12-31' },
    ],
    portfolio: [
      { id: 'p-3', title: 'Clean Fade & Beard', imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=600' },
    ],
  },
  {
    id: 'salon-3',
    name: 'Habesha Curls & Natural Hair Studio',
    slug: 'habesha-curls-studio',
    category: 'UNISEX',
    address: 'Sarbet, Near Canadian Embassy, Addis Ababa',
    latitude: 8.995,
    longitude: 38.742,
    phone: '+251 933 556677',
    email: 'hello@habeshacurls.et',
    description:
      'Dedicated to nurturing and celebrating authentic curly, coily, and kinky hair textures with sulfate-free organic remedies.',
    bannerUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200',
    isVerified: true,
    rating: 4.9,
    featured: true,
    workingHours: [
      { id: 'wh-3-0', dayOfWeek: 0, openTime: '10:00', closeTime: '17:00', isClosed: true },
      { id: 'wh-3-1', dayOfWeek: 1, openTime: '09:00', closeTime: '19:00', isClosed: false },
      { id: 'wh-3-2', dayOfWeek: 2, openTime: '09:00', closeTime: '19:00', isClosed: false },
      { id: 'wh-3-3', dayOfWeek: 3, openTime: '09:00', closeTime: '19:00', isClosed: false },
      { id: 'wh-3-4', dayOfWeek: 4, openTime: '09:00', closeTime: '19:00', isClosed: false },
      { id: 'wh-3-5', dayOfWeek: 5, openTime: '09:00', closeTime: '20:00', isClosed: false },
      { id: 'wh-3-6', dayOfWeek: 6, openTime: '09:00', closeTime: '20:00', isClosed: false },
    ],
    employees: [
      {
        id: 'emp-4',
        title: 'Texture Specialist',
        user: {
          name: 'Bethlehem Girma',
          email: 'betti@habeshacurls.et',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
        },
      },
    ],
    services: [
      {
        id: 'srv-6',
        salonId: 'salon-3',
        name: 'Curl Definition & Hydration Bath',
        description: 'Botanical moisture treatment designed specifically for 3C to 4C curl patterns.',
        duration: 75,
        price: 850,
        category: 'NATURAL_HAIR',
        employees: [
          { employee: { id: 'emp-4', user: { name: 'Bethlehem Girma', email: 'betti@habeshacurls.et' } } },
        ],
      },
    ],
    reviews: [
      {
        id: 'rev-4',
        rating: 5,
        comment: 'Finally someone in Addis who understands how to treat 4C hair with love and gentle hands!',
        createdAt: '2026-08-10T09:15:00Z',
        customer: { name: 'Rahel Wolde', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200' },
      },
    ],
    coupons: [
      { id: 'c-4', code: 'CURLS10', discountPercent: 10, isActive: true, expiryDate: '2027-12-31' },
    ],
    portfolio: [
      { id: 'p-4', title: 'Defined Ringlets', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600' },
    ],
  },
  {
    id: 'salon-4',
    name: 'Flawless Nails & Wellness Spa',
    slug: 'flawless-nails-spa',
    category: 'WOMEN',
    address: 'Kazanchis, Inter Luxury Hotel Road, Addis Ababa',
    latitude: 9.0198,
    longitude: 38.7621,
    phone: '+251 944 667788',
    email: 'booking@flawlessnails.et',
    description:
      'Premier nail salon specializing in acrylic extensions, BIAB builder gel, Japanese nail art, and organic foot spa treatments.',
    bannerUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1200',
    isVerified: true,
    rating: 4.7,
    featured: true,
    workingHours: [
      { id: 'wh-4-0', dayOfWeek: 0, openTime: '10:00', closeTime: '18:00', isClosed: false },
      { id: 'wh-4-1', dayOfWeek: 1, openTime: '08:30', closeTime: '20:00', isClosed: false },
      { id: 'wh-4-2', dayOfWeek: 2, openTime: '08:30', closeTime: '20:00', isClosed: false },
      { id: 'wh-4-3', dayOfWeek: 3, openTime: '08:30', closeTime: '20:00', isClosed: false },
      { id: 'wh-4-4', dayOfWeek: 4, openTime: '08:30', closeTime: '20:00', isClosed: false },
      { id: 'wh-4-5', dayOfWeek: 5, openTime: '08:30', closeTime: '21:00', isClosed: false },
      { id: 'wh-4-6', dayOfWeek: 6, openTime: '08:30', closeTime: '21:00', isClosed: false },
    ],
    employees: [
      {
        id: 'emp-5',
        title: 'Senior Nail Artist',
        user: {
          name: 'Selamawit Kebede',
          email: 'selam@flawlessnails.et',
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200',
        },
      },
    ],
    services: [
      {
        id: 'srv-7',
        salonId: 'salon-4',
        name: 'BIAB Builder Gel Extension & Custom Nail Art',
        description: 'Reinforced natural nail strengthening with custom hand-painted embellishments.',
        duration: 60,
        price: 1100,
        category: 'NAILS',
        employees: [
          { employee: { id: 'emp-5', user: { name: 'Selamawit Kebede', email: 'selam@flawlessnails.et' } } },
        ],
      },
    ],
    reviews: [
      {
        id: 'rev-5',
        rating: 5,
        comment: 'Nails lasted 4 full weeks without chipping. Gorgeous studio and great coffee!',
        createdAt: '2026-08-12T13:40:00Z',
        customer: { name: 'Eden Hailu', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200' },
      },
    ],
    coupons: [
      { id: 'c-5', code: 'NAILS15', discountPercent: 15, isActive: true, expiryDate: '2027-12-31' },
    ],
    portfolio: [
      { id: 'p-5', title: 'French Chrome Almond Nails', imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=600' },
    ],
  },
];

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'SALON_OWNER' | 'EMPLOYEE' | 'ADMIN';
  avatarUrl?: string;
  phone?: string;
  walletBalance?: number;
  loyaltyPoints?: number;
  referralCode?: string;
}

export const DEMO_USERS: Record<string, DemoUser> = {
  customer: {
    id: 'usr-customer-1',
    name: 'Abebe Kebede',
    email: 'abebe@example.com',
    role: 'CUSTOMER',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
    phone: '+251 911 123456',
    walletBalance: 450,
    loyaltyPoints: 120,
    referralCode: 'ABEBE50',
  },
  salon_owner: {
    id: 'usr-owner-1',
    name: 'Saba Mengistu',
    email: 'saba@sabaluxury.et',
    role: 'SALON_OWNER',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200',
    phone: '+251 911 223344',
  },
  employee: {
    id: 'usr-employee-1',
    name: 'Dawit Alemu',
    email: 'dawit@bolegrooming.et',
    role: 'EMPLOYEE',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
    phone: '+251 922 445566',
  },
  admin: {
    id: 'usr-admin-1',
    name: 'Super Admin',
    email: 'admin@terazbeauty.et',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200',
  },
};

export interface MockBooking {
  id: string;
  salonId: string;
  serviceId: string;
  employeeId?: string;
  customerId: string;
  startTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
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

export const INITIAL_BOOKINGS: MockBooking[] = [
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
