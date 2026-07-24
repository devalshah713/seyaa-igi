import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { stoneQuerySchema } from "@/lib/validators";
import type { Prisma } from "@prisma/client";

// GET /api/stones — search inventory (approved trade accounts only).
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const parsed = stoneQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  const q = parsed.data;

  const where: Prisma.StoneWhereInput = {
    ...(q.shape ? { shape: q.shape } : {}),
    ...(q.color ? { color: q.color } : {}),
    ...(q.clarity ? { clarity: q.clarity } : {}),
    ...(q.status ? { status: q.status } : {}),
    ...(q.caratMin || q.caratMax
      ? { carat: { gte: q.caratMin ?? undefined, lte: q.caratMax ?? undefined } }
      : {}),
  };

  // Cost price is internal — hide it from non-admins.
  const select: Prisma.StoneSelect = {
    id: true, ref: true, shape: true, carat: true, color: true, clarity: true,
    cut: true, polish: true, symmetry: true, fluorescence: true, lab: true, reportNo: true,
    growthType: true, treatment: true, location: true, measurements: true,
    depthPct: true, tablePct: true, ratio: true, pricePerCt: true, totalPrice: true,
    status: true, mediaPhotoUrl: true, mediaVideoUrl: true, mediaCertUrl: true,
    costPrice: session.role === "ADMIN",
  };

  const [total, stones] = await Promise.all([
    db.stone.count({ where }),
    db.stone.findMany({ where, select, take: q.take, skip: q.skip, orderBy: { totalPrice: "asc" } }),
  ]);

  return NextResponse.json({ total, take: q.take, skip: q.skip, stones });
}
