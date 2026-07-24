import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";

const schema = z.object({ decision: z.enum(["APPROVE", "REJECT"]) });

// POST /api/admin/customers/[id]/decision — approve or reject a trade application (KYC).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const approve = parsed.data.decision === "APPROVE";
  const user = await db.user.update({
    where: { id },
    data: {
      status: approve ? "APPROVED" : "REJECTED",
      kycDocuments: { updateMany: { where: {}, data: { status: approve ? "APPROVED" : "REJECTED" } } },
    },
  });

  await sendMail({
    to: user.email,
    subject: approve ? "Your Seyaa Solitaire trade account is approved" : "Update on your Seyaa Solitaire application",
    text: approve
      ? `Welcome, ${user.firstName}. Your KYC is approved. Set your password using the "Forgot password" link on the sign-in page to start trading.`
      : `Hi ${user.firstName}, unfortunately we could not approve your application at this time. Please contact us if you believe this is an error.`,
  });

  // TODO: on approve, trigger a set-password email (password-reset flow) rather than relying on "forgot password".
  return NextResponse.json({ ok: true, status: user.status });
}
