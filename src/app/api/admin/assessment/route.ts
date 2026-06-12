// src/app/api/admin/assessment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const overrideSchema = z.object({
  returnId:     z.string(),
  taxLiability: z.number().min(0),
  remarks:      z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { returnId, taxLiability, remarks } = overrideSchema.parse(body);

  const updated = await prisma.taxReturn.update({
    where: { id: returnId },
    data: {
      taxLiability,
      taxDue:       taxLiability,
      status:       "UNDER_REVIEW",
      adminRemarks: remarks,
      reviewedBy:   session.user.id,
      reviewedAt:   new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId:   updated.userId,
      adminId:  session.user.id,
      action:   "ASSESSMENT_OVERRIDE",
      entity:   "TaxReturn",
      entityId: returnId,
      after:    { taxLiability, remarks },
    },
  });

  await prisma.notification.create({
    data: {
      userId:  updated.userId,
      title:   "Assessment Updated",
      message: `Your ${updated.taxYear} tax assessment has been reviewed and updated. ${remarks ? `Note: ${remarks}` : ""}`,
    },
  });

  return NextResponse.json(updated);
}
