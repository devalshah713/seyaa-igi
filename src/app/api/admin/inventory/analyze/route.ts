import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { parseWorkbook, STONE_FIELDS } from "@/lib/xlsx";

// POST /api/admin/inventory/analyze — upload an Excel/CSV; returns detected columns + a preview.
// Step 1 of the stock-upload pipeline (upload → map → validate → publish).
export async function POST(req: Request) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });

  const { columns, rows } = parseWorkbook(Buffer.from(await file.arrayBuffer()));
  if (columns.length === 0) return NextResponse.json({ error: "No rows found in sheet" }, { status: 400 });

  // Suggest a mapping by loose name matching (e.g. "CTS" -> carat, "SHAPE" -> shape).
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const hints: Record<string, string[]> = {
    ref: ["ref", "stock", "srno", "sr", "certno", "id"],
    carat: ["carat", "cts", "ct", "weight"],
    color: ["color", "colour"],
    clarity: ["clarity", "purity"],
    pricePerCt: ["rate", "pricepercarat", "perct", "ppc"],
    totalPrice: ["total", "amount", "price"],
    reportNo: ["igi", "report", "certificate", "certno"],
  };
  const suggested: Record<string, string> = {};
  for (const field of STONE_FIELDS) {
    const cands = hints[field] ?? [norm(field)];
    const match = columns.find((c) => cands.some((h) => norm(c).includes(h)));
    if (match) suggested[field] = match;
  }

  return NextResponse.json({
    columns,
    fields: STONE_FIELDS,
    suggestedMapping: suggested,
    rowCount: rows.length,
    sample: rows.slice(0, 5),
  });
}
