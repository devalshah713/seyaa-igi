import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { setPasswordSchema } from "@/lib/validators";

// POST /api/admin/customers/[id]/set-password — admin sets or resets a customer's password.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = setPasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 10) },
  });

  return NextResponse.json({ ok: true, email: user.email });
}
