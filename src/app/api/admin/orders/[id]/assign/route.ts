import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { assignSchema } from "@/lib/validators";

// POST /api/admin/orders/[id]/assign — admin assigns an order to a salesperson.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = assignSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const sales = await db.user.findFirst({ where: { id: parsed.data.salespersonId, role: "SALES" } });
  if (!sales) return NextResponse.json({ error: "Salesperson not found" }, { status: 404 });

  const order = await db.order.update({
    where: { id },
    data: { assignedToId: sales.id, status: "ASSIGNED" },
    include: { customer: true },
  });

  await sendMail({
    to: sales.email,
    subject: `Order ${order.orderNo} assigned to you`,
    text: `You've been assigned order ${order.orderNo} from ${order.customer.firstName} ${order.customer.lastName} (${order.customer.email}). Follow up to confirm pricing and terms.`,
  });

  return NextResponse.json({ ok: true, orderNo: order.orderNo, assignedTo: sales.email });
}
