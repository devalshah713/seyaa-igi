import { db } from "@/lib/db";
import SearchFilters from "@/components/search-filters";
import { canonicalOptions } from "@/lib/facets";

export default async function SearchPage() {
  const [shape, color, clarity, cut, polish, symmetry, fluorescence, growthType, location, agg] = await Promise.all([
    canonicalOptions("shape"), canonicalOptions("color"), canonicalOptions("clarity"),
    canonicalOptions("cut"), canonicalOptions("polish"), canonicalOptions("symmetry"),
    canonicalOptions("fluorescence"), canonicalOptions("growthType"), canonicalOptions("location"),
    db.stone.aggregate({ _min: { carat: true, totalPrice: true }, _max: { carat: true, totalPrice: true } }),
  ]);

  const facets = {
    shape, color, clarity, cut, polish, symmetry, fluorescence, growthType, location,
    caratMin: agg._min.carat ?? 0,
    caratMax: agg._max.carat ?? 0,
    priceMin: agg._min.totalPrice ?? 0,
    priceMax: agg._max.totalPrice ?? 0,
  };

  return <SearchFilters facets={facets} />;
}
