import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseWorkbook, mapRowsToStones, STONE_FIELDS, type StoneField } from "@/lib/xlsx";

// POST /api/admin/inventory/publish — multipart: `file` + `mapping` (JSON catalogField->column).
// Validates and upserts stones by `ref`. Step 4 of the stock-upload pipeline.
export async function POST(req: Request) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });

  let mapping: Partial<Record<StoneField, string>>;
  try {
    const raw = JSON.parse(String(form.get("mapping") || "{}"));
    mapping = Object.fromEntries(
      Object.entries(raw).filter(([k]) => (STONE_FIELDS as readonly string[]).includes(k)),
    ) as Partial<Record<StoneField, string>>;
  } catch {
    return NextResponse.json({ error: "Invalid mapping JSON" }, { status: 400 });
  }
  if (!mapping.ref || !mapping.shape || !mapping.carat) {
    return NextResponse.json({ error: "Mapping must include ref, shape and carat." }, { status: 400 });
  }

  const { rows } = parseWorkbook(Buffer.from(await file.arrayBuffer()));
  const { records, errors } = mapRowsToStones(rows, mapping);

  let created = 0;
  let updated = 0;
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const ref = rec.ref as string;
    try {
      const existing = await db.stone.findUnique({ where: { ref }, select: { id: true } });
      await db.stone.upsert({ where: { ref }, create: rec as never, update: rec as never });
      existing ? updated++ : created++;
    } catch (e) {
      // Skip a bad row instead of failing the whole import.
      errors.push({ row: i + 2, message: e instanceof Error ? e.message.split("\n")[0].slice(0, 200) : "Row failed" });
    }
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    created,
    updated,
    skipped: errors.length,
    errors: errors.slice(0, 50),
  });
}
