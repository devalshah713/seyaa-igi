import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

// POST /api/auth/login — credentials login for approved accounts.
export async function POST(req: Request) {
  const parsed = loginSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  if (user.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Your trade account is not approved yet.", status: user.status },
      { status: 403 },
    );
  }

  await createSession({ id: user.id, role: user.role, email: user.email });
  return NextResponse.json({ ok: true, user: { id: user.id, role: user.role, firstName: user.firstName } });
}
