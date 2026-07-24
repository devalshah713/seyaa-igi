import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendMail, adminEmail } from "@/lib/mailer";
import { tradeRequestSchema } from "@/lib/validators";

// GET /api/requests — memo/hold requests (own for customers, all for admin/sales).
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const where = session.role === "CUSTOMER" ? { userId: session.id } : {};
  const requests = await db.tradeRequest.findMany({
    where,
    include: { stone: true, user: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ requests });
}

// POST /api/requests — create a Memo (consignment) or Hold (reservation) request.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = tradeRequestSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;

  const now = Date.now();
  const expiresAt =
    d.kind === "MEMO" && d.days
      ? new Date(now + d.days * 86400000)
      : d.kind === "HOLD" && d.hours
        ? new Date(now + d.hours * 3600000)
        : null;

  const request = await db.tradeRequest.create({
    data: {
      kind: d.kind,
      userId: session.id,
      stoneId: d.stoneId,
      days: d.days,
      hours: d.hours,
      note: d.note,
      expiresAt,
      status: "PENDING",
    },
    include: { stone: true },
  });

  await sendMail({
    to: adminEmail(),
    subject: `New ${d.kind} request — ${request.stone.ref}`,
    text: `${d.kind} request for ${request.stone.ref} (${request.stone.shape} ${request.stone.carat}ct). Review/approve in Admin → Requests / Approvals.`,
  });

  return NextResponse.json({ ok: true, requestId: request.id });
}
