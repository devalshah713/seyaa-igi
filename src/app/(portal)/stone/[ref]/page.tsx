import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { StoneStatus } from "@prisma/client";
import { AddToCart, RequestButton } from "@/components/actions";

const STATUS_COLOR: Record<StoneStatus, string> = {
  AVAILABLE: "var(--ok)", HOLD: "var(--hold)", MEMO: "var(--memo)", SOLD: "var(--sold)",
};
const label: Record<StoneStatus, string> = { AVAILABLE: "Available", HOLD: "On Hold", MEMO: "On Memo", SOLD: "Sold" };

export default async function StonePage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const s = await db.stone.findUnique({ where: { ref } });
  if (!s) notFound();

  const specs: [string, string][] = [
    ["Lab", s.lab], ["Depth", s.depthPct ? `${s.depthPct}%` : "—"],
    ["Report #", s.reportNo ?? "—"], ["Table", s.tablePct ? `${s.tablePct}%` : "—"],
    ["Shape", s.shape], ["Ratio", s.ratio ? String(s.ratio) : "—"],
    ["Carat", String(s.carat)], ["Measurements", s.measurements ?? "—"],
    ["Color", s.color], ["Growth Type", s.growthType ?? "—"],
    ["Clarity", s.clarity], ["Treatment", s.treatment ?? "None"],
    ["Cut", s.cut ?? "—"], ["Location", s.location ?? "—"],
    ["Polish", s.polish ?? "—"], ["Fluorescence", s.fluorescence ?? "None"],
    ["Symmetry", s.symmetry ?? "—"], ["Growth", s.growthType ?? "—"],
  ];

  return (
    <>
      <div style={{ padding: "16px 26px 4px", maxWidth: 1320, margin: "0 auto", width: "100%" }}>
        <Link className="linka" href="/results">‹ Back to results</Link>
      </div>
      <div className="content" style={{ paddingTop: 8 }}>
        <div className="detail">
          <div>
            <div className="media-main gembox"><span style={{ fontSize: 120, color: "#cfc7bf" }}>◆</span></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "var(--i4)" }}>Stock #</span>
                <b style={{ fontSize: 13 }}>{s.ref}</b>
                <div style={{ flex: 1 }} />
                <span className="badge" style={{ background: "var(--okbg)", color: "#227a54" }}>
                  <span className="dot" style={{ background: STATUS_COLOR[s.status] }} />{label[s.status]}
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{s.shape} {s.carat}ct {s.color} {s.clarity}</div>
              <div style={{ fontSize: 13, color: "var(--i6)", marginTop: 4 }}>
                Lab-Grown · {s.lab} Certified · {s.growthType ?? "—"} · {s.location ?? "—"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
                <span className="tnum" style={{ fontSize: 30, fontWeight: 700, color: "var(--b)" }}>{s.totalPrice ? `$${s.totalPrice}` : "—"}</span>
                <span style={{ fontSize: 13, color: "var(--i4)" }}>total</span>
                {s.pricePerCt && <span className="tnum" style={{ fontSize: 14, fontWeight: 600, color: "var(--i6)" }}>${s.pricePerCt} / ct</span>}
              </div>
            </div>
            <div className="card">
              <div className="chd"><h3>Product Details</h3></div>
              <div className="spec-grid">
                {specs.map(([k, v], i) => <div className="sr" key={i}><span className="k">{k}</span><span className="v">{v}</span></div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="foot" style={{ position: "sticky", bottom: 0 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{s.shape} {s.carat}ct {s.color} {s.clarity}</div>
          <div style={{ fontSize: 12, color: "var(--i6)" }}>{s.totalPrice ? `$${s.totalPrice} total` : ""} · {label[s.status]}</div>
        </div>
        <div style={{ flex: 1 }} />
        {s.status === "AVAILABLE" ? (
          <>
            <RequestButton stoneId={s.id} kind="HOLD" />
            <RequestButton stoneId={s.id} kind="MEMO" />
            <AddToCart stoneId={s.id} />
          </>
        ) : (
          <span className="badge" style={{ background: "#f2efec", color: STATUS_COLOR[s.status] }}>
            <span className="dot" style={{ background: STATUS_COLOR[s.status] }} />{label[s.status]}
          </span>
        )}
      </div>
    </>
  );
}
