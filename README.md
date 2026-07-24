# Seyaa Solitaire — B2B Trade Portal

A single-vendor trade portal for **IGI-certified lab-grown diamonds**. Approved trade
customers search Seyaa Solitaire's live inventory and **Add stones to a cart → Create an
Order ID**; they can also request a stone on **Memo** (consignment) or **Hold** (timed
reservation). An **Admin** side manages stock, inventory, incoming requests, KYC approvals,
and assigns orders to salespeople.

## Repository layout

```
prisma/schema.prisma     # Postgres data model (users/KYC, stones, cart, orders, memo/hold)
prisma/seed.ts           # seed admin + salesperson + customer + sample stones
src/lib/                 # db client, session auth (JWT cookie), OTP, mailer, zod validators
src/app/api/             # backend route handlers (see API below)
src/app/                 # Next.js App Router shell (landing + API)
public/prototype.html    # the full 14-screen interactive UI prototype (design reference)
public/emblem.png        # Seyaa Solitaire emblem
```

The **front-end is migrated onto the API** as Next.js routes (below). The original
self-contained design reference remains at `public/prototype.html`.

**Pages** (App Router, `src/app`)

| Route | Description |
|---|---|
| `/login` | Sign in + KYC Request Access (OTP + Aadhaar/GST upload) |
| `/search` | Filter builder → `/results` |
| `/results` | Inventory (DB-queried) — list / grid, add to cart |
| `/stone/[ref]` | Stone detail + Add to Cart / Memo / Hold |
| `/cart` | Cart → **Create Order ID** |
| `/account` | My orders + memo/hold |
| `/admin` | Dashboard (KPIs) |
| `/admin/inventory` · `/upload` | Inventory table · Excel import (analyze → map → publish) |
| `/admin/approvals` · `/customers` | Assign orders, approve memo/hold · approve KYC |

Auth-gated via a `(portal)` layout; `/admin/*` requires ADMIN/SALES.

## Backend — Next.js (App Router) + Prisma + Postgres

### Setup

```bash
cp .env.example .env         # set DATABASE_URL + SESSION_SECRET (+ SMTP for email)
npm install
npm run db:push              # create tables from prisma/schema.prisma
npm run db:seed              # seed demo data
npm run dev                  # http://localhost:3000
```

Seeded logins (password `password123`): `admin@seyaasolitaire.com` (admin),
`priya@seyaasolitaire.com` (sales), `rajesh@rajeshtraders.com` (customer).

> Without SMTP configured, emails are logged to the server console and OTPs are returned in
> the API response (`devOtp`) so onboarding works locally.

### Data model (`prisma/schema.prisma`)

`User` (role CUSTOMER/SALES/ADMIN, status PENDING/APPROVED/…) · `KycDocument` (Aadhaar/GST) ·
`OtpCode` · `Stone` (inventory, `costPrice` admin-only) · `CartItem` · `Order` + `OrderItem`
(with `orderNo` like `SEY-ORD-2026-0142`, `assignedTo` salesperson) · `TradeRequest` (memo/hold).

### API

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/request-access` | Submit KYC application (name, email, mobile, Aadhaar req., GST opt.) → email OTP + notify admin |
| POST | `/api/auth/otp/send` | (Re)send email OTP |
| POST | `/api/auth/otp/verify` | Verify OTP, mark email verified |
| POST | `/api/auth/login` | Credentials login (approved accounts only) → session cookie |
| POST | `/api/auth/logout` · GET `/api/auth/me` | Session |
| GET | `/api/stones` | Search inventory (filters); hides cost price from non-admins |
| GET/POST/DELETE | `/api/cart` | Manage cart |
| GET/POST | `/api/orders` | List orders · **Create Order ID** from cart → email admin, clear cart |
| GET/POST | `/api/requests` | List / create Memo or Hold requests |
| POST | `/api/uploads` | Multipart file upload (Aadhaar/GST/media) → Vercel Blob (dev: `.uploads/`) |
| POST | `/api/admin/inventory/analyze` | Upload Excel/CSV → detected columns + **suggested mapping** + preview |
| POST | `/api/admin/inventory/publish` | Excel + mapping → validate → **bulk upsert `Stone`s** |
| GET | `/api/admin/customers` | KYC application queue (with documents) |
| POST | `/api/admin/customers/[id]/decision` | Approve / reject a trade application |
| GET | `/api/admin/requests` | Memo/Hold approval queue |
| POST | `/api/admin/requests/[id]/decision` | Approve/decline → transitions stone to MEMO/HOLD |
| POST | `/api/admin/orders/[id]/assign` | Admin assigns an order to a salesperson |

Auth is a signed JWT in an httpOnly cookie (`src/lib/auth.ts`); role guards via `requireRole`.
File storage uses Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, otherwise a local
`.uploads/` dev fallback served (auth-gated) via `/api/uploads/[...path]`.

## Still to wire (next steps)

- **Set-password flow** — email a set/reset-password link on KYC approval (currently status only),
  so approved customers can sign in.
- **Faceted shape icons + full filter parity** — port the remaining filter controls and cut icons.
- **Scheduled jobs** — memo-return + hold-expiry to release stones back to AVAILABLE.
- **Private KYC storage** — move Aadhaar/GST to a private bucket / signed URLs (public-unguessable today).
- **SMS OTP** (optional) for mobile verification.

### Open decisions
Email/SMS OTP provider · database + object-storage choice · whether the Order email also
copies the customer and the assigned salesperson.

---
Built with Claude Code. A static preview of the entry site is deployed on Vercel; the full
app deploys from this repo once the front-end migration lands.
