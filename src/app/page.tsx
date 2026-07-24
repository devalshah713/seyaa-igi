export default function Home() {
  return (
    <main className="wrap">
      <div className="brand">
        <img src="/emblem.png" alt="Seyaa Solitaire" />
        <b>SEYAA SOLITAIRE</b>
      </div>
      <h1>B2B Trade Portal — API</h1>
      <p className="muted">
        Next.js + Prisma backend for the IGI-certified lab-grown diamond trade portal. The front-end
        design is being migrated screen-by-screen; the interactive prototype is available below.
      </p>

      <a className="btn" href="/prototype.html">Open the interactive prototype →</a>

      <div className="card">
        <h2>Getting started</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          1. Copy <code>.env.example</code> to <code>.env</code> and set <code>DATABASE_URL</code> +{" "}
          <code>SESSION_SECRET</code>.<br />
          2. <code>npm install</code><br />
          3. <code>npm run db:push</code> then <code>npm run db:seed</code><br />
          4. <code>npm run dev</code>
        </p>
      </div>

      <div className="card">
        <h2>Seeded logins (password: <code>password123</code>)</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Admin — <code>admin@seyaasolitaire.com</code><br />
          Salesperson — <code>priya@seyaasolitaire.com</code><br />
          Customer — <code>rajesh@rajeshtraders.com</code>
        </p>
      </div>

      <div className="card">
        <h2>API</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Auth: <code>/api/auth/request-access</code>, <code>/api/auth/otp/send</code>,{" "}
          <code>/api/auth/otp/verify</code>, <code>/api/auth/login</code>, <code>/api/auth/me</code>
          <br />
          Trade: <code>/api/stones</code>, <code>/api/cart</code>, <code>/api/orders</code>,{" "}
          <code>/api/requests</code>
          <br />
          Admin: <code>/api/admin/orders/[id]/assign</code>
        </p>
      </div>
    </main>
  );
}
