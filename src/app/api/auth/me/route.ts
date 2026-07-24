import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/auth/me — current session user profile.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true, companyName: true },
  });
  return NextResponse.json({ user });
}
