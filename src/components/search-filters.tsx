"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Facets = {
  shape: string[]; color: string[]; clarity: string[]; cut: string[]; polish: string[];
  symmetry: string[]; fluorescence: string[]; growthType: string[]; location: string[];
  caratMin: number; caratMax: number; priceMin: number; priceMax: number;
};

// Multi-select chip fields → query param key.
const MULTI: { key: keyof Facets; param: string; title: string }[] = [
  { key: "shape", param: "shape", title: "Shape" },
  { key: "color", param: "color", title: "Colour" },
  { key: "clarity", param: "clarity", title: "Clarity" },
  { key: "cut", param: "cut", title: "Cut" },
  { key: "polish", param: "polish", title: "Polish" },
  { key: "symmetry", param: "symmetry", title: "Symmetry" },
  { key: "fluorescence", param: "fluorescence", title: "Fluorescence" },
  { key: "growthType", param: "growth", title: "Growth type" },
  { key: "location", param: "location", title: "Location" },
];

export default function SearchFilters({ facets }: { facets: Facets }) {
  const router = useRouter();
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [caratMin, setCaratMin] = useState("");
  const [caratMax, setCaratMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [more, setMore] = useState(false);
  const [depthMin, setDepthMin] = useState("");
  const [depthMax, setDepthMax] = useState("");
  const [tableMin, setTableMin] = useState("");
  const [tableMax, setTableMax] = useState("");
  const [ratioMin, setRatioMin] = useState("");
  const [ratioMax, setRatioMax] = useState("");

  function toggle(param: string, val: string) {
    setSel((s) => {
      const cur = s[param] ?? [];
      return { ...s, [param]: cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val] };
    });
  }

  function reset() {
    setSel({});
    setCaratMin(""); setCaratMax(""); setPriceMin(""); setPriceMax("");
    setDepthMin(""); setDepthMax(""); setTableMin(""); setTableMax(""); setRatioMin(""); setRatioMax("");
  }

  function apply() {
    const p = new URLSearchParams();
    for (const { param } of MULTI) {
      const vals = sel[param];
      if (vals && vals.length) p.set(param, vals.join(","));
    }
    const pairs: [string, string][] = [
      ["caratMin", caratMin], ["caratMax", caratMax], ["priceMin", priceMin], ["priceMax", priceMax],
      ["depthMin", depthMin], ["depthMax", depthMax], ["tableMin", tableMin], ["tableMax", tableMax],
      ["ratioMin", ratioMin], ["ratioMax", ratioMax],
    ];
    for (const [k, v] of pairs) if (v.trim()) p.set(k, v.trim());
    router.push("/results?" + p.toString());
  }

  const activeCount =
    Object.values(sel).reduce((n, a) => n + a.length, 0) +
    [caratMin, caratMax, priceMin, priceMax, depthMin, depthMax, tableMin, tableMax, ratioMin, ratioMax].filter((v) => v.trim()).length;

  const Range = ({ label, unit, a, b, sa, sb, pa, pb }: {
    label: string; unit: string; a: string; b: string;
    sa: (v: string) => void; sb: (v: string) => void; pa: string; pb: string;
  }) => (
    <div className="card">
      <div className="chd"><h3>{label}</h3>{unit && <span className="note">{unit}</span>}</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div className="field" style={{ flex: 1, maxWidth: 220 }}>
          <div className="lb">Min</div>
          <input value={a} onChange={(e) => sa(e.target.value)} placeholder={pa} inputMode="decimal"
            style={{ border: 0, background: "transparent", padding: 0, fontSize: 14, fontWeight: 500, width: "100%" }} />
        </div>
        <span style={{ color: "var(--i4)" }}>›</span>
        <div className="field" style={{ flex: 1, maxWidth: 220 }}>
          <div className="lb">Max</div>
          <input value={b} onChange={(e) => sb(e.target.value)} placeholder={pb} inputMode="decimal"
            style={{ border: 0, background: "transparent", padding: 0, fontSize: 14, fontWeight: 500, width: "100%" }} />
        </div>
      </div>
    </div>
  );

  const ChipSection = ({ title, param, options }: { title: string; param: string; options: string[] }) => {
    if (!options.length) return null;
    const chosen = sel[param] ?? [];
    return (
      <div className="card">
        <div className="chd"><h3>{title}</h3><span className="note">{chosen.length ? `${chosen.length} selected` : "Any"}</span></div>
        <div className="wrap">
          {options.map((o) => (
            <span key={o} className={`chip ${chosen.includes(o) ? "sel" : ""}`} onClick={() => toggle(param, o)}>{o}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="content">
        <div className="page-title">
          <h2>Search Inventory</h2>
          <p>Lab-Grown Diamonds · IGI Certified · Seyaa Solitaire stock</p>
        </div>

        <ChipSection title="Shape" param="shape" options={facets.shape} />

        <Range label="Carat" unit={facets.caratMax ? `${facets.caratMin}–${facets.caratMax} ct in stock` : "ct"}
          a={caratMin} b={caratMax} sa={setCaratMin} sb={setCaratMax}
          pa={String(facets.caratMin || "0.30")} pb={String(facets.caratMax || "10")} />

        <div className="row2">
          <ChipSection title="Colour" param="color" options={facets.color} />
          <ChipSection title="Clarity" param="clarity" options={facets.clarity} />
        </div>

        <Range label="Total price" unit="USD" a={priceMin} b={priceMax} sa={setPriceMin} sb={setPriceMax}
          pa={facets.priceMin ? `$${Math.floor(facets.priceMin)}` : "$0"} pb={facets.priceMax ? `$${Math.ceil(facets.priceMax)}` : "$50000"} />

        <div className="row2">
          <ChipSection title="Cut" param="cut" options={facets.cut} />
          <ChipSection title="Polish" param="polish" options={facets.polish} />
        </div>
        <div className="row2">
          <ChipSection title="Symmetry" param="symmetry" options={facets.symmetry} />
          <ChipSection title="Fluorescence" param="fluorescence" options={facets.fluorescence} />
        </div>
        <div className="row2">
          <ChipSection title="Growth type" param="growth" options={facets.growthType} />
          <ChipSection title="Location" param="location" options={facets.location} />
        </div>

        <button className="linka" type="button" style={{ alignSelf: "flex-start" }} onClick={() => setMore((m) => !m)}>
          {more ? "− Hide measurements" : "+ More filters (depth, table, ratio)"}
        </button>
        {more && (
          <>
            <div className="row2">
              <Range label="Depth %" unit="%" a={depthMin} b={depthMax} sa={setDepthMin} sb={setDepthMax} pa="55" pb="75" />
              <Range label="Table %" unit="%" a={tableMin} b={tableMax} sa={setTableMin} sb={setTableMax} pa="50" pb="70" />
            </div>
            <Range label="Ratio (L/W)" unit="" a={ratioMin} b={ratioMax} sa={setRatioMin} sb={setRatioMax} pa="1.00" pb="2.00" />
          </>
        )}
      </div>

      <div className="foot" style={{ position: "sticky", bottom: 0 }}>
        <button className="btn out" onClick={reset}>Reset All</button>
        <div style={{ flex: 1 }} />
        <button className="btn pri" onClick={apply}>
          Apply Filters{activeCount ? ` · ${activeCount}` : ""}
        </button>
      </div>
    </>
  );
}
