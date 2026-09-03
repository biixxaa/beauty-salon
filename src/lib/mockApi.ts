// src/lib/mockApi.ts
'use client';

import { INITIAL_SALONS, DEMO_USERS, INITIAL_BOOKINGS, MockSalon, MockBooking, DemoUser } from './mockData';
import { beautyChatbotResponse, getAIRecommendations } from './ai';

const SALONS_STORAGE_KEY = 'teraz_salons_data';
const BOOKINGS_STORAGE_KEY = 'teraz_bookings_data';
const CURRENT_USER_KEY = 'teraz_current_user';

export function getStoredSalons(): MockSalon[] {
  if (typeof window === 'undefined') return INITIAL_SALONS;
  try {
    const data = localStorage.getItem(SALONS_STORAGE_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(SALONS_STORAGE_KEY, JSON.stringify(INITIAL_SALONS));
  } catch (err) {
    console.error('getStoredSalons error', err);
  }
  return INITIAL_SALONS;
}

export function saveStoredSalons(salons: MockSalon[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SALONS_STORAGE_KEY, JSON.stringify(salons));
  } catch (err) {
    console.error('saveStoredSalons error', err);
  }
}

export function getStoredBookings(): MockBooking[] {
  if (typeof window === 'undefined') return INITIAL_BOOKINGS;
  try {
    const data = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
  } catch (err) {
    console.error('getStoredBookings error', err);
  }
  return INITIAL_BOOKINGS;
}

export function saveStoredBookings(bookings: MockBooking[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error('saveStoredBookings error', err);
  }
}

export function getCurrentUser(): DemoUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (data) return JSON.parse(data);
    // Default to customer for instant interactive experience
    const defaultUser = DEMO_USERS.customer;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  } catch (err) {
    console.error('getCurrentUser error', err);
    return DEMO_USERS.customer;
  }
}

export function setCurrentUser(user: DemoUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    window.dispatchEvent(new Event('auth-change'));
  } catch (err) {
    console.error('setCurrentUser error', err);
  }
}

export function switchDemoRole(roleKey: 'customer' | 'salon_owner' | 'employee' | 'admin') {
  const targetUser = DEMO_USERS[roleKey];
  if (targetUser) {
    setCurrentUser(targetUser);
  }
}

