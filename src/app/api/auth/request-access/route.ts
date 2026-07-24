import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issueOtp } from "@/lib/otp";
import { sendMail, adminEmail } from "@/lib/mailer";
import { requestAccessSchema } from "@/lib/validators";

// POST /api/auth/request-access — submit a trade-account KYC application.
export async function POST(req: Request) {
  const parsed = requestAccessSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await db.user.findUnique({ where: { email: d.email } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  const user = await db.user.create({
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      mobile: d.mobile,
      companyName: d.companyName,
      gstNumber: d.gstNumber,
      status: "PENDING",
      kycDocuments: {
        create: [
          { type: "AADHAAR", fileUrl: d.aadhaarUrl },
          ...(d.gstUrl ? [{ type: "GST" as const, fileUrl: d.gstUrl }] : []),
        ],
      },
    },
  });

  // Email OTP to verify the applicant's address.
  const code = await issueOtp(d.email, "SIGNUP");
  await sendMail({
    to: d.email,
    subject: "Verify your email — Seyaa Solitaire",
    text: `Your Seyaa Solitaire verification code is ${code}. It expires in 10 minutes.`,
  });

  // Notify admin of the new KYC application to review.
  await sendMail({
    to: adminEmail(),
    subject: `New trade application — ${d.companyName || d.firstName + " " + d.lastName}`,
    text: `New Request Access submission:\nName: ${d.firstName} ${d.lastName}\nEmail: ${d.email}\nMobile: ${d.mobile}\nCompany: ${d.companyName || "-"}\nGST: ${d.gstNumber || "-"}\nAadhaar: ${d.aadhaarUrl}\nGST cert: ${d.gstUrl || "-"}\n\nReview in Admin → Customers.`,
  });

  return NextResponse.json({
    ok: true,
    userId: user.id,
    message: "Application received. Verify your email with the OTP we sent.",
    ...(process.env.SMTP_HOST ? {} : { devOtp: code }),
  });
}
