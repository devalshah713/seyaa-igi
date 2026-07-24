"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShapeIcon } from "./shape-icons";

type Facets = {
  shape: string[]; color: string[]; clarity: string[]; cut: string[]; polish: string[];
  symmetry: string[]; fluorescence: string[]; growthType: string[]; location: string[];
  caratMin: number; caratMax: number; priceMin: number; priceMax: number; total: number;
};

// Static lists reproduced from the approved prototype.
const SHAPES = ["Round", "Oval", "Pear", "Cushion", "Emerald", "Radiant", "Princess", "Asscher", "Marquise", "Heart", "Trilliant", "Baguette", "Square", "Hexagon"];
const COLORS = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q"];
const FANCY_COLORS = ["Yellow", "Orange", "Pink", "Red", "Purple", "Violet", "Blue", "Green", "Brown", "Champagne", "Gray", "Black"];
const CLARITY = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "SI3", "I1", "I2", "I3"];
const GRADES = ["Ideal", "Excellent", "Very Good", "Good", "Fair", "Poor"];
const FLUOR: [string, string][] = [["None", "None"], ["Faint", "Faint"], ["Medium", "Medium"], ["Strong", "Strong"], ["V Strong", "Very Strong"]];
const CARAT_PRESETS: [string, string, string][] = [
  ["0.30", "0.39", "0.30–0.39"], ["0.40", "0.49", "0.40–0.49"], ["0.50", "0.69", "0.50–0.69"],
  ["0.70", "0.89", "0.70–0.89"], ["0.90", "0.99", "0.90–0.99"], ["1.00", "1.49", "1.00–1.49"],
  ["1.50", "1.99", "1.50–1.99"], ["2.00", "2.99", "2.00–2.99"], ["3.00", "3.99", "3.00–3.99"],
  ["4.00", "4.99", "4.00–4.99"], ["5.00", "5.99", "5.00–5.99"], ["10", "", "10+"],
];

// ---- Module-level helpers (defined ONCE so inputs keep focus) ----
function Field({ lb, v, set, ph }: { lb: string; v: string; set: (s: string) => void; ph: string }) {
  return (
    <div className="field" style={{ flex: 1 }}>
      <div className="lb">{lb}</div>
      <input value={v} onChange={(e) => set(e.target.value)} placeholder={ph} inputMode="decimal"
        style={{ border: 0, background: "transparent", padding: 0, fontSize: 14, fontWeight: 500, width: "100%" }} />
    </div>
  );
}
function MinMax({ a, b, sa, sb, pa, pb }: { a: string; b: string; sa: (s: string) => void; sb: (s: string) => void; pa: string; pb: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <Field lb="Min" v={a} set={sa} ph={pa} /><span style={{ color: "var(--i4)" }}>›</span><Field lb="Max" v={b} set={sb} ph={pb} />
    </div>
  );
}
function StaticRange({ label }: { label: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--i6)", marginBottom: 7 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div className="field" style={{ flex: 1 }}><div className="lb">Min</div></div>
        <span style={{ color: "var(--i4)" }}>›</span>
        <div className="field" style={{ flex: 1 }}><div className="lb">Max</div></div>
      </div>
    </div>
  );
}

