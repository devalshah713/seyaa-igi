import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import TopNav from "@/components/TopNav";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, cartCount] = await Promise.all([
    db.user.findUnique({ where: { id: session.id }, select: { firstName: true, companyName: true, role: true } }),
    db.cartItem.count({ where: { userId: session.id } }),
  ]);
  if (!user) redirect("/login");

  return (
    <>
      <TopNav name={user.companyName || user.firstName} role={user.role} cartCount={cartCount} />
      {children}
    </>
  );
}
