import Link from "next/link";
import { db } from "@/lib/db";
import type { Prisma, StoneStatus } from "@prisma/client";
import { AddToCart, ViewToggle } from "@/components/actions";

const STATUS_COLOR: Record<StoneStatus, string> = {
  AVAILABLE: "var(--ok)", HOLD: "var(--hold)", MEMO: "var(--memo)", SOLD: "var(--sold)",
};
const label: Record<StoneStatus, string> = { AVAILABLE: "Available", HOLD: "On Hold", MEMO: "On Memo", SOLD: "Sold" };

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const view = sp.view === "grid" ? "grid" : "list";

  // Multi-select filters arrive comma-separated → Prisma `in`.
  const inList = (v?: string) => (v ? { in: v.split(",").filter(Boolean) } : undefined);
  // Numeric range → Prisma gte/lte (only set when a bound is present).
  const range = (min?: string, max?: string) =>
    min || max ? { gte: min ? Number(min) : undefined, lte: max ? Number(max) : undefined } : undefined;

  const where: Prisma.StoneWhereInput = {
    ...(inList(sp.shape) ? { shape: inList(sp.shape) } : {}),
    ...(inList(sp.color) ? { color: inList(sp.color) } : {}),
    ...(inList(sp.clarity) ? { clarity: inList(sp.clarity) } : {}),
    ...(inList(sp.cut) ? { cut: inList(sp.cut) } : {}),
    ...(inList(sp.polish) ? { polish: inList(sp.polish) } : {}),
    ...(inList(sp.symmetry) ? { symmetry: inList(sp.symmetry) } : {}),
    ...(inList(sp.fluorescence) ? { fluorescence: inList(sp.fluorescence) } : {}),
    ...(inList(sp.growth) ? { growthType: inList(sp.growth) } : {}),
    ...(inList(sp.location) ? { location: inList(sp.location) } : {}),
    ...(range(sp.caratMin, sp.caratMax) ? { carat: range(sp.caratMin, sp.caratMax) } : {}),
    ...(range(sp.priceMin, sp.priceMax) ? { totalPrice: range(sp.priceMin, sp.priceMax) } : {}),
    ...(range(sp.depthMin, sp.depthMax) ? { depthPct: range(sp.depthMin, sp.depthMax) } : {}),
    ...(range(sp.tableMin, sp.tableMax) ? { tablePct: range(sp.tableMin, sp.tableMax) } : {}),
    ...(range(sp.ratioMin, sp.ratioMax) ? { ratio: range(sp.ratioMin, sp.ratioMax) } : {}),
  };

  const [total, stones] = await Promise.all([
    db.stone.count({ where }),
    db.stone.findMany({ where, take: 60, orderBy: { totalPrice: "asc" } }),
  ]);

  return (
    <>
      <div className="toolbar">
        <Link className="linka" href="/search">‹ Modify Filters</Link>
        <span style={{ fontSize: 13 }}><b>{stones.length}</b> <span style={{ color: "var(--i6)" }}>of {total} results</span></span>
        <div style={{ flex: 1 }} />
        <ViewToggle view={view} />
      </div>

      <div className="content">
        {stones.length === 0 && <div className="card">No stones match these filters. <Link className="linka" href="/search">Adjust your search →</Link></div>}

        {view === "list" && stones.length > 0 && (
          <div className="tbl-wrap res-table">
            <table className="tbl" style={{ minWidth: 1080 }}>
              <thead>
                <tr>
                  <th>Status</th><th>Seyaa Ref</th><th>Shape</th><th>Ct</th><th>Col</th><th>Clar</th>
                  <th>Cut</th><th>Pol</th><th>Sym</th><th>Fluor</th><th>Location</th><th>$/ct</th><th>Total</th><th></th>
                </tr>
              </thead>
              <tbody>
                {stones.map((s) => (
                  <tr key={s.id}>
                    <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span className="dot" style={{ background: STATUS_COLOR[s.status] }} />{label[s.status]}</span></td>
                    <td className="ref"><Link className="linka" href={`/stone/${s.ref}`}>{s.ref}</Link></td>
                    <td>{s.shape}</td><td className="tnum">{s.carat}</td><td>{s.color}</td><td>{s.clarity}</td>
                    <td>{s.cut ?? "—"}</td><td>{s.polish ?? "—"}</td><td>{s.symmetry ?? "—"}</td><td>{s.fluorescence ?? "None"}</td>
                    <td>{s.location ?? "—"}</td><td className="tnum">{s.pricePerCt ? `$${s.pricePerCt}` : "—"}</td>
                    <td className="tot tnum">{s.totalPrice ? `$${s.totalPrice}` : "—"}</td>
                    <td>{s.status === "AVAILABLE" ? <AddToCart stoneId={s.id} small /> : <Link className="linka" href={`/stone/${s.ref}`}>View</Link>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === "list" && stones.length > 0 && (
          <div className="res-cards">
            {stones.map((s) => (
              <div key={s.id} className="res-card">
                <div className="top">
                  <div>
                    <Link className="rref" href={`/stone/${s.ref}`}>{s.ref}</Link>
                    <div className="rsub">{s.shape} · {s.carat}ct · {s.color ?? "—"} · {s.clarity ?? "—"}</div>
                  </div>
                  <div className="rprice">
                    <b className="tnum">{s.totalPrice ? `$${s.totalPrice}` : "—"}</b>
                    <div style={{ fontSize: 11, color: "var(--i4)" }}>{s.pricePerCt ? `$${s.pricePerCt}/ct` : ""}</div>
                  </div>
                </div>
                <div className="rmeta">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span className="dot" style={{ background: STATUS_COLOR[s.status] }} />{label[s.status]}
                  </span>
                  {s.cut && <span>Cut {s.cut}</span>}
                  {s.polish && <span>Pol {s.polish}</span>}
                  {s.symmetry && <span>Sym {s.symmetry}</span>}
                  {s.location && <span>{s.location}</span>}
                </div>
                <div className="ract">
                  <Link className="btn sm out" href={`/stone/${s.ref}`}>Details</Link>
                  {s.status === "AVAILABLE" && <AddToCart stoneId={s.id} small />}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "grid" && stones.length > 0 && (
          <div className="cardgrid">
            {stones.map((s) => (
              <div key={s.id} className="scard">
                <div className="gembox" style={{ height: 150, position: "relative" }}>
                  <span className="badge" style={{ position: "absolute", top: 10, left: 10, background: "#fff" }}>
                    <span className="dot" style={{ background: STATUS_COLOR[s.status] }} />{label[s.status]}
                  </span>
                  <span style={{ fontSize: 40, color: "#cfc7bf" }}>◆</span>
                </div>
                <div style={{ padding: "13px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link className="linka" href={`/stone/${s.ref}`} style={{ color: "var(--ink)", fontWeight: 600 }}>{s.ref}</Link>
                  <div style={{ fontSize: 12, color: "var(--i6)" }}>{s.shape} · {s.carat}ct · {s.color} · {s.clarity}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <b className="tnum" style={{ fontSize: 16 }}>{s.totalPrice ? `$${s.totalPrice}` : "—"}</b>
                    <span className="tnum" style={{ fontSize: 11, color: "var(--i4)" }}>{s.pricePerCt ? `$${s.pricePerCt}/ct` : ""}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link className="btn sm" style={{ flex: 1 }} href={`/stone/${s.ref}`}>Details</Link>
                    {s.status === "AVAILABLE" && <AddToCart stoneId={s.id} small />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