export default function SearchFilters({ facets }: { facets: Facets }) {
  const router = useRouter();
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [colorTab, setColorTab] = useState<"white" | "fancy">("white");
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
  const chip = (param: string, label: string, value?: string) => {
    const v = value ?? label;
    return <span key={label} className={`chip wide ${chosen(param).includes(v) ? "sel" : ""}`} onClick={() => toggle(param, v)}>{label}</span>;
  };

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

  return (
    <>
      <div className="content">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
          <div className="page-title"><h2>Search Inventory</h2><p>Lab-Grown Diamonds · IGI Certified · Seyaa Solitaire stock</p></div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span className="chip sel">Classic Search</span>
          </div>
        </div>

        {/* Shape */}
        <div className="card">
          <div className="chd"><h3>Shape</h3><span className="note">{chosen("shape").length ? `${chosen("shape").length} selected` : "Any"}</span></div>
          <div className="wrap">
            {SHAPES.map((s) => {
              const on = chosen("shape").includes(s);
              return (
                <span key={s} className={`chip shape ${on ? "sel" : ""}`} onClick={() => toggle("shape", s)}>
                  <ShapeIcon name={s} selected={on} /><span>{s}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Carat */}
        <div className="card">
          <div className="chd"><h3>Carat</h3><span className="note">{facets.caratMax ? `${facets.caratMin}–${facets.caratMax} ct in stock` : ""}</span></div>
          <div style={{ marginBottom: 14 }}><MinMax a={caratMin} b={caratMax} sa={setCaratMin} sb={setCaratMax} pa="Min, ct" pb="Max, ct" /></div>
          <div className="wrap">
            {CARAT_PRESETS.map(([lo, hi, label]) => {
              const on = caratMin === lo && caratMax === hi;
              return <span key={label} className={`chip wide ${on ? "sel" : ""}`} onClick={() => { setCaratMin(on ? "" : lo); setCaratMax(on ? "" : hi); }}>{label}</span>;
            })}
          </div>
        </div>

        {/* Color */}
        <div className="card">
          <div className="chd"><h3>Color</h3><span className="note">{chosen("color").length ? `${chosen("color").length} selected` : "Any"}</span></div>
          <div className="subtab">
            <b style={{ cursor: "pointer", color: colorTab === "white" ? "var(--b)" : "var(--i4)", fontWeight: colorTab === "white" ? 700 : 500, fontSize: 13 }} onClick={() => setColorTab("white")}>White</b>
            <b style={{ cursor: "pointer", color: colorTab === "fancy" ? "var(--b)" : "var(--i4)", fontWeight: colorTab === "fancy" ? 700 : 500, fontSize: 13 }} onClick={() => setColorTab("fancy")}>Fancy</b>
          </div>
          {colorTab === "white" && <span className="check"><span className="bx" />No BGM (Brown / Green / Milky)</span>}
          <div className="wrap" style={{ marginTop: 12 }}>
            {(colorTab === "white" ? COLORS : FANCY_COLORS).map((c) => chip("color", c))}
          </div>
        </div>

        {/* Clarity */}
        <div className="card">
          <div className="chd"><h3>Clarity</h3><span className="note">{chosen("clarity").length ? `${chosen("clarity").length} selected` : "Any"}</span></div>
          <span className="check"><span className="bx" />Eye Clean</span>
          <div className="wrap" style={{ marginTop: 12 }}>{CLARITY.map((c) => chip("clarity", c))}</div>
        </div>

        {/* Cut, Polish & Symmetry */}
        <div className="card">
          <div className="chd"><h3>Cut, Polish &amp; Symmetry</h3></div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
            <span className="check"><span className="bx" />Hearts &amp; Arrows</span>
            <span className="chip sel">8X</span><span className="chip">3X+</span><span className="chip">3VG+</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {([["Cut", "cut"], ["Polish", "polish"], ["Symmetry", "symmetry"]] as [string, string][]).map(([label, param]) => (
              <div className="cps-row" key={param}>
                <b className="cps-lb">{label}</b>
                <div className="wrap"><span className="chip">8X</span>{GRADES.map((g) => <span key={g} className={`chip ${chosen(param).includes(g) ? "sel" : ""}`} onClick={() => toggle(param, g)}>{g}</span>)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Fluorescence */}
        <div className="card">
          <div className="chd"><h3>Fluorescence</h3><span className="note">{chosen("fluorescence").length ? `${chosen("fluorescence").length} selected` : "Any"}</span></div>
          <div className="wrap">{FLUOR.map(([label, value]) => chip("fluorescence", label, value))}</div>
        </div>

        {/* Total Price / Location */}
        <div className="row2">
          <div className="card">
            <div className="chd"><h3>Total Price</h3></div>
            <div className="subtab"><b>Total Price</b><span>Price / ct</span></div>
            <MinMax a={priceMin} b={priceMax} sa={setPriceMin} sb={setPriceMax}
              pa={facets.priceMin ? `$${Math.floor(facets.priceMin)}` : "Min, $"} pb={facets.priceMax ? `$${Math.ceil(facets.priceMax)}` : "Max, $"} />
          </div>
          <div className="card">
            <div className="chd"><h3>Location</h3><span className="note">{chosen("location").length ? `${chosen("location").length} selected` : "Any"}</span></div>
            {facets.location.length > 0 && <div className="wrap" style={{ marginBottom: 12 }}>{facets.location.map((l) => chip("location", l))}</div>}
            <span className="check"><span className="bx" />Exclude selected location(s)</span>
          </div>
        </div>

        {/* Growth Type / Treatment */}
        <div className="row2">
          <div className="card">
            <div className="chd"><h3>Growth Type</h3></div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              {["CVD", "HPHT"].map((g) => (
                <span key={g} className={`check ${chosen("growthType").includes(g) ? "on" : ""}`} onClick={() => toggle("growthType", g)}><span className="bx" />{g}</span>
              ))}
              <span className="check"><span className="bx" />Others</span>
            </div>
          </div>
          <div className="card">
            <div className="chd"><h3>Treatment</h3></div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              <span className="check"><span className="bx" />As Grown</span><span className="check"><span className="bx" />Treated</span><span className="check"><span className="bx" />Unknown</span>
            </div>
          </div>
        </div>

        {/* Measurements */}
        <div className="card">
          <div className="chd"><h3>Measurements</h3></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <div><div style={{ fontSize: 12, fontWeight: 600, color: "var(--i6)", marginBottom: 7 }}>Depth, %</div><MinMax a={depthMin} b={depthMax} sa={setDepthMin} sb={setDepthMax} pa="Min" pb="Max" /></div>
            <div><div style={{ fontSize: 12, fontWeight: 600, color: "var(--i6)", marginBottom: 7 }}>Table, %</div><MinMax a={tableMin} b={tableMax} sa={setTableMin} sb={setTableMax} pa="Min" pb="Max" /></div>
            <div><div style={{ fontSize: 12, fontWeight: 600, color: "var(--i6)", marginBottom: 7 }}>Ratio</div><MinMax a={ratioMin} b={ratioMax} sa={setRatioMin} sb={setRatioMax} pa="Min" pb="Max" /></div>
            <StaticRange label="Length, mm" />
            <StaticRange label="Width, mm" />
            <StaticRange label="Depth, mm" />
          </div>
        </div>
      </div>

      <div className="foot" style={{ position: "sticky", bottom: 0 }}>
        <button className="btn out" onClick={reset}>Reset All</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, color: "var(--i6)" }}>≈ <b>{facets.total.toLocaleString()}</b> stones match your criteria</span>
        <button className="btn pri" onClick={apply}>Apply Filters</button>
      </div>
    </>
  );
}
