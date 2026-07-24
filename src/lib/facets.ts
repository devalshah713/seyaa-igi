import { db } from "@/lib/db";

// The imported IGI stock stores raw certificate values (e.g. shape =
// "CUT CORNERED RECTANGULAR MODIFIED BRILLIANT", cut = "EX") with inconsistent
// casing and many variants. For a clean filter UI we map those raw values to
// canonical categories for *display*, and expand a picked category back to all
// its raw variants when *querying* — so nothing about the stored data changes.

export type FacetField =
  | "shape" | "color" | "clarity" | "cut" | "polish" | "symmetry"
  | "fluorescence" | "growthType" | "location";

const titleCase = (s: string) =>
  s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const upper = (s: string) => s.trim().toUpperCase();

// Shape: keyword rules, ordered so more specific matches win first.
const SHAPE_RULES: [RegExp, string][] = [
  [/ROUND/, "Round"],
  [/OVAL/, "Oval"],
  [/CUSHION/, "Cushion"],
  [/PRINCESS/, "Princess"],
  [/ASSCHER|SQUARE EMERALD/, "Asscher"],
  [/EMERALD/, "Emerald"],
  [/PEAR/, "Pear"],
  [/MARQUISE/, "Marquise"],
  [/HEART/, "Heart"],
  [/RADIANT|CUT[\s-]?CORNERED|RECTANGULAR MODIFIED BRILLIANT/, "Radiant"],
  [/TRIANG|TRILLIANT/, "Trilliant"],
  [/HEXAGON/, "Hexagonal"],
  [/BAGUETTE/, "Baguette"],
  [/PORTUGUESE/, "Portuguese"],
];

export function normalizeShape(raw: string): string {
  const s = raw.toUpperCase();
  for (const [re, name] of SHAPE_RULES) if (re.test(s)) return name;
  return titleCase(raw);
}

// Cut / Polish / Symmetry grades.
function normalizeGrade(raw: string): string {
  const s = raw.trim().toUpperCase().replace(/\./g, "");
  if (["ID", "IDEAL"].includes(s)) return "Ideal";
  if (["EX", "EXCELLENT", "XXX", "3EX"].includes(s)) return "Excellent";
  if (["VG", "VERYGOOD", "VERY GOOD", "VGOOD"].includes(s)) return "Very Good";
  if (["GD", "G", "GOOD"].includes(s)) return "Good";
  if (["FR", "FAIR"].includes(s)) return "Fair";
  if (["PR", "POOR"].includes(s)) return "Poor";
  return titleCase(raw);
}

function normalizeFluor(raw: string): string {
  const s = raw.trim().toUpperCase();
  if (["NON", "NONE", "N", "NIL", "0"].includes(s)) return "None";
  if (["FNT", "FAINT", "F"].includes(s)) return "Faint";
  if (["MED", "MEDIUM", "M"].includes(s)) return "Medium";
  if (["STG", "ST", "STR", "STRONG", "S"].includes(s)) return "Strong";
  if (["VST", "VSTG", "VS", "VERY STRONG"].includes(s)) return "Very Strong";
  return titleCase(raw);
}

// Colour: white grades stay as the letter (D–Z); fancy colours are cleaned to their
// full "Fancy <Intensity> <Hue>" name, deduping casing/word-order/truncation variants
// (e.g. "YELLOW FANCY VIVID" and "Fancy Vivid Yellow" → "Fancy Vivid Yellow").
const INTENS: Record<string, string> = { VIVID: "Vivid", INTENSE: "Intense", LIGHT: "Light", DEEP: "Deep", DARK: "Dark", FAINT: "Faint" };
const FULL_HUE: Record<string, string> = {
  YELLOW: "Yellow", PINK: "Pink", BLUE: "Blue", GREEN: "Green", ORANGE: "Orange", RED: "Red",
  PURPLE: "Purple", VIOLET: "Violet", BROWN: "Brown", GRAY: "Gray", GREY: "Gray", BLACK: "Black",
  GREENI: "Green", GREENISH: "Green",
};
const MOD_HUE: Record<string, string> = {
  YELLOWISH: "Yellowish", PINKISH: "Pinkish", BLUISH: "Bluish", GREENISH: "Greenish",
  ORANGY: "Orangy", ORANGISH: "Orangish", REDDISH: "Reddish", PURPLISH: "Purplish", BROWNISH: "Brownish",
};
// Trailing single letters are truncated hue names in the source sheet.
const TRUNC_HUE: Record<string, string> = { G: "Green", P: "Pink", B: "Blue", Y: "Yellow", O: "Orange", R: "Red" };
const TO_MOD: Record<string, string> = { Orange: "Orangy", Blue: "Bluish", Green: "Greenish", Yellow: "Yellowish", Pink: "Pinkish", Red: "Reddish", Purple: "Purplish", Brown: "Brownish", Gray: "Grayish" };
const MOD_TO_HUE: Record<string, string> = { Orangy: "Orange", Bluish: "Blue", Greenish: "Green", Yellowish: "Yellow", Pinkish: "Pink", Reddish: "Red", Purplish: "Purple", Brownish: "Brown", Orangish: "Orange" };

