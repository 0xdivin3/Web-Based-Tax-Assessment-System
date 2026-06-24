// prisma/seed.ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@taxign.app" },
    update: {},
    create: {
      email: "admin@taxign.app",
      password: adminPassword,
      firstName: "System",
      lastName: "Administrator",
      role: Role.ADMIN,
      isVerified: true,
      tin: "ADMIN-001",
    },
  });

  // Create demo taxpayer
  const taxpayerPassword = await bcrypt.hash("taxpayer123", 12);
  const taxpayer = await prisma.user.upsert({
    where: { email: "john.doe@example.com" },
    update: {},
    create: {
      email: "john.doe@example.com",
      password: taxpayerPassword,
      firstName: "John",
      lastName: "Doe",
      role: Role.TAXPAYER,
      isVerified: true,
      tin: "1234567890",
      phone: "08012345678",
      address: "12 Broad Street",
      state: "Lagos",
      lga: "Lagos Island",
    },
  });

  // Create a sample tax return
  await prisma.taxReturn.upsert({
    where: {
      userId_taxYear_taxType: {
        userId: taxpayer.id,
        taxYear: 2023,
        taxType: "PERSONAL_INCOME",
      },
    },
    update: {},
    create: {
      userId: taxpayer.id,
      taxYear: 2023,
      taxType: "PERSONAL_INCOME",
      status: "APPROVED",
      grossIncome: 3600000,
      otherIncome: 0,
      totalIncome: 3600000,
      personalRelief: 200000,
      pensionRelief: 288000,
      otherDeductions: 0,
      totalDeductions: 488000,
      taxableIncome: 3112000,
      taxLiability: 512400,
      taxPaid: 512400,
      taxDue: 0,
      submittedAt: new Date("2024-01-15"),
      reviewedAt: new Date("2024-01-20"),
      reviewedBy: admin.id,
    },
  });

  // Sample invoice for the demo taxpayer
  const sampleLines = [
    { description: "Web development services", quantity: 1, unitPrice: 250000 },
    { description: "Hosting setup (1 year)",    quantity: 1, unitPrice: 60000 },
  ];
  const subtotal = sampleLines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const vatRate = 0.075;
  const vatAmount = subtotal * vatRate;

  await prisma.invoice.upsert({
    where: { invoiceNo: "INV-2024-SAMPLE" },
    update: {},
    create: {
      userId: taxpayer.id,
      invoiceNo: "INV-2024-SAMPLE",
      customerName: "Bright Star Logistics Ltd",
      customerEmail: "billing@brightstarlogistics.com",
      subtotal,
      vatRate,
      vatAmount,
      total: subtotal + vatAmount,
      status: "ISSUED",
      items: {
        create: sampleLines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: l.quantity * l.unitPrice,
        })),
      },
    },
  });

  console.log("Seed complete.");
  console.log("Admin:    admin@taxign.app / admin123456");
  console.log("Taxpayer: john.doe@example.com  / taxpayer123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
