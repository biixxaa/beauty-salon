# Standalone Backend Service (Beuty SaaS)

This directory contains the standalone Node.js & Express REST API backend for the Beuty salon SaaS application.

## Structure

```
backend/
├── src/
│   ├── data/
│   │   └── db.ts                  # In-memory database store seeded with demo users, salons, bookings
│   ├── middleware/
│   │   └── auth.middleware.ts     # JWT session verification & role-based route protection
│   ├── routes/
│   │   ├── auth.routes.ts         # /api/auth (login, register, me, logout)
│   │   ├── bookings.routes.ts     # /api/bookings (list, create, reschedule, cancel & refund)
│   │   ├── salons.routes.ts       # /api/salons (search, filter, register, details)
│   │   ├── dashboard.routes.ts    # /api/dashboard (coupons, admin operations, staff)
│   │   ├── profile.routes.ts      # /api/profile (employee profile & password changes)
│   │   └── ai.routes.ts           # /api/ai (smart AI beauty consultant & chat)
│   ├── types/
│   │   └── index.ts               # Shared TypeScript schemas & definitions
│   └── server.ts                  # Express entry point
├── package.json
├── tsconfig.json
└── .env
```

## Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The server will start at: `http://localhost:5000`

### 3. Build & Run in Production

```bash
npm run build
npm start
```

## Endpoints Summary

- **Health**: `GET /health` or `GET /api/health`
- **Auth**: `GET /api/auth/me`, `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`
- **Bookings**: `GET /api/bookings?role=CUSTOMER`, `POST /api/bookings`, `GET /api/bookings/:id`, `PATCH /api/bookings/:id` (reschedule or cancel with refund)
- **Salons**: `GET /api/salons`, `POST /api/salons`, `GET /api/salons/:slug`
- **Dashboard**: `GET /api/dashboard/coupons`, `POST /api/dashboard/coupons`, `GET /api/dashboard/employees`, `POST /api/dashboard/create-salon-owner`
- **Stylist Profile**: `GET /api/profile/employee`, `PUT /api/profile/employee`, `POST /api/profile/change-password`
- **AI Consultant**: `POST /api/ai`