export function normalizeColor(raw: string): string {
  const up = raw.trim().toUpperCase();
  if (/^[D-Z]$/.test(up)) return up; // plain white grade
  const tokens = up.split(/[^A-Z]+/).filter(Boolean);
  let intensity: string | null = null;
  const seq: { m: boolean; n: string }[] = [];
  for (const t of tokens) {
    if (t === "FANCY" || t === "VERY") continue;
    if (INTENS[t]) { intensity = intensity ?? INTENS[t]; continue; }
    if (FULL_HUE[t]) { seq.push({ m: false, n: FULL_HUE[t] }); continue; }
    if (MOD_HUE[t]) { seq.push({ m: true, n: MOD_HUE[t] }); continue; }
    if (t.length === 1 && TRUNC_HUE[t]) { seq.push({ m: false, n: TRUNC_HUE[t] }); continue; }
  }
  if (seq.length === 0) return titleCase(raw);
  const last = seq[seq.length - 1];
  const primary = last.m ? (MOD_TO_HUE[last.n] ?? last.n) : last.n;
  const mods = seq.slice(0, -1).map((x) => (x.m ? x.n : (TO_MOD[x.n] ?? x.n)));
  const phrase = (mods.length ? mods.join(" ") + " " : "") + primary;
  return ["Fancy", intensity, phrase].filter(Boolean).join(" ");
}

export function isFancyColor(v: string): boolean {
  return !/^[D-Z]$/.test(v);
}

// Location abbreviations → full names.
const LOCATION_MAP: Record<string, string> = { HK: "Hong Kong", NY: "New York", MUMBAI: "Mumbai", SURAT: "Surat" };
function normalizeLocation(raw: string): string {
  const up = raw.trim().toUpperCase();
  return LOCATION_MAP[up] ?? titleCase(raw);
}

const NORMALIZERS: Record<FacetField, (s: string) => string> = {
  shape: normalizeShape,
  color: normalizeColor,
  clarity: upper,
  cut: normalizeGrade,
  polish: normalizeGrade,
  symmetry: normalizeGrade,
  fluorescence: normalizeFluor,
  growthType: upper,
  location: normalizeLocation,
};

const ORDERS: Partial<Record<FacetField, string[]>> = {
  shape: ["Round", "Oval", "Cushion", "Princess", "Emerald", "Radiant", "Pear", "Marquise", "Asscher", "Heart", "Trilliant", "Hexagonal", "Baguette", "Portuguese"],
  color: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
  clarity: ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "SI3", "I1", "I2", "I3"],
  cut: ["Ideal", "Excellent", "Very Good", "Good", "Fair", "Poor"],
  polish: ["Ideal", "Excellent", "Very Good", "Good", "Fair", "Poor"],
  symmetry: ["Ideal", "Excellent", "Very Good", "Good", "Fair", "Poor"],
  fluorescence: ["None", "Faint", "Medium", "Strong", "Very Strong"],
};

function sortCanon(values: string[], order?: string[]) {
  if (!order) return [...values].sort();
  const idx = (v: string) => {
    const i = order.indexOf(v);
    return i === -1 ? order.length + 1 : i;
  };
  return [...values].sort((a, b) => idx(a) - idx(b) || a.localeCompare(b));
}

// Clean a single stored value for display (e.g. "HK" → "Hong Kong", "CUSHION" → "Cushion").
export function normalizeField(field: FacetField, raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return "—";
  return NORMALIZERS[field](raw);
}

async function distinctRaw(field: FacetField): Promise<string[]> {
  const rows = await db.stone.findMany({ select: { [field]: true }, distinct: [field] });
  return rows
    .map((r) => (r as unknown as Record<string, string | null>)[field])
    .filter((v): v is string => typeof v === "string" && v.trim() !== "");
}

// Fancy colour names present in stock, most in-stock first
// (e.g. "Fancy Vivid Pink", "Fancy Intense Yellow", …).
export async function fancyColorOptions(): Promise<string[]> {
  const rows = await db.stone.findMany({ select: { color: true } });
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (!r.color) continue;
    const n = normalizeColor(r.color);
    if (isFancyColor(n)) counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name);
}

// Clean, de-duplicated, ordered options to show as filter chips.
export async function canonicalOptions(field: FacetField): Promise<string[]> {
  const raws = await distinctRaw(field);
  const norm = NORMALIZERS[field];
  return sortCanon([...new Set(raws.map(norm))], ORDERS[field]);
}

// Turn picked canonical values (comma-separated) into a Prisma `in` over the raw
// variants that map to them. Returns undefined when nothing is selected.
export async function expandFilter(field: FacetField, csv?: string) {
  if (!csv) return undefined;
  const selected = new Set(csv.split(",").filter(Boolean));
  const norm = NORMALIZERS[field];
  const raws = await distinctRaw(field);
  const matched = raws.filter((r) => selected.has(norm(r)));
  // If a picked value matches no raw variant, force an empty result set.
  return { in: matched.length ? matched : [" __none__"] };
}
