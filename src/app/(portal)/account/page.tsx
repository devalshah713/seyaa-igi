import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AccountPage() {
  const session = await getSession();
  const [orders, requests] = await Promise.all([
    db.order.findMany({ where: { customerId: session!.id }, include: { items: true, assignedTo: true }, orderBy: { createdAt: "desc" } }),
    db.tradeRequest.findMany({ where: { userId: session!.id }, include: { stone: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="content">
      <div className="page-title"><h2>My Account</h2><p>Your orders, memos and holds</p></div>

      <div className="card">
        <div className="chd"><h3>My Orders</h3><span className="note">{orders.length}</span></div>
        {orders.length === 0 ? <p style={{ color: "var(--i6)", fontSize: 13, margin: 0 }}>No orders yet.</p> : (
          <div className="tbl-wrap">
            <table className="tbl" style={{ minWidth: 640 }}>
              <thead><tr><th>Order</th><th>Stones</th><th>Indicative</th><th>Status</th><th>Salesperson</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="ref">{o.orderNo}</td>
                    <td>{o.items.length}</td>
                    <td className="tot tnum">${o.indicativeTotal}</td>
                    <td>{o.status}</td>
                    <td>{o.assignedTo ? o.assignedTo.firstName : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="chd"><h3>My Memos &amp; Holds</h3><span className="note">{requests.length}</span></div>
        {requests.length === 0 ? <p style={{ color: "var(--i6)", fontSize: 13, margin: 0 }}>No memo or hold requests yet.</p> : (
          <div className="tbl-wrap">
            <table className="tbl" style={{ minWidth: 560 }}>
              <thead><tr><th>Type</th><th>Stone</th><th>Terms</th><th>Status</th></tr></thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.kind}</td>
                    <td className="ref">{r.stone.ref}</td>
                    <td>{r.kind === "MEMO" ? `${r.days ?? "—"} days` : `${r.hours ?? "—"} hours`}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
