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

  const where: Prisma.StoneWhereInput = {
    ...(sp.shape ? { shape: sp.shape } : {}),
    ...(sp.color ? { color: sp.color } : {}),
    ...(sp.clarity ? { clarity: sp.clarity } : {}),
    ...(sp.caratMin || sp.caratMax
      ? { carat: { gte: sp.caratMin ? Number(sp.caratMin) : undefined, lte: sp.caratMax ? Number(sp.caratMax) : undefined } }
      : {}),
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
          <div className="tbl-wrap">
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
