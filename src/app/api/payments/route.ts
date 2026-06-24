// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const paymentSchema = z.object({
  taxReturnId: z.string(),
  channel:     z.enum(["bank_transfer", "remita", "paystack"]),
  bankName:    z.string().optional(),
  reference:   z.string().min(2),
});

// Taxpayer submits a payment reference for an approved return
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = paymentSchema.parse(body);
    const userId = session.user.id;

    const taxReturn = await prisma.taxReturn.findUnique({
      where: { id: data.taxReturnId },
      include: { payment: true },
    });

    if (!taxReturn || taxReturn.userId !== userId) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }
    if (taxReturn.status !== "APPROVED") {
      return NextResponse.json({ error: "Return is not yet approved for payment" }, { status: 400 });
    }
    if (taxReturn.payment?.status === "PAID") {
      return NextResponse.json({ error: "This return has already been paid" }, { status: 400 });
    }

    const existingRef = await prisma.payment.findUnique({ where: { reference: data.reference } });
    if (existingRef) {
      return NextResponse.json({ error: "This reference has already been used" }, { status: 409 });
    }

    const payment = taxReturn.payment
      ? await prisma.payment.update({
          where: { id: taxReturn.payment.id },
          data: {
            channel:   data.channel,
            bankName:  data.bankName,
            reference: data.reference,
            status:    "PROCESSING",
          },
        })
      : await prisma.payment.create({
          data: {
            userId,
            taxReturnId: data.taxReturnId,
            amount:      taxReturn.taxDue,
            channel:     data.channel,
            bankName:    data.bankName,
            reference:   data.reference,
            status:      "PROCESSING",
          },
        });

    await prisma.notification.create({
      data: {
        userId,
        title:   "Payment Submitted",
        message: `Your payment reference (${data.reference}) for ${taxReturn.taxYear} has been received and is pending confirmation.`,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
