// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateTIN } from "@/lib/tax-calculator";
import { z } from "zod";

const registerSchema = z.object({
  firstName:  z.string().min(2),
  lastName:   z.string().min(2),
  email:      z.string().email(),
  phone:      z.string().min(10),
  password:   z.string().min(8),
  state:      z.string().min(2),
  lga:        z.string().min(2),
  address:    z.string().min(5),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(data.password, 12);
    const tin = generateTIN();

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashed,
        tin,
        isVerified: true, // auto-verify for demo; add email flow later
      },
    });

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to the Tax Assessment Portal",
        message: `Your TIN is ${tin}. You can now file your tax returns.`,
      },
    });

    return NextResponse.json(
      { message: "Registration successful", tin },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
