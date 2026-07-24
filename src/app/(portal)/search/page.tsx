import { db } from "@/lib/db";
import SearchFilters from "@/components/search-filters";

// Canonical ordering for graded scales; unknown values are appended alphabetically.
const COLOR_ORDER = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
const CLARITY_ORDER = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "SI3", "I1", "I2", "I3"];
const GRADE_ORDER = ["ID", "EX", "EXCELLENT", "VG", "VERY GOOD", "GD", "G", "GOOD", "FR", "FAIR", "PR", "POOR"];
const FLUOR_ORDER = ["NON", "NONE", "FNT", "FAINT", "MED", "MEDIUM", "STG", "ST", "STRONG", "VST", "VERY STRONG"];

function sortBy(values: string[], order: string[]) {
  const idx = (v: string) => {
    const i = order.indexOf(v.toUpperCase());
    return i === -1 ? order.length + 1 : i;
  };
  return [...values].sort((a, b) => idx(a) - idx(b) || a.localeCompare(b));
}

async function facet(field: "shape" | "color" | "clarity" | "cut" | "polish" | "symmetry" | "fluorescence" | "growthType" | "location") {
  // No `where: { not: null }` — this Prisma version rejects it; filter nulls in JS instead.
  const rows = await db.stone.findMany({
    select: { [field]: true },
    distinct: [field],
  });
  return rows
    .map((r) => (r as unknown as Record<string, string | null>)[field])
    .filter((v): v is string => !!v && v.trim() !== "");
}

export default async function SearchPage() {
  const [shapes, colors, clarities, cuts, polishes, symmetries, fluors, growth, locations, agg] = await Promise.all([
    facet("shape"), facet("color"), facet("clarity"), facet("cut"), facet("polish"),
    facet("symmetry"), facet("fluorescence"), facet("growthType"), facet("location"),
    db.stone.aggregate({ _min: { carat: true, totalPrice: true }, _max: { carat: true, totalPrice: true } }),
  ]);

  const facets = {
    shape: shapes.sort(),
    color: sortBy(colors, COLOR_ORDER),
    clarity: sortBy(clarities, CLARITY_ORDER),
    cut: sortBy(cuts, GRADE_ORDER),
    polish: sortBy(polishes, GRADE_ORDER),
    symmetry: sortBy(symmetries, GRADE_ORDER),
    fluorescence: sortBy(fluors, FLUOR_ORDER),
    growthType: growth.sort(),
    location: locations.sort(),
    caratMin: agg._min.carat ?? 0,
    caratMax: agg._max.carat ?? 0,
    priceMin: agg._min.totalPrice ?? 0,
    priceMax: agg._max.totalPrice ?? 0,
  };

  return <SearchFilters facets={facets} />;
}
