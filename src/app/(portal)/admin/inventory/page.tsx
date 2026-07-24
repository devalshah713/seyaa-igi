import { db } from "@/lib/db";
import Link from "next/link";

const label: Record<string, string> = { AVAILABLE: "Available", HOLD: "On Hold", MEMO: "On Memo", SOLD: "Sold" };
const color: Record<string, string> = { AVAILABLE: "var(--ok)", HOLD: "var(--hold)", MEMO: "var(--memo)", SOLD: "var(--sold)" };

export default async function AdminInventory() {
  const stones = await db.stone.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });
  return (
    <div className="content">
      <div style={{ display: "flex", alignItems: "center" }}>
        <div className="page-title"><h2>Inventory</h2><p>{stones.length} stones</p></div>
        <Link href="/admin/upload" className="btn sm pri" style={{ marginLeft: "auto" }}>Upload stock (Excel)</Link>
      </div>
      <div className="tbl-wrap">
        <table className="tbl" style={{ minWidth: 900 }}>
          <thead><tr><th>Ref</th><th>Shape</th><th>Ct</th><th>Col</th><th>Clar</th><th>Lab</th><th>Cost</th><th>$/ct</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {stones.map((s) => (
              <tr key={s.id}>
                <td className="ref">{s.ref}</td><td>{s.shape}</td><td className="tnum">{s.carat}</td><td>{s.color}</td><td>{s.clarity}</td><td>{s.lab}</td>
                <td className="tnum">{s.costPrice ? `$${s.costPrice}` : "—"}</td><td className="tnum">{s.pricePerCt ? `$${s.pricePerCt}` : "—"}</td>
                <td className="tot tnum">{s.totalPrice ? `$${s.totalPrice}` : "—"}</td>
                <td><span className="badge" style={{ background: "#f2efec", color: color[s.status] }}><span className="dot" style={{ background: color[s.status] }} />{label[s.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
