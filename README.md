# Beuty

Beuty is a salon booking SaaS built with Next.js, Prisma, PostgreSQL, and JWT authentication. It includes customer booking flows, salon owner and admin dashboards, and a smart AI beauty consultation experience.

## Key Features

- AI Beauty Consultant with chat and consultation modes
- Salon search and booking engine with employee availability
- Telebirr / CBE payments with signature verification
- Role-based dashboards for customers, salon owners, employees, and admins
- Secure file uploads with optional Cloudinary fallback
- Optional email/SMS integrations via SMTP/Twilio
- Docker Compose support for local development
- CI workflow and test coverage for release readiness

## Getting Started

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI Feature

The AI assistant is available via `/api/ai` and supports two modes:

- `chat`: send free-form questions and receive salon advice
- `consultation`: submit `gender`, `hairType`, and `faceShape` for a style recommendation

Example request bodies:

```json
{ "mode": "chat", "message": "What should I do for dry hair?" }
```

```json
{
  "mode": "consultation",
  "gender": "women",
  "hairType": "coily",
  "faceShape": "round"
}
```

## Security

- The AI endpoint validates and sanitizes incoming payloads
- Input length is limited to prevent abusive requests
- Role-based auth protects dashboard and profile operations
- Sensitive provider keys remain in environment variables only

## Testing

Run the test suite:

```bash
npm test
```

Generate coverage:

```bash
npm run coverage
```

Current test files:

- `tests/payments.integration.test.ts`
- `tests/ai.integration.test.ts`

## CI / CD

A GitHub Actions workflow is configured at `.github/workflows/ci.yml`.
It runs on push and pull request events and performs:

- checkout
- Node.js setup
- install dependencies with `npm ci`
- lint with `npm run lint`
- run tests with `npm test`

## Environment Variables

Create a `.env` file with the following values as needed:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/beauty_booking?schema=public
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret
OPENAI_API_KEY=your_openai_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=your_email_password
TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_token
TWILIO_FROM=+251900000000
TELEBIRR_API_URL=https://api.telebirr.example
TELEBIRR_API_KEY=your_telebirr_api_key
TELEBIRR_API_SECRET=your_telebirr_api_secret
CBE_API_URL=https://api.cbe.example
CBE_API_KEY=your_cbe_api_key
CBE_API_SECRET=your_cbe_api_secret
CBE_WEBHOOK_SECRET=your_cbe_webhook_secret
```

## Notes

This repo is set up for production-ready development with optional external integrations. If a provider is not configured, the system will safely fall back to the built-in application flows.
