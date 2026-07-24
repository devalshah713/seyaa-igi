import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminDashboard() {
  const [inStock, onHold, onMemo, sold, pendingReq, pendingCust, orders] = await Promise.all([
    db.stone.count({ where: { status: "AVAILABLE" } }),
    db.stone.count({ where: { status: "HOLD" } }),
    db.stone.count({ where: { status: "MEMO" } }),
    db.stone.count({ where: { status: "SOLD" } }),
    db.tradeRequest.count({ where: { status: "PENDING" } }),
    db.user.count({ where: { role: "CUSTOMER", status: "PENDING" } }),
    db.order.count({ where: { status: "NEW" } }),
  ]);

  const Stat = ({ dot, label, value, href }: { dot: string; label: string; value: number; href: string }) => (
    <Link href={href} className="stat" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="lb"><span className="dot" style={{ background: dot }} />{label}</div>
      <div className="big tnum">{value}</div>
    </Link>
  );

  return (
    <div className="content">
      <div className="page-title"><h2>Dashboard</h2><p>Inventory &amp; requests at a glance</p></div>
      <div className="stats">
        <Stat dot="var(--ok)" label="Stones in stock" value={inStock} href="/admin/inventory" />
        <Stat dot="var(--hold)" label="On hold / memo" value={onHold + onMemo} href="/admin/inventory" />
        <Stat dot="var(--b)" label="Pending requests" value={pendingReq + orders} href="/admin/approvals" />
        <Stat dot="var(--sold)" label="Sold" value={sold} href="/admin/inventory" />
      </div>
      <div className="row2">
        <Link href="/admin/approvals" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="chd"><h3>New orders to assign</h3><span className="note">{orders}</span></div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--i6)" }}>Assign incoming Order IDs to a salesperson.</p>
        </Link>
        <Link href="/admin/customers" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="chd"><h3>KYC applications</h3><span className="note">{pendingCust} pending</span></div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--i6)" }}>Review Aadhaar / GST and approve trade accounts.</p>
        </Link>
      </div>
    </div>
  );
}
