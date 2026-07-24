import { db } from "@/lib/db";
import { AssignOrder, RequestDecision } from "@/components/admin-actions";

export default async function AdminApprovals() {
  const [orders, requests, salesRaw] = await Promise.all([
    db.order.findMany({ where: { status: { in: ["NEW", "ASSIGNED"] } }, include: { customer: true, assignedTo: true, items: true }, orderBy: { createdAt: "desc" } }),
    db.tradeRequest.findMany({ where: { status: "PENDING" }, include: { stone: true, user: true }, orderBy: { createdAt: "desc" } }),
    db.user.findMany({ where: { role: "SALES" }, select: { id: true, firstName: true, lastName: true } }),
  ]);
  const sales = salesRaw.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }));

  return (
    <div className="content">
      <div className="page-title"><h2>Requests &amp; Approvals</h2><p>Assign orders and approve memo / hold requests</p></div>

      <div className="card">
        <div className="chd"><h3>Orders</h3><span className="note">{orders.length}</span></div>
        {orders.length === 0 ? <p style={{ color: "var(--i6)", fontSize: 13, margin: 0 }}>No open orders.</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map((o) => (
              <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", border: "1px solid var(--bd)", borderRadius: 10, flexWrap: "wrap" }}>
                <span className="badge" style={{ background: "#f2efec", color: "var(--b)" }}><span className="dot" style={{ background: "var(--b)" }} />Order</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{o.orderNo} · {o.customer.companyName || o.customer.firstName}</div>
                  <div style={{ fontSize: 12, color: "var(--i6)" }}>{o.items.length} stones · ~${o.indicativeTotal} · {o.status}</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  {o.assignedTo ? <span style={{ fontSize: 12, color: "var(--i6)" }}>Assigned — {o.assignedTo.firstName}</span> : <AssignOrder id={o.id} sales={sales} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="chd"><h3>Memo &amp; Hold</h3><span className="note">{requests.length}</span></div>
        {requests.length === 0 ? <p style={{ color: "var(--i6)", fontSize: 13, margin: 0 }}>No pending requests.</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {requests.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", border: "1px solid var(--bd)", borderRadius: 10, flexWrap: "wrap" }}>
                <span className="badge" style={{ background: "#f2efec", color: r.kind === "MEMO" ? "var(--memo)" : "var(--hold)" }}>
                  <span className="dot" style={{ background: r.kind === "MEMO" ? "var(--memo)" : "var(--hold)" }} />{r.kind}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.stone.ref} · {r.stone.shape} {r.stone.carat}ct</div>
                  <div style={{ fontSize: 12, color: "var(--i6)" }}>{r.user.companyName || r.user.firstName} · {r.kind === "MEMO" ? `${r.days ?? "—"} days` : `${r.hours ?? "—"} hours`}</div>
                </div>
                <div style={{ marginLeft: "auto" }}><RequestDecision id={r.id} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
