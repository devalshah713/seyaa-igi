import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendMail, adminEmail } from "@/lib/mailer";

// GET /api/orders — customer sees their own; admin/sales see all.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const where = session.role === "CUSTOMER" ? { customerId: session.id } : {};
  const orders = await db.order.findMany({
    where,
    include: { items: { include: { stone: true } }, customer: true, assignedTo: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders });
}

async function nextOrderNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.order.count();
  return `SEY-ORD-${year}-${String(count + 1).padStart(4, "0")}`;
}

// POST /api/orders — turn the cart into an Order ID and notify the admin team.
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cart = await db.cartItem.findMany({ where: { userId: session.id }, include: { stone: true } });
  if (cart.length === 0) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

  const indicativeTotal = cart.reduce((s, i) => s + (i.stone.totalPrice ?? 0), 0);
  const orderNo = await nextOrderNo();

  const order = await db.order.create({
    data: {
      orderNo,
      customerId: session.id,
      status: "NEW",
      indicativeTotal,
      items: { create: cart.map((i) => ({ stoneId: i.stoneId, priceSnapshot: i.stone.totalPrice })) },
    },
    include: { items: { include: { stone: true } }, customer: true },
  });

  // Clear the cart now that it's an order.
  await db.cartItem.deleteMany({ where: { userId: session.id } });

  // Email the admin team the Order ID + stone details so a salesperson can be assigned.
  const lines = order.items
    .map((i) => `- ${i.stone.ref}  ${i.stone.shape} ${i.stone.carat}ct ${i.stone.color} ${i.stone.clarity}  (~$${i.stone.totalPrice ?? "-"})`)
    .join("\n");
  await sendMail({
    to: adminEmail(),
    subject: `New order ${order.orderNo} — ${order.customer.companyName || order.customer.firstName}`,
    text: `Order ${order.orderNo} from ${order.customer.firstName} ${order.customer.lastName} (${order.customer.email}).\nStones (${order.items.length}), indicative total ~$${indicativeTotal}:\n${lines}\n\nAssign a salesperson in Admin → Requests / Approvals.`,
  });

  return NextResponse.json({ ok: true, orderNo: order.orderNo, orderId: order.id });
}
