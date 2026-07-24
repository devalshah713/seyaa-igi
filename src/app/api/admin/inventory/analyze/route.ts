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
    ref: ["lotno", "lot", "stockno", "stock", "packet", "stoneno", "srno", "ref"],
    shape: ["shape"],
    carat: ["carat", "cts", "weight", "ct"],
    color: ["color", "colour", "col"],
    clarity: ["clarity", "purity", "clar", "cla"],
    cut: ["cutgrade", "cut"],
    polish: ["polish", "pol"],
    symmetry: ["symmetry", "symm", "sym"],
    fluorescence: ["fluorescence", "fluor", "flour", "flr", "fl"],
    reportNo: ["certificateno", "certno", "reportno", "report", "cert", "igino"],
    location: ["location", "city", "itemloc"],
    measurements: ["measurement", "diamter", "diameter", "dimension", "meas", "mm"],
    depthPct: ["tdepth", "totaldepth", "depth"],
    tablePct: ["table"],
    ratio: ["lw", "lbyw", "ratio"],
    costPrice: ["cost", "purchase", "buyprice"],
    pricePerCt: ["rate", "pricepercarat", "perct", "ppc", "dollarct"],
    totalPrice: ["estamt", "amt", "totalamount", "totalprice", "netamount", "amount", "total"],
    growthType: ["growth", "cvd", "hpht"],
    treatment: ["treatment", "treated"],
    mediaPhotoUrl: ["imagelink", "imageurl", "image", "photo", "picture", "still"],
    mediaVideoUrl: ["videolink", "videourl", "video", "movie", "v360"],
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
