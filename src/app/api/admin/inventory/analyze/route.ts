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
    ref: ["stockno", "stockid", "stock", "srno", "lot", "packet", "stoneno", "ref"],
    shape: ["shape"],
    carat: ["carat", "cts", "weight"],
    color: ["color", "colour", "col"],
    clarity: ["clarity", "purity", "clar"],
    cut: ["cutgrade", "cut"],
    polish: ["polish", "pol"],
    symmetry: ["symmetry", "symm", "sym"],
    fluorescence: ["fluorescence", "fluor", "flr"],
    pricePerCt: ["rate", "pricepercarat", "perct", "ppc", "dollarct"],
    totalPrice: ["totalamount", "totalprice", "netamount", "amount", "total", "value"],
    reportNo: ["reportno", "certno", "certificateno", "igino", "report", "igi"],
    location: ["location", "city", "itemloc"],
    measurements: ["measurement", "meas"],
  };
  const norm2 = (s: string) => norm(s);
  const suggested: Record<string, string> = {};
  const used = new Set<string>();
  for (const field of STONE_FIELDS) {
    const cands = hints[field] ?? [norm(field)];
    // Prefer the most specific (longest) hint match; don't reuse a column already mapped.
    let best: string | undefined;
    for (const h of cands) {
      const match = columns.find((c) => !used.has(c) && norm2(c).includes(h));
      if (match) { best = match; break; }
    }
    if (best) { suggested[field] = best; used.add(best); }
  }

  return NextResponse.json({
    columns,
    fields: STONE_FIELDS,
    suggestedMapping: suggested,
    rowCount: rows.length,
    sample: rows.slice(0, 5),
  });
}
