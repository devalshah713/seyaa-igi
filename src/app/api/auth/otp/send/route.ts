import { NextResponse } from "next/server";
import { issueOtp } from "@/lib/otp";
import { sendMail } from "@/lib/mailer";
import { otpSendSchema } from "@/lib/validators";

// POST /api/auth/otp/send — (re)send an email OTP.
export async function POST(req: Request) {
  const parsed = otpSendSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { email, purpose } = parsed.data;

  const code = await issueOtp(email, purpose);
  await sendMail({
    to: email,
    subject: "Your Seyaa Solitaire verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
  });

  return NextResponse.json({ ok: true, ...(process.env.SMTP_HOST ? {} : { devOtp: code }) });
}
