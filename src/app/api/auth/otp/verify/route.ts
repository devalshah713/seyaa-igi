import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { otpVerifySchema } from "@/lib/validators";

// POST /api/auth/otp/verify — verify an email OTP and mark the user verified.
export async function POST(req: Request) {
  const parsed = otpVerifySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { email, purpose, code } = parsed.data;

  const ok = await verifyOtp(email, purpose, code);
  if (!ok) return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });

  await db.user.updateMany({ where: { email }, data: { emailVerified: true } });
  return NextResponse.json({ ok: true, message: "Email verified." });
}
