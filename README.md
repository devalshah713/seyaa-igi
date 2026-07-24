# Seyaa Solitaire — B2B Trade Portal

A single-vendor trade portal for **IGI-certified lab-grown diamonds**. Approved trade
customers search Seyaa Solitaire's live inventory and **Add stones to a cart → Create an
Order ID**; they can also request a stone on **Memo** (consignment) or **Hold** (timed
reservation). An **Admin** side manages stock (Excel upload), inventory, incoming
requests, and customer KYC approvals.

> **Status:** This repository contains **v1 — the working front-end** (all 14 screens,
> real branding, client-side interactivity). Backend services (auth, OTP, KYC storage,
> database, transactional email) are scoped in the roadmap below and are the next phase.

## Live demo

Deployed on Vercel (static front-end). Use the left rail to move between screens.

## What's implemented (front-end)

**Trade portal**
- **Login / Request Access** — Sign In, plus a KYC application: First/Last name,
  OTP-verified email, mobile (+91), **compulsory Aadhaar upload**, optional GST certificate.
- **Filter & Search** — shape (faceted cut icons), carat, color, clarity, cut/polish/
  symmetry, fluorescence, price, location, growth type, treatment, measurements.
- **Results** — dense sortable **List** view + media **Grid** view, availability status
  dots (Available / Hold / Memo / Sold), favorites, bulk actions, pagination.
- **Stone Detail** — media gallery + certificate, full product-details spec grid, comments,
  and **Add to Cart · Hold · Memo · Enquire**.
- **Cart & Create Order** — review selected stones → **Create Order ID** (emails the order
  + stone details to admin; a salesperson is assigned to follow up). No online payment.
- **My Account** — Orders / Memos / Holds / Favorites / Saved Searches.

**Admin**
- **Dashboard** (KPIs + requests queue + stock-by-shape), **Stock Upload** (Excel import +
  column mapping), **Inventory**, **Requests / Approvals** (assign orders to a salesperson;
  approve/decline memo & hold), **Customers** (approve trade + KYC applications).

Brand: orange `#DD611C` + white, Montserrat, and the Seyaa Solitaire horse-and-diamond
emblem (`emblem.png`). The diamond-cut icons are original vectors.

## Run locally

It's a self-contained static site — no build step.

```bash
# any static server, e.g.
npx serve .
# or just open index.html in a browser
```

## Deploy

Static deploy (Vercel auto-detects, no build). The site is `index.html` + `emblem.png`.

## Backend roadmap (next phase)

Migrate the front-end into a **Next.js (App Router)** app on Vercel and wire:

1. **Auth & accounts** — session login for approved trade accounts; role split (customer /
   salesperson / admin).
2. **KYC onboarding** — Request Access submits to a DB; **email OTP** verification (e.g.
   Resend/SES); Aadhaar (required) + GST (optional) uploaded to object storage (e.g. S3 /
   Vercel Blob) with an admin document-review queue.
3. **Inventory** — Postgres (e.g. Neon/Supabase) seeded by the **Excel upload** →
   column-mapping → validate → publish pipeline.
4. **Cart & Orders** — Create Order ID persists the order + line items; **transactional
   email** to admin (and optionally customer + assigned salesperson) with the Order ID and
   stone details; admin **assigns a salesperson**.
5. **Memo & Hold** — state machine driving the customer-side availability status dots;
   hold timers/expiry; admin approve/decline.

### Open decisions for the backend phase
- Email + (optional) SMS OTP provider.
- Database + object storage choice.
- Whether the Order confirmation email also copies the customer and the salesperson.
- Whether mobile number requires SMS OTP in addition to email OTP.

---
Built with Claude Code.
