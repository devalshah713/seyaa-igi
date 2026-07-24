import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";

// GET /api/uploads/<folder>/<name> — serves dev-fallback uploads (.uploads/). Auth required.
// In production, files are served directly from Vercel Blob URLs and never hit this route.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path: parts } = await params;
  // Prevent path traversal.
  if (parts.some((p) => p.includes("..") || p.includes("/") || p.includes("\\"))) {
    return NextResponse.json({ error: "Bad path" }, { status: 400 });
  }
  const filePath = path.join(process.cwd(), ".uploads", ...parts);
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type =
      ext === ".pdf" ? "application/pdf" : ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return new NextResponse(new Uint8Array(data), { headers: { "Content-Type": type } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
