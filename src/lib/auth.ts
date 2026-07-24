import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

const COOKIE = "seyaa_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-insecure-secret-change-me");

export type SessionUser = { id: string; role: Role; email: string };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: payload.id as string, role: payload.role as Role, email: payload.email as string };
  } catch {
    return null;
  }
}

/** Throws-style guard for route handlers. Returns the session or null; callers respond 401/403. */
export async function requireRole(...roles: Role[]): Promise<SessionUser | null> {
  const s = await getSession();
  if (!s) return null;
  if (roles.length && !roles.includes(s.role)) return null;
  return s;
}
