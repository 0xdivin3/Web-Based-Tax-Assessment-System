// src/app/api/admin/invoices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const invoices = await prisma.invoice.findMany({
    where: status && status !== "ALL" ? { status: status as any } : {},
    include: {
      user: { select: { firstName: true, lastName: true, tin: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invoices });
}