// Global fetch interceptor for client-side API simulation
export function installMockApi() {
  if (typeof window === 'undefined') return;

  const win = window as any;
  if (win.__teraz_mock_installed) return;
  win.__teraz_mock_installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Check if url contains /api/
    const apiIndex = rawUrl.indexOf('/api/');
    if (apiIndex === -1) {
      return originalFetch(input, init);
    }

    const apiPathWithQuery = rawUrl.substring(apiIndex);
    const [path, queryString] = apiPathWithQuery.split('?');
    const searchParams = new URLSearchParams(queryString || '');
    const method = (init?.method || 'GET').toUpperCase();

    let body: any = null;
    if (init?.body && typeof init.body === 'string') {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }

    const jsonResponse = (data: any, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    // Simulate minimal network latency (50ms) for realistic UI feeling
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      // 1. Auth routes
      if (path === '/api/auth/me') {
        const user = getCurrentUser();
        return jsonResponse({ user });
      }

      if (path === '/api/auth/login') {
        const { email } = body || {};
        // Find matching demo user or create session
        let user = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
        if (!user) {
          user = {
            id: 'usr-' + Date.now(),
            name: email ? email.split('@')[0] : 'Valued Customer',
            email: email || 'customer@terazbeauty.et',
            role: 'CUSTOMER',
            walletBalance: 300,
            loyaltyPoints: 50,
          };
        }
        setCurrentUser(user);
        return jsonResponse({ message: 'Login successful', user });
      }

      if (path === '/api/auth/register') {
        const { name, email, role } = body || {};
        const newUser: DemoUser = {
          id: 'usr-' + Date.now(),
          name: name || 'New Member',
          email: email || 'user@terazbeauty.et',
          role: role === 'SALON_OWNER' ? 'SALON_OWNER' : 'CUSTOMER',
          walletBalance: 50, // Welcome reward bonus!
          loyaltyPoints: 10,
        };
        setCurrentUser(newUser);
        return jsonResponse({ message: 'Registration successful', user: newUser });
      }

      if (path === '/api/auth/logout') {
        setCurrentUser(null);
        return jsonResponse({ message: 'Logged out successfully' });
      }

      // 2. Salons list & details
      if (path === '/api/salons') {
        if (method === 'GET') {
          let salons = getStoredSalons();
          const category = searchParams.get('category');
          const query = searchParams.get('query')?.toLowerCase();
          const featured = searchParams.get('featured') === 'true';
          const ratingStr = searchParams.get('rating');

          if (featured) {
            salons = salons.filter((s) => s.featured);
          }
          if (category && category !== 'ALL') {
            salons = salons.filter((s) => s.category.toUpperCase() === category.toUpperCase());
          }
          if (query) {
            salons = salons.filter(
              (s) =>
                s.name.toLowerCase().includes(query) ||
                s.description.toLowerCase().includes(query) ||
                s.address.toLowerCase().includes(query)
            );
          }
          if (ratingStr) {
            const min = parseFloat(ratingStr);
            if (!isNaN(min)) {
              salons = salons.filter((s) => s.rating >= min);
            }
          }
          return jsonResponse(salons);
        }

        if (method === 'POST') {
          const salons = getStoredSalons();
          const newSalon: MockSalon = {
            ...body,
            id: 'salon-' + Date.now(),
            slug: (body.name || 'salon').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            rating: 5.0,
            featured: false,
            workingHours: INITIAL_SALONS[0].workingHours,
            services: [],
            employees: [],
            reviews: [],
            coupons: [],
            portfolio: [],
          };
          salons.push(newSalon);
          saveStoredSalons(salons);
          return jsonResponse({ message: 'Salon registered successfully', salon: newSalon }, 201);
        }
      }

      if (path.startsWith('/api/salons/')) {
        const slug = path.replace('/api/salons/', '');
        const salons = getStoredSalons();
        const salon = salons.find((s) => s.slug === slug || s.id === slug);
        if (!salon) {
          return jsonResponse({ error: 'Salon not found' }, 404);
        }
        return jsonResponse(salon);
      }

      // 3. Bookings
      if (path === '/api/bookings') {
        const bookings = getStoredBookings();
        if (method === 'GET') {
          const role = searchParams.get('role');
          const user = getCurrentUser();
          if (role === 'CUSTOMER' && user) {
            return jsonResponse(bookings.filter((b) => b.customerId === user.id || b.customer?.email === user.email));
          }
          if (role === 'EMPLOYEE' && user) {
            return jsonResponse(bookings.filter((b) => b.employee?.user?.email === user.email));
          }
          if (role === 'SALON_OWNER') {
            return jsonResponse(bookings);
          }
          return jsonResponse(bookings);
        }

        if (method === 'POST') {
          const { salonId, serviceId, employeeId, startTimeStr, paymentMethod, notes, totalPrice } = body || {};
          const salons = getStoredSalons();
          const salon = salons.find((s) => s.id === salonId);
          const service = salon?.services.find((sv) => sv.id === serviceId);
          const employee = salon?.employees.find((e) => e.id === employeeId);
          const user = getCurrentUser();

          const newBooking: MockBooking = {
            id: 'bk-' + Date.now(),
            salonId: salonId || 'salon-1',
            serviceId: serviceId || 'srv-1',
            employeeId,
            customerId: user?.id || 'usr-guest',
            startTime: startTimeStr || new Date().toISOString(),
            status: paymentMethod === 'CASH' ? 'PENDING' : 'CONFIRMED',
            paymentMethod: paymentMethod || 'CASH',
            paymentStatus: paymentMethod === 'CASH' ? 'UNPAID' : 'PAID',
            totalPrice: totalPrice || service?.price || 500,
            notes,
            salon: {
              id: salon?.id || 'salon-1',
              name: salon?.name || 'Luxury Salon',
              address: salon?.address || 'Addis Ababa',
              slug: salon?.slug || 'saba-luxury-salon',
              bannerUrl: salon?.bannerUrl,
            },
            service: {
              id: service?.id || 'srv-1',
              name: service?.name || 'Beauty Treatment',
              duration: service?.duration || 60,
              price: service?.price || 500,
            },
            employee: employee
              ? {
                  id: employee.id,
                  user: {
                    name: employee.user.name,
                    email: employee.user.email,
                  },
                }
              : undefined,
            customer: {
              id: user?.id || 'usr-guest',
              name: user?.name || 'Guest Client',
              email: user?.email || 'guest@example.com',
              phone: user?.phone || '+251 900 000000',
            },
          };

          bookings.unshift(newBooking);
          saveStoredBookings(bookings);
          return jsonResponse({ message: 'Appointment booked successfully', booking: newBooking }, 201);
        }
      }

      if (path.startsWith('/api/bookings/')) {
        const id = path.replace('/api/bookings/', '');
        const bookings = getStoredBookings();
        const index = bookings.findIndex((b) => b.id === id);

        if (index === -1) {
          return jsonResponse({ error: 'Booking not found' }, 404);
        }

        if (method === 'PATCH') {
          const updated = { ...bookings[index], ...body };
          if (body.startTimeStr) {
            updated.startTime = body.startTimeStr;
          }
          bookings[index] = updated;
          saveStoredBookings(bookings);
          return jsonResponse({ message: 'Booking updated', booking: updated });
        }

        return jsonResponse(bookings[index]);
      }

      // 4. AI Consultant
      if (path === '/api/ai') {
        const { mode, gender, hairType, faceShape, message, history } = body || {};
        if (mode === 'consultation') {
          const recommendation = getAIRecommendations(gender || 'women', hairType || 'curly', faceShape || 'oval');
          return jsonResponse({ recommendation });
        }

        // Chat mode
        const reply = beautyChatbotResponse(message || '', history || []);
        return jsonResponse({ reply });
      }

      // 5. Dashboard routes
      if (path === '/api/dashboard/coupons') {
        if (method === 'GET') {
          const coupons = [
            { id: 'cp-1', code: 'BEAUTY20', discountPercent: 20, isActive: true, expiryDate: '2027-12-31' },
            { id: 'cp-2', code: 'ETHIO10', discountPercent: 10, isActive: true, expiryDate: '2027-12-31' },
          ];
          return jsonResponse(coupons);
        }
        if (method === 'POST') {
          return jsonResponse({ message: 'Coupon created successfully', coupon: body }, 201);
        }
      }

      if (path === '/api/dashboard/analytics/revenue') {
        return jsonResponse({
          totalRevenue: 34500,
          monthlyRevenue: 12800,
          completedBookings: 42,
          activeClients: 38,
        });
      }

      if (path === '/api/dashboard/employees') {
        const salons = getStoredSalons();
        const allEmployees = salons.flatMap((s) => s.employees);
        return jsonResponse(allEmployees);
      }

      if (path === '/api/dashboard/salons') {
        const salons = getStoredSalons();
        return jsonResponse(salons);
      }

      if (path.startsWith('/api/profile/')) {
        return jsonResponse({ message: 'Profile updated successfully' });
      }

      // Fallback
      return jsonResponse({ message: 'Mock API call handled successfully' });
    } catch (err: any) {
      console.error('Mock API handler error:', err);
      return jsonResponse({ error: err?.message || 'Mock API Error' }, 500);
    }
  };
}
