"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { label: string; href: string };

const CUSTOMER_NAV: Item[] = [
  { label: "Home", href: "/search" },
  { label: "Lab-Grown Diamonds", href: "/search" },
  { label: "Favorites", href: "/account" },
  { label: "My Requests", href: "/account" },
];
const ADMIN_NAV: Item[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Inventory", href: "/admin/inventory" },
  { label: "Upload", href: "/admin/upload" },
  { label: "Approvals", href: "/admin/approvals" },
  { label: "Customers", href: "/admin/customers" },
];

export default function TopNav({
  name,
  role,
  cartCount = 0,
  active,
}: {
  name: string;
  role: "CUSTOMER" | "SALES" | "ADMIN";
  cartCount?: number;
  active?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isStaff = role === "ADMIN" || role === "SALES";
  const nav = isStaff ? ADMIN_NAV : CUSTOMER_NAV;

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }
  async function logout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="pnav">
      <button className="hamb" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
        <span /><span /><span />
      </button>

      <div className="lg" onClick={() => go(isStaff ? "/admin" : "/search")} style={{ cursor: "pointer" }}>
        <img src="/emblem.png" alt="Seyaa Solitaire" />
        <span className="nm">SEYAA SOLITAIRE</span>
        {isStaff && <span className="adminpill">ADMIN</span>}
      </div>

      <div className="navi">
        {nav.map((n, i) => (
          <a key={i} className={active === n.label ? "on" : ""} onClick={() => go(n.href)}>
            {n.label}
          </a>
        ))}
      </div>

      <div className="grow" />

      {!isStaff && (
        <span className="navcart" onClick={() => go("/cart")} style={{ cursor: "pointer" }}>
          🛒 <span className="cart-label">Cart · </span>{cartCount}
        </span>
      )}
      <div className="acct" onClick={logout} title="Sign out">
        <span className="av" />
        <span className="acct-name">{name} · </span>Sign out
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="mobmenu">
          {nav.map((n, i) => (
            <a key={i} className={active === n.label ? "on" : ""} onClick={() => go(n.href)}>
              {n.label}
            </a>
          ))}
          {!isStaff && <a onClick={() => go("/cart")}>🛒 Cart · {cartCount}</a>}
          <a onClick={logout}>Sign out</a>
        </div>
      )}
    </div>
  );
}
