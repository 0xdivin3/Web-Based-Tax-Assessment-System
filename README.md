# Web-Based Tax Assessment System
### Modeled after the Federal Inland Revenue Service (FIRS), Nigeria

A full-stack web application for online tax assessment, filing, payment, and certificate issuance — built with **Next.js 14**, **Prisma**, **Neon PostgreSQL**, and **NextAuth.js**.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js 14 (App Router) + Tailwind CSS |
| Backend    | Next.js API Routes                |
| Auth       | NextAuth.js v5 (JWT + credentials)|
| ORM        | Prisma                            |
| Database   | Neon PostgreSQL (serverless)      |
| Deployment | Vercel                            |

---

## Features

### Taxpayer Portal
- Register with auto-generated TIN
- File Personal Income Tax, Company Tax, VAT, WHT, CGT returns
- Auto-computes tax using Nigeria PITA 2024 bands
- View payment status and pay online
- Download Tax Clearance Certificate (PDF)
- Filing history with status tracking
- Notifications for return updates

### Admin Console
- Dashboard with revenue stats
- Review, approve, query, or reject submissions
- Assessment override (manual adjustment)
- Taxpayer registry
- Revenue reports by year and tax type
- Full audit log

---

## Setup Instructions

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd tax-assessment-system
npm install
```

### 2. Set up Neon PostgreSQL

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project → copy the **connection string**
3. It looks like: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://your-neon-connection-string"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Push database schema

```bash
npm run db:generate
npm run db:push
```

### 5. Seed the database (demo data + admin account)

```bash
npm run db:seed
```

This creates:
- **Admin:** `admin@taxsystem.gov.ng` / `admin123456`
- **Demo taxpayer:** `john.doe@example.com` / `taxpayer123`

### 6. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploying to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add environment variables:
   - `DATABASE_URL` → your Neon connection string
   - `NEXTAUTH_SECRET` → random secret
   - `NEXTAUTH_URL` → your Vercel deployment URL (e.g. `https://tax-system.vercel.app`)
4. Deploy — zero config needed

---

## Project Structure

```
tax-assessment-system/
├── prisma/
│   ├── schema.prisma          # DB models (User, TaxReturn, Payment, Certificate, AuditLog)
│   └── seed.ts                # Demo data seed
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login & Register pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (taxpayer)/        # Taxpayer portal (protected)
│   │   │   ├── dashboard/
│   │   │   ├── file-return/
│   │   │   ├── calculator/
│   │   │   ├── payment/
│   │   │   ├── certificate/
│   │   │   └── history/
│   │   ├── (admin)/           # Admin console (admin-only)
│   │   │   ├── dashboard/
│   │   │   ├── taxpayers/
│   │   │   ├── submissions/
│   │   │   ├── assessment/
│   │   │   ├── reports/
│   │   │   └── audit/
│   │   └── api/
│   │       ├── auth/          # NextAuth + Register
│   │       ├── tax-returns/   # File, save, submit returns
│   │       ├── admin/
│   │       │   ├── submissions/  # Review returns
│   │       │   └── assessment/   # Override tax amounts
│   │       └── certificate/      # PDF download
│   ├── components/
│   │   ├── ui/               # Button, Input, Select, Card, Badge
│   │   └── layout/           # TaxpayerNav, AdminNav
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── auth.ts           # NextAuth config
│   │   ├── tax-calculator.ts # PITA tax computation logic
│   │   └── utils.ts          # Helpers, formatters
│   ├── middleware.ts          # Route protection & role-based redirect
│   └── types/index.ts        # TypeScript types
```

---

## Nigeria Tax Bands (2024, Personal Income)

| Band              | Rate |
|-------------------|------|
| First ₦300,000    | 7%   |
| Next ₦300,000     | 11%  |
| Next ₦500,000     | 15%  |
| Next ₦500,000     | 19%  |
| Next ₦1,600,000   | 21%  |
| Above ₦3,200,000  | 24%  |

**Reliefs deducted before computation:**
- Personal Relief: ₦200,000 + 1% of gross income
- Pension (Employee): 8% of gross income
- Other deductions as declared

---

## Academic Project Note

This system was developed as a final year Computer Science project demonstrating:
- Full-stack web development (Next.js, REST APIs)
- Relational database design (PostgreSQL/Prisma)
- Authentication & authorization (JWT, role-based access)
- Nigerian tax law implementation (PITA, FIRS framework)
- Cloud deployment (Vercel + Neon)
