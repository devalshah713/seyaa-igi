"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShapeIcon } from "./shape-icons";

type Facets = {
  shape: string[]; color: string[]; clarity: string[]; cut: string[]; polish: string[];
  symmetry: string[]; fluorescence: string[]; growthType: string[]; location: string[];
  caratMin: number; caratMax: number; priceMin: number; priceMax: number; total: number;
};

// Static lists reproduced exactly from the approved prototype.
const SHAPES = ["Round", "Oval", "Pear", "Cushion", "Emerald", "Radiant", "Princess", "Asscher", "Marquise", "Heart", "Trilliant", "Baguette", "Square", "Hexagon"];
const COLORS = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q"];
const CLARITY = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "SI3", "I1", "I2", "I3"];
const GRADES = ["Ideal", "Excellent", "Very Good", "Good", "Fair", "Poor"];
const FLUOR: [string, string][] = [["None", "None"], ["Faint", "Faint"], ["Medium", "Medium"], ["Strong", "Strong"], ["V Strong", "Very Strong"]];
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

  // Reusable pieces --------------------------------------------------------
  const Chip = ({ param, label, value }: { param: string; label: string; value?: string }) => {
    const v = value ?? label;
    return <span className={`chip wide ${chosen(param).includes(v) ? "sel" : ""}`} onClick={() => toggle(param, v)}>{label}</span>;
  };
  const Deco = ({ label, sel: s }: { label: string; sel?: boolean }) => <span className={`chip ${s ? "sel" : ""}`}>{label}</span>;
  const Check = ({ label }: { label: string }) => <span className="check"><span className="bx" />{label}</span>;
  const Field = ({ lb, v, set, ph }: { lb: string; v: string; set: (s: string) => void; ph: string }) => (
    <div className="field" style={{ flex: 1 }}>
      <div className="lb">{lb}</div>
      <input value={v} onChange={(e) => set(e.target.value)} placeholder={ph} inputMode="decimal"
        style={{ border: 0, background: "transparent", padding: 0, fontSize: 14, fontWeight: 500, width: "100%" }} />
    </div>
  );
  const MinMax = ({ a, b, sa, sb, pa, pb }: { a: string; b: string; sa: (s: string) => void; sb: (s: string) => void; pa: string; pb: string }) => (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <Field lb="Min" v={a} set={sa} ph={pa} /><span style={{ color: "var(--i4)" }}>›</span><Field lb="Max" v={b} set={sb} ph={pb} />
    </div>
  );
  const MeasCol = ({ label, a, b, sa, sb }: { label: string; a?: string; b?: string; sa?: (s: string) => void; sb?: (s: string) => void }) => (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--i6)", marginBottom: 7 }}>{label}</div>
      {sa && sb ? <MinMax a={a!} b={b!} sa={sa} sb={sb} pa="Min" pb="Max" />
        : <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="field" style={{ flex: 1 }}><div className="lb">Min</div></div>
            <span style={{ color: "var(--i4)" }}>›</span>
            <div className="field" style={{ flex: 1 }}><div className="lb">Max</div></div>
          </div>}
    </div>
  );

  return (
    <>
      <div className="content">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
          <div className="page-title"><h2>Search Inventory</h2><p>Lab-Grown Diamonds · IGI Certified · Seyaa Solitaire stock</p></div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span className="chip sel">Classic Search</span>
            <span className="chip">AI Search <b style={{ color: "var(--b)", fontSize: 9 }}>βeta</b></span>
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
          <div className="subtab"><b>White</b><span>Fancy</span></div>
          <Check label="No BGM (Brown / Green / Milky)" />
          <div className="wrap" style={{ marginTop: 12 }}>{COLORS.map((c) => <Chip key={c} param="color" label={c} />)}</div>
        </div>

        {/* Clarity */}
        <div className="card">
          <div className="chd"><h3>Clarity</h3><span className="note">{chosen("clarity").length ? `${chosen("clarity").length} selected` : "Any"}</span></div>
          <Check label="Eye Clean" />
          <div className="wrap" style={{ marginTop: 12 }}>{CLARITY.map((c) => <Chip key={c} param="clarity" label={c} />)}</div>
        </div>

        {/* Cut, Polish & Symmetry */}
        <div className="card">
          <div className="chd"><h3>Cut, Polish &amp; Symmetry</h3></div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
            <Check label="Hearts & Arrows" /><Deco label="8X" sel /><Deco label="3X+" /><Deco label="3VG+" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {([["Cut", "cut"], ["Polish", "polish"], ["Symmetry", "symmetry"]] as [string, string][]).map(([label, param]) => (
              <div className="cps-row" key={param}>
                <b className="cps-lb">{label}</b>
                <div className="wrap"><Deco label="8X" />{GRADES.map((g) => <span key={g} className={`chip ${chosen(param).includes(g) ? "sel" : ""}`} onClick={() => toggle(param, g)}>{g}</span>)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Fluorescence */}
        <div className="card">
          <div className="chd"><h3>Fluorescence</h3><span className="note">{chosen("fluorescence").length ? `${chosen("fluorescence").length} selected` : "Any"}</span></div>
          <div className="wrap">{FLUOR.map(([label, value]) => <Chip key={value} param="fluorescence" label={label} value={value} />)}</div>
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
            {facets.location.length > 0 && <div className="wrap" style={{ marginBottom: 12 }}>{facets.location.map((l) => <Chip key={l} param="location" label={l} />)}</div>}
            <Check label="Exclude selected location(s)" />
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
              <Check label="Others" />
            </div>
          </div>
          <div className="card">
            <div className="chd"><h3>Treatment</h3></div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}><Check label="As Grown" /><Check label="Treated" /><Check label="Unknown" /></div>
          </div>
        </div>

        {/* Measurements */}
        <div className="card">
          <div className="chd"><h3>Measurements</h3></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <MeasCol label="Depth, %" a={depthMin} b={depthMax} sa={setDepthMin} sb={setDepthMax} />
            <MeasCol label="Table, %" a={tableMin} b={tableMax} sa={setTableMin} sb={setTableMax} />
            <MeasCol label="Ratio" a={ratioMin} b={ratioMax} sa={setRatioMin} sb={setRatioMax} />
            <MeasCol label="Length, mm" />
            <MeasCol label="Width, mm" />
            <MeasCol label="Depth, mm" />
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
