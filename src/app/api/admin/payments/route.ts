// src/app/api/admin/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PROCESSING";

  const payments = await prisma.payment.findMany({
    where: status === "ALL" ? {} : { status: status as any },
    include: {
      user: { select: { firstName: true, lastName: true, tin: true } },
      taxReturn: { select: { taxYear: true, taxType: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ payments });
}

const confirmSchema = z.object({
  paymentId: z.string(),
  action:    z.enum(["CONFIRM", "REJECT"]),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { paymentId, action } = confirmSchema.parse(body);

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: action === "CONFIRM" ? "PAID" : "FAILED",
      paidAt: action === "CONFIRM" ? new Date() : null,
    },
    include: { taxReturn: true },
  });

  await prisma.notification.create({
    data: {
      userId:  payment.userId,
      title:   action === "CONFIRM" ? "Payment Confirmed" : "Payment Rejected",
      message:
        action === "CONFIRM"
          ? `Your payment of ${payment.amount} for ${payment.taxReturn.taxYear} has been confirmed.`
          : `Your payment reference for ${payment.taxReturn.taxYear} could not be verified. Please re-submit.`,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId:   payment.userId,
      adminId:  session.user.id,
      action:   `PAYMENT_${action}`,
      entity:   "Payment",
      entityId: paymentId,
    },
  });

  return NextResponse.json(payment);
}
