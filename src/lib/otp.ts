import bcrypt from "bcryptjs";
import { db } from "./db";
import type { OtpPurpose } from "@prisma/client";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Generate, store (hashed) and return a 6-digit OTP for an email. */
export async function issueOtp(email: string, purpose: OtpPurpose): Promise<string> {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);
  await db.otpCode.create({
    data: { email, purpose, codeHash, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  return code;
}

/** Verify a submitted code; consumes the latest matching OTP on success. */
export async function verifyOtp(email: string, purpose: OtpPurpose, code: string): Promise<boolean> {
  const otp = await db.otpCode.findFirst({
    where: { email, purpose, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return false;
  const ok = await bcrypt.compare(code, otp.codeHash);
  if (ok) await db.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });
  return ok;
}
