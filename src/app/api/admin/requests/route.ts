import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import type { RequestKind, RequestStatus } from "@prisma/client";

// GET /api/admin/requests?kind=MEMO&status=PENDING — memo/hold approval queue.
export async function GET(req: Request) {
  const staff = await requireRole("ADMIN", "SALES");
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") as RequestKind | null;
  const status = url.searchParams.get("status") as RequestStatus | null;

  const requests = await db.tradeRequest.findMany({
    where: { ...(kind ? { kind } : {}), ...(status ? { status } : {}) },
    include: { stone: true, user: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ requests });
}
