# Taxign
### Web-Based Tax Assessment System

A full-stack web application for online tax assessment, filing, payment, and certificate issuance — built with **Next.js 14**, **Prisma**, **Neon PostgreSQL**, and **NextAuth.js**.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js 14 (App Router) + Tailwind CSS |
| Backend    | Next.js API Routes                |
| Auth       | NextAuth.js v4 (JWT + credentials)|
| ORM        | Prisma                            |
| Database   | Neon PostgreSQL (serverless)      |
| Deployment | Vercel                            |

---

## Features

### Taxpayer Portal
- Register with auto-generated TIN
- File Personal Income Tax, Company Tax, VAT, WHT, CGT returns
- Auto-computes tax using Nigeria PITA 2024 bands
- **Payments**: submit a bank transfer reference (or Remita/Paystack reference) against an approved return; admin confirms before it's marked paid
- **E-Invoicing**: create invoices for individual transactions/sales, with VAT (7.5%) computed automatically on line items; download/print as a standalone invoice document
- Download Tax Clearance Certificate (PDF)
- Filing history with status tracking
- Notifications for return updates

### Admin Console
- Dashboard with revenue stats
- Review, approve, query, or reject submissions
- **Confirm or reject submitted payment references** before a return is marked paid
- Assessment override (manual adjustment)
- **View all e-invoices** issued across taxpayers, with VAT totals
- Taxpayer registry
- Revenue reports by year and tax type
- Full audit log

---

## E-Invoicing — how it works

E-Invoicing is separate from the annual Tax Clearance Certificate flow. A taxpayer (typically VAT-registered) can:

1. Go to **Invoices → New Invoice**
2. Enter customer details and one or more line items (description, quantity, unit price)
3. VAT is computed automatically at **7.5%** of the subtotal
4. Save as a **Draft** or **Issue** it immediately
5. Download/print the invoice as a standalone HTML document (`/api/invoices/[id]/download`)

Admins can see every invoice issued across all taxpayers under **Admin → Invoices**, along with total VAT collected — useful for VAT compliance reporting.

This module uses its own `Invoice` / `InvoiceItem` models and does not affect the existing `TaxReturn` → `Certificate` flow.

---

## Payments — how it works

The payment flow is intentionally simple since there's no live payment gateway wired in:

1. Once a return is **Approved**, it shows up under **Payments → Outstanding**
2. The taxpayer clicks **Pay Now**, sees bank account details, makes the transfer outside the app, then submits their **teller number / transaction reference** (also supports Remita RRR or Paystack reference as method labels)
3. This creates a `Payment` record with status `PROCESSING`
4. An admin reviews it under **Admin → Payments** and either **Confirms** (→ `PAID`) or **Rejects** (→ `FAILED`, taxpayer can resubmit)

This mirrors how many real Nigerian tax/utility portals work in practice (manual reconciliation against bank tellers) and avoids needing real payment gateway credentials for a student project.

---

## Setup Instructions

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd taxign
npm install
```

### 2. Set up Neon PostgreSQL

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project → copy the **connection string**
3. It looks like: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`

> **Note on connection strings:** Neon gives you a **pooled** URL (hostname ends in `-pooler`) for runtime queries, and a **direct** URL (no `-pooler`) for Prisma migrations. Use both — see below.

### 3. Configure environment variables

```bash
cp .env.example .env
```
;
Edit `.env`:
```env
# Pooled connection — used by the app at runtime
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true&connect_timeout=15"

# Direct connection — used by Prisma for db push / migrations
DIRECT_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=15"

NEXTAUTH_SECRET="generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Push database schema

```bash
npm run db:generate
npm run db:push
```

If you see `Can't reach database server`, your Neon project has auto-suspended (free tier). Open the Neon dashboard → SQL Editor (this wakes it instantly) → re-run the command.

> **Connection pool timeouts in dev:** Next.js dev mode can open more Prisma Client connections than Neon's free-tier pooler allows by default (limit: 5), especially after several hot-reloads. If you see `Timed out fetching a new connection from the connection pool`, make sure `connection_limit=10&pool_timeout=20` is appended to your pooled `DATABASE_URL` (already included in `.env.example` above).

### 5. Seed the database (demo data + admin account)

```bash
npm run db:seed
```

This creates:
- **Admin:** `admin@taxign.app` / `admin123456`
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
   - `DATABASE_URL` → Neon pooled connection string
   - `DIRECT_URL` → Neon direct connection string
   - `NEXTAUTH_SECRET` → random secret
   - `NEXTAUTH_URL` → your Vercel deployment URL (e.g. `https://taxign.vercel.app`)
4. Deploy — zero config needed

---

## Project Structure

```
taxign/
├── prisma/
│   ├── schema.prisma          # DB models (User, TaxReturn, Payment, Certificate, Invoice, AuditLog)
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
│   │   │   │   └── [returnId]/   # Bank transfer checkout for one return
│   │   │   ├── invoices/
│   │   │   │   └── new/          # Create invoice with line items + VAT
│   │   │   ├── certificate/
│   │   │   └── history/
│   │   ├── (admin)/           # Admin console (admin-only), routes under /admin/*
│   │   │   └── admin/
│   │   │       ├── dashboard/
│   │   │       ├── taxpayers/
│   │   │       ├── submissions/
│   │   │       ├── payments/      # Confirm/reject submitted payment references
│   │   │       ├── assessment/
│   │   │       ├── invoices/       # Oversight of all issued invoices
│   │   │       ├── reports/
│   │   │       └── audit/
│   │   └── api/
│   │       ├── auth/          # NextAuth + Register
│   │       ├── tax-returns/   # File, save, submit returns
│   │       ├── payments/      # Taxpayer submits a payment reference
│   │       ├── invoices/      # Create/list invoices, [id]/download for print view
│   │       ├── admin/
│   │       │   ├── submissions/  # Review returns
│   │       │   ├── payments/     # Confirm/reject payments
│   │       │   ├── invoices/     # List all invoices
│   │       │   └── assessment/   # Override tax amounts
│   │       └── certificate/      # PDF download
│   ├── components/
│   │   ├── ui/               # Button, Input, Select, Card, Badge
│   │   ├── layout/            # TaxpayerNav, AdminNav
│   │   └── providers.tsx      # SessionProvider wrapper (client)
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── auth.ts           # NextAuth config
│   │   ├── tax-calculator.ts # PITA tax computation + invoice/VAT helpers
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

Taxign was developed as a final year Computer Science project demonstrating:
- Full-stack web development (Next.js, REST APIs)
- Relational database design (PostgreSQL/Prisma)
- Authentication & authorization (JWT, role-based access)
- Nigerian tax computation logic (PITA bands)
- Cloud deployment (Vercel + Neon)
