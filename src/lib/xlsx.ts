import * as XLSX from "xlsx";

export type ParsedSheet = {
  columns: string[];
  rows: Record<string, unknown>[];
};

/** Parse the first worksheet of an .xlsx/.csv buffer into columns + row objects. */
export function parseWorkbook(buf: Buffer): ParsedSheet {
  const wb = XLSX.read(buf, { type: "buffer" });
  const first = wb.SheetNames[0];
  if (!first) return { columns: [], rows: [] };
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[first], { defval: null });
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return { columns, rows };
}

/** Catalog fields a spreadsheet column can be mapped to. */
export const STONE_FIELDS = [
  "ref", "shape", "carat", "color", "clarity", "cut", "polish", "symmetry", "fluorescence",
  "reportNo", "growthType", "treatment", "location", "measurements",
  "depthPct", "tablePct", "ratio", "costPrice", "pricePerCt", "totalPrice", "status",
] as const;

export type StoneField = (typeof STONE_FIELDS)[number];

const NUMERIC: StoneField[] = ["carat", "depthPct", "tablePct", "ratio", "costPrice", "pricePerCt", "totalPrice"];

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Turn parsed rows + a mapping (catalogField -> spreadsheetColumn) into Stone create objects.
 * Returns valid records and per-row errors.
 */
export function mapRowsToStones(
  rows: Record<string, unknown>[],
  mapping: Partial<Record<StoneField, string>>,
) {
  const records: Record<string, unknown>[] = [];
  const errors: { row: number; message: string }[] = [];

  rows.forEach((row, i) => {
    const rec: Record<string, unknown> = {};
    for (const field of STONE_FIELDS) {
      const col = mapping[field];
      if (!col) continue;
      const raw = row[col];
      rec[field] = NUMERIC.includes(field) ? num(raw) : raw === null ? null : String(raw).trim();
    }
    if (!rec.ref) return errors.push({ row: i + 2, message: "Missing Seyaa Ref" });
    if (!rec.shape) return errors.push({ row: i + 2, message: "Missing Shape" });
    if (rec.carat == null) return errors.push({ row: i + 2, message: "Missing/invalid Carat" });

    // Derive total from per-carat if not supplied.
    if (rec.totalPrice == null && rec.pricePerCt != null) {
      rec.totalPrice = Math.round((rec.pricePerCt as number) * (rec.carat as number) * 100) / 100;
    }
    const status = String(rec.status ?? "AVAILABLE").toUpperCase();
    rec.status = ["AVAILABLE", "HOLD", "MEMO", "SOLD"].includes(status) ? status : "AVAILABLE";
    rec.lab = "IGI";
    records.push(rec);
  });

  return { records, errors };
}
