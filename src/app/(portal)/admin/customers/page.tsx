import { db } from "@/lib/db";
import { CustomerDecision, SetPassword } from "@/components/admin-actions";

const color: Record<string, string> = { PENDING: "var(--hold)", APPROVED: "var(--ok)", REJECTED: "var(--sold)", SUSPENDED: "var(--sold)" };

export default async function AdminCustomers() {
  const customers = await db.user.findMany({
    where: { role: "CUSTOMER" },
    include: { kycDocuments: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="content">
      <div className="page-title"><h2>Customers</h2><p>Approve trade applications &amp; manage KYC</p></div>
      <div className="tbl-wrap">
        <table className="tbl" style={{ minWidth: 860 }}>
          <thead><tr><th>Company</th><th>Contact</th><th>GST</th><th>Documents</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="ref">{c.companyName || `${c.firstName} ${c.lastName}`}</td>
                <td>{c.firstName} {c.lastName}<br /><span style={{ color: "var(--i4)" }}>{c.email}</span></td>
                <td>{c.gstNumber || "—"}</td>
                <td>{c.kycDocuments.map((d) => (
                  <a key={d.id} className="linka" href={d.fileUrl} target="_blank" rel="noopener" style={{ marginRight: 8 }}>{d.type}</a>
                ))}</td>
                <td><span className="badge" style={{ background: "#f2efec", color: color[c.status] }}><span className="dot" style={{ background: color[c.status] }} />{c.status}</span></td>
                <td>{c.status === "PENDING" ? <CustomerDecision id={c.id} /> : c.status === "APPROVED" ? <SetPassword id={c.id} /> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
