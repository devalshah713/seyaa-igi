"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SHAPES = ["Round", "Oval", "Pear", "Cushion", "Emerald", "Radiant", "Princess", "Asscher", "Marquise", "Heart"];
const COLORS = ["D", "E", "F", "G", "H", "I", "J", "K"];
const CLARITY = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2"];

export default function SearchPage() {
  const router = useRouter();
  const [shape, setShape] = useState<string | null>("Round");
  const [color, setColor] = useState<string | null>(null);
  const [clarity, setClarity] = useState<string | null>(null);
  const [caratMin, setCaratMin] = useState("");
  const [caratMax, setCaratMax] = useState("");

  function apply() {
    const p = new URLSearchParams();
    if (shape) p.set("shape", shape);
    if (color) p.set("color", color);
    if (clarity) p.set("clarity", clarity);
    if (caratMin) p.set("caratMin", caratMin);
    if (caratMax) p.set("caratMax", caratMax);
    router.push("/results?" + p.toString());
  }

  const Chip = ({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) => (
    <span className={`chip ${on ? "sel" : ""}`} onClick={onClick}>{label}</span>
  );

  return (
    <>
      <div className="content">
        <div className="page-title">
          <h2>Search Inventory</h2>
          <p>Lab-Grown Diamonds · IGI Certified · Seyaa Solitaire stock</p>
        </div>

        <div className="card">
          <div className="chd"><h3>Shape</h3><span className="note">{shape ? `Selected: ${shape}` : "Any"}</span></div>
          <div className="wrap">
            {SHAPES.map((s) => <Chip key={s} label={s} on={shape === s} onClick={() => setShape(shape === s ? null : s)} />)}
          </div>
        </div>

        <div className="card">
          <div className="chd"><h3>Carat</h3></div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="field" style={{ width: 160 }}>
              <div className="lb">Min, ct</div>
              <input value={caratMin} onChange={(e) => setCaratMin(e.target.value)} placeholder="0.30"
                style={{ border: 0, background: "transparent", padding: 0, fontSize: 13, fontWeight: 500, width: "100%" }} />
            </div>
            <span style={{ color: "var(--i4)" }}>›</span>
            <div className="field" style={{ width: 160 }}>
              <div className="lb">Max, ct</div>
              <input value={caratMax} onChange={(e) => setCaratMax(e.target.value)} placeholder="10"
                style={{ border: 0, background: "transparent", padding: 0, fontSize: 13, fontWeight: 500, width: "100%" }} />
            </div>
          </div>
        </div>

        <div className="row2">
          <div className="card">
            <div className="chd"><h3>Color</h3></div>
            <div className="wrap">
              {COLORS.map((c) => <Chip key={c} label={c} on={color === c} onClick={() => setColor(color === c ? null : c)} />)}
            </div>
          </div>
          <div className="card">
            <div className="chd"><h3>Clarity</h3></div>
            <div className="wrap">
              {CLARITY.map((c) => <Chip key={c} label={c} on={clarity === c} onClick={() => setClarity(clarity === c ? null : c)} />)}
            </div>
          </div>
        </div>
      </div>

      <div className="foot" style={{ position: "sticky", bottom: 0 }}>
        <button className="btn" onClick={() => { setShape(null); setColor(null); setClarity(null); setCaratMin(""); setCaratMax(""); }}>Reset All</button>
        <div style={{ flex: 1 }} />
        <button className="btn pri" onClick={apply}>Apply Filters</button>
      </div>
    </>
  );
}
