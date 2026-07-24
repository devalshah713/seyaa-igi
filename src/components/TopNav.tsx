"use client";
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
  const isStaff = role === "ADMIN" || role === "SALES";
  const nav = isStaff ? ADMIN_NAV : CUSTOMER_NAV;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="pnav">
      <div className="lg">
        <img src="/emblem.png" alt="Seyaa Solitaire" />
        <span className="nm">SEYAA SOLITAIRE</span>
        {isStaff && (
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, background: "#3a2e24", color: "#e4b98a", padding: "3px 8px", borderRadius: 6 }}>
            ADMIN
          </span>
        )}
      </div>
      <div className="navi">
        {nav.map((n, i) => (
          <a key={i} className={active === n.label ? "on" : ""} onClick={() => router.push(n.href)}>
            {n.label}
          </a>
        ))}
      </div>
      <div className="grow" />
      {!isStaff && (
        <span className="navcart" onClick={() => router.push("/cart")} style={{ cursor: "pointer" }}>
          🛒 Cart · {cartCount}
        </span>
      )}
      <div className="acct" onClick={logout} title="Sign out">
        <span className="av" />
        {name} · Sign out
      </div>
    </div>
  );
}
