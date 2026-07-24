import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { cartMutateSchema } from "@/lib/validators";

// GET /api/cart — current user's cart.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await db.cartItem.findMany({
    where: { userId: session.id },
    include: { stone: true },
    orderBy: { createdAt: "desc" },
  });
  const indicativeTotal = items.reduce((s, i) => s + (i.stone.totalPrice ?? 0), 0);
  return NextResponse.json({ items, count: items.length, indicativeTotal });
}

// POST /api/cart — add a stone.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = cartMutateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await db.cartItem.upsert({
    where: { userId_stoneId: { userId: session.id, stoneId: parsed.data.stoneId } },
    create: { userId: session.id, stoneId: parsed.data.stoneId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

// DELETE /api/cart?stoneId=... — remove a stone.
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stoneId = new URL(req.url).searchParams.get("stoneId");
  if (!stoneId) return NextResponse.json({ error: "stoneId required" }, { status: 400 });
  await db.cartItem.deleteMany({ where: { userId: session.id, stoneId } });
  return NextResponse.json({ ok: true });
}
