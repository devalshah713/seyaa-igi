import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";

const schema = z.object({ decision: z.enum(["APPROVE", "DECLINE"]) });

// POST /api/admin/requests/[id]/decision — approve/decline a Memo or Hold request.
// Approving transitions the stone to MEMO/HOLD; declining leaves it AVAILABLE.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const approve = parsed.data.decision === "APPROVE";

  const request = await db.tradeRequest.findUnique({ where: { id }, include: { stone: true, user: true } });
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  await db.$transaction(async (tx) => {
    await tx.tradeRequest.update({
      where: { id },
      data: { status: approve ? "APPROVED" : "DECLINED" },
    });
    if (approve) {
      await tx.stone.update({
        where: { id: request.stoneId },
        data: { status: request.kind === "MEMO" ? "MEMO" : "HOLD" },
      });
    }
  });

  await sendMail({
    to: request.user.email,
    subject: `Your ${request.kind.toLowerCase()} request for ${request.stone.ref} was ${approve ? "approved" : "declined"}`,
    text: approve
      ? `Good news — your ${request.kind.toLowerCase()} for ${request.stone.ref} (${request.stone.shape} ${request.stone.carat}ct) is approved.`
      : `Your ${request.kind.toLowerCase()} request for ${request.stone.ref} was declined. The stone remains available.`,
  });

  return NextResponse.json({ ok: true, decision: parsed.data.decision });
}
