// src/app/api/admin/submissions/route.ts
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
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where = status && status !== "ALL" ? { status: status as any } : {};

  const [submissions, total] = await Promise.all([
    prisma.taxReturn.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, tin: true, email: true } } },
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.taxReturn.count({ where }),
  ]);

  return NextResponse.json({ submissions, total, pages: Math.ceil(total / limit) });
}

const reviewSchema = z.object({
  returnId:  z.string(),
  action:    z.enum(["APPROVE", "QUERY", "REJECT"]),
  remarks:   z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { returnId, action, remarks } = reviewSchema.parse(body);

  const statusMap = { APPROVE: "APPROVED", QUERY: "QUERIED", REJECT: "REJECTED" };

  const updated = await prisma.taxReturn.update({
    where: { id: returnId },
    data: {
      status:       statusMap[action] as any,
      adminRemarks: remarks,
      reviewedBy:   session.user.id,
      reviewedAt:   new Date(),
    },
  });

  // Notify taxpayer
  await prisma.notification.create({
    data: {
      userId:  updated.userId,
      title:   `Tax Return ${statusMap[action]}`,
      message: remarks
        ? `Your ${updated.taxYear} return has been ${statusMap[action].toLowerCase()}. Note: ${remarks}`
        : `Your ${updated.taxYear} return has been ${statusMap[action].toLowerCase()}.`,
    },
  });

  // Issue certificate on approval
  if (action === "APPROVE") {
    const { generateCertificateNo } = await import("@/lib/tax-calculator");
    await prisma.certificate.upsert({
      where: { taxReturnId: returnId },
      update: {},
      create: {
        taxReturnId:   returnId,
        certificateNo: generateCertificateNo(updated.taxYear),
        validUntil:    new Date(updated.taxYear + 1, 11, 31),
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId:   updated.userId,
      adminId:  session.user.id,
      action:   `REVIEW_${action}`,
      entity:   "TaxReturn",
      entityId: returnId,
    },
  });

  return NextResponse.json(updated);
}
