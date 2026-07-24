import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateOrder, RemoveFromCart } from "@/components/actions";

export default async function CartPage() {
  const session = await getSession();
  const items = await db.cartItem.findMany({
    where: { userId: session!.id },
    include: { stone: true },
    orderBy: { createdAt: "desc" },
  });
  const total = items.reduce((s, i) => s + (i.stone.totalPrice ?? 0), 0);

  return (
    <div className="content">
      <div className="page-title">
        <h2>Your Cart</h2>
        <p>Selected stones — create an Order ID and our team follows up. No online payment.</p>
      </div>

      {items.length === 0 ? (
        <div className="card">Your cart is empty. <Link className="linka" href="/search">Search inventory →</Link></div>
      ) : (
        <div className="detail" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--hair)", fontWeight: 700, fontSize: 14 }}>
              {items.length} stone{items.length !== 1 ? "s" : ""} in cart
            </div>
            {items.map((i) => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--hair)" }}>
                <div className="gembox" style={{ width: 52, height: 44, borderRadius: 9 }}><span style={{ color: "#b9afa6" }}>◆</span></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{i.stone.shape} {i.stone.carat}ct {i.stone.color} {i.stone.clarity}</div>
                  <div style={{ fontSize: 12, color: "var(--i6)" }}>{i.stone.ref} · {i.stone.lab} · {i.stone.location ?? "—"}</div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div className="tnum" style={{ fontWeight: 700 }}>{i.stone.totalPrice ? `$${i.stone.totalPrice}` : "—"}</div>
                  <div style={{ fontSize: 11, color: "var(--i4)" }}>indicative</div>
                </div>
                <RemoveFromCart stoneId={i.stone.id} />
              </div>
            ))}
          </div>

          <div className="card" style={{ height: "fit-content" }}>
            <div className="chd"><h3>Order summary</h3></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              <div style={{ display: "flex", fontSize: 13 }}><span style={{ color: "var(--i6)" }}>Stones</span><span className="tnum" style={{ marginLeft: "auto", fontWeight: 600 }}>{items.length}</span></div>
              <div style={{ display: "flex", fontSize: 13 }}><span style={{ color: "var(--i6)" }}>Indicative value</span><span className="tnum" style={{ marginLeft: "auto", fontWeight: 600 }}>${total}</span></div>
              <div style={{ display: "flex", fontSize: 13, paddingTop: 10, borderTop: "1px solid var(--hair)" }}><span style={{ color: "var(--i6)" }}>Final pricing</span><span style={{ marginLeft: "auto", fontWeight: 600 }}>By salesperson</span></div>
            </div>
            <CreateOrder />
          </div>
        </div>
      )}
    </div>
  );
}
