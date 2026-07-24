"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShapeIcon } from "./shape-icons";

type Facets = {
  shape: string[]; color: string[]; clarity: string[]; cut: string[]; polish: string[];
  symmetry: string[]; fluorescence: string[]; growthType: string[]; location: string[];
  caratMin: number; caratMax: number; priceMin: number; priceMax: number; total: number;
};

const CARAT_PRESETS: [string, string, string][] = [
  ["0.30", "0.39", "0.30–0.39"], ["0.40", "0.49", "0.40–0.49"], ["0.50", "0.69", "0.50–0.69"],
  ["0.70", "0.89", "0.70–0.89"], ["0.90", "0.99", "0.90–0.99"], ["1.00", "1.49", "1.00–1.49"],
  ["1.50", "1.99", "1.50–1.99"], ["2.00", "2.99", "2.00–2.99"], ["3.00", "3.99", "3.00–3.99"],
  ["4.00", "4.99", "4.00–4.99"], ["5.00", "5.99", "5.00–5.99"], ["10", "", "10+"],
];

export default function SearchFilters({ facets }: { facets: Facets }) {
  const router = useRouter();
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [caratMin, setCaratMin] = useState("");
  const [caratMax, setCaratMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
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
  const chosen = (param: string) => sel[param] ?? [];

  function reset() {
    setSel({});
    setCaratMin(""); setCaratMax(""); setPriceMin(""); setPriceMax("");
    setDepthMin(""); setDepthMax(""); setTableMin(""); setTableMax(""); setRatioMin(""); setRatioMax("");
  }

  function apply() {
    const p = new URLSearchParams();
    const params: [string, string][] = [
      ["shape", "shape"], ["color", "color"], ["clarity", "clarity"], ["cut", "cut"],
      ["polish", "polish"], ["symmetry", "symmetry"], ["fluorescence", "fluorescence"],
      ["growthType", "growth"], ["location", "location"],
    ];
    for (const [key, param] of params) {
      const vals = sel[key];
      if (vals && vals.length) p.set(param, vals.join(","));
    }
    const ranges: [string, string][] = [
      ["caratMin", caratMin], ["caratMax", caratMax], ["priceMin", priceMin], ["priceMax", priceMax],
      ["depthMin", depthMin], ["depthMax", depthMax], ["tableMin", tableMin], ["tableMax", tableMax],
      ["ratioMin", ratioMin], ["ratioMax", ratioMax],
    ];
    for (const [k, v] of ranges) if (v.trim()) p.set(k, v.trim());
    router.push("/results?" + p.toString());
  }

  const activeCount =
    Object.values(sel).reduce((n, a) => n + a.length, 0) +
    [caratMin, caratMax, priceMin, priceMax, depthMin, depthMax, tableMin, tableMax, ratioMin, ratioMax].filter((v) => v.trim()).length;

  // Small reusable pieces --------------------------------------------------
  const Chips = ({ param, options }: { param: string; options: string[] }) => (
    <div className="wrap">
      {options.map((o) => (
        <span key={o} className={`chip wide ${chosen(param).includes(o) ? "sel" : ""}`} onClick={() => toggle(param, o)}>{o}</span>
      ))}
    </div>
  );

  const Field = ({ lb, v, set, ph }: { lb: string; v: string; set: (s: string) => void; ph: string }) => (
    <div className="field" style={{ flex: 1 }}>
      <div className="lb">{lb}</div>
      <input value={v} onChange={(e) => set(e.target.value)} placeholder={ph} inputMode="decimal"
        style={{ border: 0, background: "transparent", padding: 0, fontSize: 14, fontWeight: 500, width: "100%" }} />
    </div>
  );

  const MinMax = ({ a, b, sa, sb, pa, pb }: { a: string; b: string; sa: (s: string) => void; sb: (s: string) => void; pa: string; pb: string }) => (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <Field lb="Min" v={a} set={sa} ph={pa} />
      <span style={{ color: "var(--i4)" }}>›</span>
      <Field lb="Max" v={b} set={sb} ph={pb} />
    </div>
  );

  return (
    <>
      <div className="content">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
          <div className="page-title">
            <h2>Search Inventory</h2>
            <p>Lab-Grown Diamonds · IGI Certified · Seyaa Solitaire stock</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span className="chip sel">Classic Search</span>
          </div>
        </div>

        {/* Shape — faceted diamond icon cards */}
        {facets.shape.length > 0 && (
          <div className="card">
            <div className="chd"><h3>Shape</h3><span className="note">{chosen("shape").length ? `${chosen("shape").length} selected` : "Any"}</span></div>
            <div className="wrap">
              {facets.shape.map((s) => {
                const on = chosen("shape").includes(s);
                return (
                  <span key={s} className={`chip shape ${on ? "sel" : ""}`} onClick={() => toggle("shape", s)}>
                    <ShapeIcon name={s} selected={on} />
                    <span>{s}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Carat */}
        <div className="card">
          <div className="chd"><h3>Carat</h3><span className="note">{facets.caratMax ? `${facets.caratMin}–${facets.caratMax} ct in stock` : ""}</span></div>
          <div style={{ marginBottom: 14 }}><MinMax a={caratMin} b={caratMax} sa={setCaratMin} sb={setCaratMax} pa={String(facets.caratMin || "0.30")} pb={String(facets.caratMax || "10")} /></div>
          <div className="wrap">
            {CARAT_PRESETS.map(([lo, hi, label]) => {
              const on = caratMin === lo && caratMax === hi;
              return <span key={label} className={`chip wide ${on ? "sel" : ""}`} onClick={() => { setCaratMin(on ? "" : lo); setCaratMax(on ? "" : hi); }}>{label}</span>;
            })}
          </div>
        </div>

        {/* Color / Clarity */}
        <div className="row2">
          {facets.color.length > 0 && (
            <div className="card">
              <div className="chd"><h3>Colour</h3><span className="note">{chosen("color").length ? `${chosen("color").length} selected` : "Any"}</span></div>
              <div className="subtab"><b>White</b><span>Fancy</span></div>
              <Chips param="color" options={facets.color} />
            </div>
          )}
          {facets.clarity.length > 0 && (
            <div className="card">
              <div className="chd"><h3>Clarity</h3><span className="note">{chosen("clarity").length ? `${chosen("clarity").length} selected` : "Any"}</span></div>
              <Chips param="clarity" options={facets.clarity} />
            </div>
          )}
        </div>

        {/* Cut, Polish & Symmetry */}
        {(facets.cut.length || facets.polish.length || facets.symmetry.length) > 0 && (
          <div className="card">
            <div className="chd"><h3>Cut, Polish &amp; Symmetry</h3></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {([["Cut", "cut", facets.cut], ["Polish", "polish", facets.polish], ["Symmetry", "symmetry", facets.symmetry]] as [string, string, string[]][]).map(([label, param, opts]) =>
                opts.length ? (
                  <div className="cps-row" key={param}>
                    <b className="cps-lb">{label}</b>
                    <div className="wrap">
                      {opts.map((o) => <span key={o} className={`chip ${chosen(param).includes(o) ? "sel" : ""}`} onClick={() => toggle(param, o)}>{o}</span>)}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}

        {/* Fluorescence */}
        {facets.fluorescence.length > 0 && (
          <div className="card">
            <div className="chd"><h3>Fluorescence</h3><span className="note">{chosen("fluorescence").length ? `${chosen("fluorescence").length} selected` : "Any"}</span></div>
            <Chips param="fluorescence" options={facets.fluorescence} />
          </div>
        )}

        {/* Total Price / Location */}
        <div className="row2">
          <div className="card">
            <div className="chd"><h3>Total Price</h3></div>
            <div className="subtab"><b>Total Price</b><span>USD</span></div>
            <MinMax a={priceMin} b={priceMax} sa={setPriceMin} sb={setPriceMax}
              pa={facets.priceMin ? `$${Math.floor(facets.priceMin)}` : "$0"} pb={facets.priceMax ? `$${Math.ceil(facets.priceMax)}` : "$50000"} />
          </div>
          {facets.location.length > 0 && (
            <div className="card">
              <div className="chd"><h3>Location</h3><span className="note">{chosen("location").length ? `${chosen("location").length} selected` : "Any"}</span></div>
              <Chips param="location" options={facets.location} />
            </div>
          )}
        </div>

        {/* Growth Type */}
        {facets.growthType.length > 0 && (
          <div className="card">
            <div className="chd"><h3>Growth Type</h3></div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              {facets.growthType.map((g) => (
                <span key={g} className={`check ${chosen("growthType").includes(g) ? "on" : ""}`} onClick={() => toggle("growthType", g)}>
                  <span className="bx" />{g}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Measurements */}
        <div className="card">
          <div className="chd"><h3>Measurements</h3></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <div><div style={{ fontSize: 12, fontWeight: 600, color: "var(--i6)", marginBottom: 7 }}>Depth, %</div><MinMax a={depthMin} b={depthMax} sa={setDepthMin} sb={setDepthMax} pa="55" pb="75" /></div>
            <div><div style={{ fontSize: 12, fontWeight: 600, color: "var(--i6)", marginBottom: 7 }}>Table, %</div><MinMax a={tableMin} b={tableMax} sa={setTableMin} sb={setTableMax} pa="50" pb="70" /></div>
            <div><div style={{ fontSize: 12, fontWeight: 600, color: "var(--i6)", marginBottom: 7 }}>Ratio (L/W)</div><MinMax a={ratioMin} b={ratioMax} sa={setRatioMin} sb={setRatioMax} pa="1.00" pb="2.00" /></div>
          </div>
        </div>
      </div>

      <div className="foot" style={{ position: "sticky", bottom: 0 }}>
        <button className="btn out" onClick={reset}>Reset All</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, color: "var(--i6)" }}>≈ <b>{facets.total.toLocaleString()}</b> stones in stock</span>
        <button className="btn pri" onClick={apply}>Apply Filters{activeCount ? ` · ${activeCount}` : ""}</button>
      </div>
    </>
  );
}
