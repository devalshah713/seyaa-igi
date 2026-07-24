"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddToCart({ stoneId, small }: { stoneId: string; small?: boolean }) {
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function add() {
    setBusy(true);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stoneId }),
    });
    setBusy(false);
    if (res.ok) {
      setAdded(true);
      router.refresh();
    }
  }
  return (
    <button className={`btn pri ${small ? "sm" : ""}`} onClick={add} disabled={busy || added}>
      {added ? "✓ In cart" : small ? "＋ Cart" : "＋ Add to Cart"}
    </button>
  );
}

export function RemoveFromCart({ stoneId }: { stoneId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function remove() {
    setBusy(true);
    await fetch(`/api/cart?stoneId=${encodeURIComponent(stoneId)}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }
  return (
    <button
      onClick={remove}
      disabled={busy}
      title="Remove from cart"
      aria-label="Remove from cart"
      style={{ background: "none", border: 0, cursor: "pointer", color: "var(--sold)", fontSize: 18, lineHeight: 1, padding: "4px 6px", opacity: busy ? 0.5 : 1 }}
    >
      ✕
    </button>
  );
}

export function CreateOrder({ disabled }: { disabled?: boolean }) {
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  async function create() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/orders", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setOrderNo(data.orderNo);
      router.refresh();
    } else setErr(data.error || "Could not create order");
  }
  if (orderNo)
    return (
      <div className="msg ok" style={{ textAlign: "center" }}>
        Order created — <b>{orderNo}</b>. Emailed to the Seyaa team; a salesperson will follow up.
      </div>
    );
  return (
    <>
      {err && <div className="msg err">{err}</div>}
      <button className="btn pri" style={{ width: "100%" }} onClick={create} disabled={busy || disabled}>
        {busy ? "Creating…" : "Create Order ID →"}
      </button>
    </>
  );
}

export function RequestButton({ stoneId, kind }: { stoneId: string; kind: "MEMO" | "HOLD" }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    const body = kind === "MEMO" ? { stoneId, kind, days: 7 } : { stoneId, kind, hours: 24 };
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) setDone(true);
  }
  return (
    <button className="btn out" onClick={submit} disabled={busy || done}>
      {done ? "Requested" : kind === "MEMO" ? "Memo" : "Hold"}
    </button>
  );
}

export function ViewToggle({ view }: { view: "list" | "grid" }) {
  const router = useRouter();
  function set(v: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("view", v);
    router.push(url.pathname + url.search);
  }
  return (
    <div className="seg" style={{ background: "#efebe6" }}>
      <button className={view === "list" ? "on" : ""} style={{ padding: "7px 14px" }} onClick={() => set("list")}>
        List
      </button>
      <button className={view === "grid" ? "on" : ""} style={{ padding: "7px 14px" }} onClick={() => set("grid")}>
        Grid
      </button>
    </div>
  );
}
