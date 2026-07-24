import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AccountStatus } from "@prisma/client";

// GET /api/admin/customers?status=PENDING — customer accounts + their KYC documents.
export async function GET(req: Request) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = new URL(req.url).searchParams.get("status") as AccountStatus | null;
  const customers = await db.user.findMany({
    where: { role: "CUSTOMER", ...(status ? { status } : {}) },
    include: { kycDocuments: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ customers });
}
