// src/app/api/tax-returns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTax } from "@/lib/tax-calculator";
import { z } from "zod";

const returnSchema = z.object({
  taxYear:          z.number().int().min(2000).max(2100),
  taxType:          z.enum(["PERSONAL_INCOME","COMPANY_INCOME","VAT","WITHHOLDING","CAPITAL_GAINS"]),
  grossIncome:      z.number().min(0),
  otherIncome:      z.number().min(0).default(0),
  otherDeductions:  z.number().min(0).default(0),
  action:           z.enum(["SAVE_DRAFT", "SUBMIT"]).default("SAVE_DRAFT"),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const returns = await prisma.taxReturn.findMany({
    where: { userId },
    orderBy: { taxYear: "desc" },
    include: { payment: true, certificate: true },
  });

  return NextResponse.json(returns);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = returnSchema.parse(body);
    const userId = session.user.id;

    const computed = computeTax({
      grossIncome:     data.grossIncome,
      otherIncome:     data.otherIncome,
      otherDeductions: data.otherDeductions,
    });

    const existing = await prisma.taxReturn.findUnique({
      where: { userId_taxYear_taxType: { userId, taxYear: data.taxYear, taxType: data.taxType } },
    });

    const payload = {
      grossIncome:     computed.grossIncome,
      otherIncome:     computed.otherIncome,
      totalIncome:     computed.totalIncome,
      personalRelief:  computed.personalRelief,
      pensionRelief:   computed.pensionRelief,
      otherDeductions: computed.otherDeductions,
      totalDeductions: computed.totalDeductions,
      taxableIncome:   computed.taxableIncome,
      taxLiability:    computed.taxLiability,
      taxDue:          computed.taxLiability,
      status:          data.action === "SUBMIT" ? "SUBMITTED" : "DRAFT",
      submittedAt:     data.action === "SUBMIT" ? new Date() : null,
    } as const;

    const taxReturn = existing
      ? await prisma.taxReturn.update({ where: { id: existing.id }, data: payload })
      : await prisma.taxReturn.create({
          data: { userId, taxYear: data.taxYear, taxType: data.taxType, ...payload },
        });

    if (data.action === "SUBMIT") {
      await prisma.notification.create({
        data: {
          userId,
          title: "Tax Return Submitted",
          message: `Your ${data.taxYear} return has been submitted and is under review.`,
        },
      });
    }

    return NextResponse.json(taxReturn);
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
