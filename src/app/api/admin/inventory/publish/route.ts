import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseWorkbook, mapRowsToStones, STONE_FIELDS, type StoneField } from "@/lib/xlsx";

// Allow a longer run for large sheets (thousands of rows).
export const maxDuration = 60;

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

  // Drop duplicate refs within the sheet (keep first occurrence).
  const seen = new Set<string>();
  const unique = records.filter((r) => {
    const ref = String(r.ref);
    if (seen.has(ref)) return false;
    seen.add(ref);
    return true;
  });

  // Fast bulk insert in batches; skipDuplicates skips stones already in stock (by ref).
  const BATCH = 500;
  let imported = 0;
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    try {
      const res = await db.stone.createMany({ data: batch as never, skipDuplicates: true });
      imported += res.count;
    } catch (e) {
      errors.push({ row: i + 2, message: e instanceof Error ? e.message.split("\n")[0].slice(0, 200) : "Batch failed" });
    }
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    imported,
    alreadyInStock: unique.length - imported,
    skippedInvalid: errors.length,
    errors: errors.slice(0, 50),
  });
}
