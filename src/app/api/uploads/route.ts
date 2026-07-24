import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { storeUpload } from "@/lib/uploads";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

// POST /api/uploads — multipart file upload (Aadhaar/GST/stone media). Returns { url }.
export async function POST(req: Request) {
  // Onboarding (request-access) uploads happen before login, so allow anonymous for the
  // kyc folder; everything else requires a session.
  const form = await req.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") || "misc");

  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (folder !== "kyc") {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 });
  if (file.type && !ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported type (PDF/JPG/PNG only)" }, { status: 415 });
  }

  try {
    const url = await storeUpload(file, folder.replace(/[^\w\-]/g, ""));
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 500 });
  }
}
