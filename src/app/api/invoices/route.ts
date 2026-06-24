// src/app/api/invoices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeInvoice, generateInvoiceNo, VAT_RATE } from "@/lib/tax-calculator";
import { z } from "zod";

const lineSchema = z.object({
  description: z.string().min(1),
  quantity:    z.number().positive(),
  unitPrice:   z.number().min(0),
});

const invoiceSchema = z.object({
  customerName:  z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerTin:   z.string().optional(),
  dueDate:       z.string().optional(),
  notes:         z.string().optional(),
  items:         z.array(lineSchema).min(1),
  action:        z.enum(["DRAFT", "ISSUE"]).default("ISSUE"),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = invoiceSchema.parse(body);

    const computed = computeInvoice(data.items, VAT_RATE);

    const invoice = await prisma.invoice.create({
      data: {
        userId:        session.user.id,
        invoiceNo:     generateInvoiceNo(),
        customerName:  data.customerName,
        customerEmail: data.customerEmail || undefined,
        customerTin:   data.customerTin || undefined,
        subtotal:      computed.subtotal,
        vatRate:       computed.vatRate,
        vatAmount:     computed.vatAmount,
        total:         computed.total,
        status:        data.action === "ISSUE" ? "ISSUED" : "DRAFT",
        dueDate:       data.dueDate ? new Date(data.dueDate) : undefined,
        notes:         data.notes,
        items: {
          create: computed.items.map((i) => ({
            description: i.description,
            quantity:    i.quantity,
            unitPrice:   i.unitPrice,
            lineTotal:   i.lineTotal,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
