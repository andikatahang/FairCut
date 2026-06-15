# Stack Research — FairCut

**Project:** FairCut HRIS + Simulated Escrow Platform
**Researched:** 2026-06-15
**Context:** 7.5-week academic project, small team (Informatics students, UII), no real payment gateway, 3 roles (Client / Editor / Admin), server-side watermarking, atomic wallet transactions, responsive web only.

---

## Recommended Stack

### Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x (App Router) | Full-stack React framework | Gives you server components, middleware for RBAC, Server Actions for form mutations, and API routes — all in one repo. Eliminates the need for a separate Express/Fastify backend, which matters on a 7.5-week timeline. The App Router's middleware runs at the edge, making role-based redirects (Client → editor dir, Admin → dashboard) trivial to enforce before a page renders. |
| React | 19.x | UI runtime (bundled with Next.js 15) | No separate install. React 19 concurrent features reduce visible loading states in the project-status dashboard. |
| Tailwind CSS | 4.x | Utility-first styling | Zero context-switch between CSS files and components. Tailwind v4's `@theme` directive replaces `tailwind.config.js` entirely — one less file to maintain. Enforces consistent spacing at 360 px viewport (responsive constraint) without media-query boilerplate. |
| shadcn/ui | latest (Tailwind v4 branch) | Accessible component library | Copy-paste components (not an npm dependency) built on Radix UI primitives. Every component ships with ARIA roles and keyboard navigation, satisfying the WCAG 2.1 AA requirement without writing accessible markup from scratch. Use: DataTable for project list, Dialog for contract preview, Badge for project status, Toast (via Sonner). |
| React Hook Form | 7.x | Form state management | Uncontrolled inputs — no re-renders on each keystroke. Critical for the registration form (KTP upload + portfolio link + specialization) and the project brief form. Pairs with Zod via `@hookform/resolvers`. |
| Zod | 3.x | Schema validation (client + server) | Define a schema once; use it for both client-side field errors and server-side Server Action validation. Prevents the dual-validation problem (separate Yup schema + manual API checks). Run Zod on every Server Action input — this is your security layer since Server Actions accept arbitrary POST requests. |

**What NOT to use on the frontend:**

- **React + Vite (SPA only):** You would need a separate backend server for Server Actions, cron endpoints, file processing, and the audit-log write API. Two deployments, two repos, two sets of env vars — too much overhead for a 7.5-week build. Next.js collocates all of this.
- **Material UI / Ant Design:** Large bundle, opinionated theme that fights Tailwind, and the accessibility defaults are weaker than Radix-based shadcn/ui.
- **Redux / Zustand for global state:** You don't need them. Server Components fetch data directly; React Hook Form owns form state; URL search params handle filter state (specialization, rating in editor directory). Adding a global store adds complexity with no payoff.

---

### Backend

All backend logic lives inside the same Next.js app via Route Handlers (`app/api/...`) and Server Actions.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js Route Handlers | 15.x | REST-style API endpoints | Used for: file upload endpoint (streams to Supabase Storage after watermarking), webhook-style cron endpoint (7-day auto-approve, 48h boundary timer), and any endpoint that needs streaming responses. |
| Next.js Server Actions | 15.x | Form mutations | Used for: all CRUD mutations (brief submission, revision request, contract generation, escrow deposit, disbursement). Server Actions run on the server, are type-safe end-to-end with Zod, and don't require a separate API client on the frontend. |
| Auth.js (NextAuth.js) | v5.x (beta, stable enough for production) | Authentication + session management | Credentials provider (email + password) with JWT sessions. Embeds `role` (CLIENT / EDITOR / ADMIN) into the JWT token via the `jwt()` callback, then surfaces it on `session.user.role`. Middleware reads the session token to enforce route-level RBAC before any page renders. Use database sessions instead of JWT if you need instant session revocation (e.g., Admin suspends a user — their active session must die immediately). **Recommendation: use database sessions for FairCut** because the Admin suspend-user flow requires instant revocation. |
| Drizzle ORM | 0.30.x | Database access layer | Chosen over Prisma for two reasons specific to FairCut: (1) Drizzle's `db.transaction()` wraps the escrow deposit + status change + audit log write in a single atomic block with clear rollback semantics — critical for the "no partial disbursement" constraint. (2) Drizzle's bundle is ~33 KB vs Prisma's ~800 KB engine, which matters for Vercel serverless cold starts on the free tier. TypeScript-first schema definition means no separate `.prisma` file to keep in sync. |
| bcryptjs | 2.x | Password hashing | Pure-JS bcrypt — no native binary compilation issues on Railway/Render. Use 12 salt rounds. |

**What NOT to use on the backend:**

- **Express / Fastify as a separate server:** Redundant when Next.js Route Handlers cover the same use cases. Adds a second deployment target.
- **Prisma (for this project):** Prisma 7 removed its Rust binary but is still in flux. Drizzle's transaction API is more explicit — important when wallet balance atomicity is a hard constraint. Prisma's `$transaction` API is solid but less SQL-transparent. Either works; Drizzle is the 2025 community default for new TypeScript projects and has smaller cold-start overhead.
- **tRPC:** Adds type-safe RPC layer that duplicates what Server Actions already provide. Overkill for a project with one team.
- **GraphQL:** Overcomplicated query layer for a CRUD-dominant HRIS. Not worth the schema overhead on a 7.5-week timeline.

---

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 16.x | Primary data store | Required — not optional. The audit log's immutability constraint (`no UPDATE / DELETE`) is enforced by a PostgreSQL row-level trigger (`BEFORE UPDATE OR DELETE ON audit_log RAISE EXCEPTION`). SQLite cannot enforce this at the DB level. The wallet balance atomicity (`no negative balance`) needs `CHECK (balance >= 0)` with transaction isolation. PostgreSQL's `SERIALIZABLE` isolation level prevents race conditions when two concurrent disbursement attempts try to draw from the same escrow. MySQL/MariaDB could work but has weaker `CHECK` constraint enforcement historically. |
| Neon | free tier | PostgreSQL hosting | Serverless PostgreSQL with scale-to-zero. Free tier: 0.5 GB storage, included branching (create a staging branch from production schema for demos). No credit card required. Integrates directly with Vercel and Railway via connection string. Cold start ~500 ms on first query after idle — acceptable for a student project. |

**Schema constraints to enforce at the DB layer (not just application layer):**

```sql
-- Wallet balance cannot go negative
ALTER TABLE wallets ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);

-- Immutable audit log (trigger)
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

-- One active contract per project
ALTER TABLE contracts ADD CONSTRAINT one_contract_per_project UNIQUE (project_id);
```

**What NOT to use:**

- **SQLite / Turso:** No `SERIALIZABLE` isolation across concurrent writes. Inadequate for wallet transactions where two requests can race.
- **MongoDB:** Document store has no native `CHECK` constraints and no foreign-key integrity. The audit log immutability and balance constraint would have to live entirely in application code — violating the data-layer constraint requirement.
- **PlanetScale:** Removed its free tier in 2024. Not viable for a student project.
- **Supabase (as database host):** Supabase wraps PostgreSQL and works fine, but it bundles auth and storage you'd partially duplicate. If you use Supabase Storage (see below), use Neon separately for the database to avoid coupling the whole infrastructure to one vendor.

---

### File Storage & Watermarking

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Storage | free tier | File storage for KTP uploads, portfolio docs, draft uploads, and final files | 1 GB free storage, private buckets by default with Row Level Security policies, signed URLs for time-limited download links (watermarked draft visible only while `In Progress` / `Revision`). The signed URL approach enforces the "client cannot download the original until `Konfirmasi Selesai`" rule at the storage layer, not just the UI layer. |
| sharp | 0.33.x | Server-side image watermarking | Fastest Node.js image processing library (libvips-backed, 40–50x faster than Jimp). For FairCut's use case: when an editor uploads a draft image, the upload Route Handler reads the file buffer, uses `sharp().composite([{ input: watermarkBuffer, gravity: 'center', blend: 'over' }])` to stamp the watermark, then uploads the watermarked version to Supabase Storage. The original file is stored in a separate private bucket that the client cannot access until disbursement. |
| pdf-lib | 1.17.x | Server-side PDF watermarking | For PDF draft submissions. `pdf-lib` can embed a semitransparent text watermark ("DRAFT — FAIRCUT") onto each page server-side. Pure JavaScript — no native binary needed. Sharp does not process PDFs; use pdf-lib for that file type only. |

**Watermarking architecture (critical — read this):**

The upload must happen in two stages, server-side:
1. Editor POSTs file to Next.js Route Handler (`/api/upload/draft`).
2. Route Handler: validates file type → generates watermarked copy → uploads **watermarked copy** to `drafts-watermarked/` bucket → uploads **original** to `drafts-original/` bucket (private, no signed URL issued to client) → writes file metadata to DB.
3. Client receives a signed URL pointing to `drafts-watermarked/` only.
4. On `Konfirmasi Selesai` (or 7-day auto-approve): Route Handler generates a signed URL for `drafts-original/` and delivers it to the client.

**Do NOT let the client upload directly to Supabase Storage** (bypasses watermarking). Always route through the Next.js backend.

**What NOT to use:**

- **Jimp:** 5–20x slower than sharp. For a student project on a free-tier server, slow image processing means request timeouts. sharp is the correct choice.
- **Cloudinary / ImageKit (for watermarking):** These services can watermark images but you lose control over the two-bucket (watermarked vs original) architecture. They are also paid services with limited free tiers that may not cover the 200-concurrent-project scale target.
- **multer (for uploads):** Multer is an Express middleware. In Next.js App Router, parse the `FormData` directly in the Route Handler using `request.formData()` — no separate middleware needed.

---

### Background Jobs (7-day Auto-Approve + 48h Boundary Timer)

This is the trickiest part of the stack for a serverless deployment.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel Cron Jobs (if on Vercel) | — | Trigger scheduled checks | Free on Vercel's hobby tier. Define in `vercel.json`: `{ "crons": [{ "path": "/api/cron/check-timeouts", "schedule": "0 * * * *" }] }`. The Route Handler at that path queries the DB for projects where `draft_uploaded_at < NOW() - INTERVAL '7 days'` and `status = 'In Progress'` and triggers auto-approve. Also checks for 48h boundary timer breaches. |
| pg-boss (alternative if on Railway/Render) | 9.x | PostgreSQL-backed job queue | If not on Vercel: pg-boss persists jobs in a PostgreSQL table, survives server restarts, and handles retries. Use this if you deploy to Railway (no native cron). Overhead: one extra `pgboss` schema in your DB. |

**Recommendation:** Deploy to Vercel (frontend + API) + Neon (database) + Supabase Storage. Use Vercel Cron Jobs. This is the lowest-friction path to deploying scheduled tasks without managing a separate worker process.

---

### Deployment

| Platform | Role | Free Tier | Why |
|----------|------|-----------|-----|
| Vercel | Next.js app host (frontend + API routes + Server Actions + Cron) | Hobby tier: unlimited deployments, 100 GB bandwidth, 100K serverless function invocations/month | Vercel is the native home for Next.js — zero-config deployment from GitHub. Serverless functions auto-scale. Cron Jobs included. No credit card required. The 10 MB serverless function payload limit is sufficient for file upload (files are streamed to Supabase, not held in memory beyond the watermarking step). |
| Neon | PostgreSQL database | 0.5 GB storage, branching, scale-to-zero | See Database section above. |
| Supabase | File storage only | 1 GB file storage, private buckets, signed URLs | See File Storage section above. |

**Deployment pipeline:**

```
GitHub push → Vercel CI → auto-deploys Next.js app
                       → runs Drizzle migrations against Neon (via postbuild script)
```

**What NOT to use:**

- **Railway (as primary host):** Railway's free tier gives only $5 trial credit (expires). Not suitable for a semester-long project without ongoing cost. Use Railway only if you need a persistent server process (e.g., WebSockets) — FairCut does not.
- **Render:** 90-day free PostgreSQL trial, then paid. Free web services spin down after 15 minutes causing 30-second cold starts — unacceptable for a demo context. Use Neon + Vercel instead.
- **Heroku:** No meaningful free tier since 2022.
- **Docker on a VPS:** Adds DevOps complexity (nginx, SSL certs, process management) that eats into the 7.5-week build window.

---

## Full Stack Summary

```
Next.js 15 (App Router)
  ├── shadcn/ui + Tailwind CSS 4        (UI components)
  ├── React Hook Form + Zod             (form validation)
  ├── Auth.js v5 (Credentials, DB sessions) (authentication + RBAC)
  ├── Drizzle ORM 0.30                  (database layer + atomic transactions)
  ├── sharp 0.33 + pdf-lib 1.17        (server-side watermarking)
  └── Vercel Cron Jobs                  (7-day auto-approve, 48h timer)

PostgreSQL 16 on Neon                   (primary database)
Supabase Storage                        (file storage, signed URLs)

Deploy: Vercel (app) + Neon (DB) + Supabase (storage)
```

---

## Installation Reference

```bash
# Init Next.js 15 project
npx create-next-app@latest faircut --typescript --tailwind --app --src-dir --import-alias "@/*"

# shadcn/ui (Tailwind v4 compatible)
npx shadcn@latest init

# Auth
npm install next-auth@beta

# ORM + database driver
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Form validation
npm install react-hook-form @hookform/resolvers zod

# Image + PDF watermarking
npm install sharp pdf-lib

# Supabase Storage client
npm install @supabase/supabase-js

# Password hashing
npm install bcryptjs
npm install -D @types/bcryptjs
```

---

## Confidence Levels

| Recommendation | Confidence | Rationale |
|----------------|------------|-----------|
| Next.js 15 App Router as full-stack framework | HIGH | Dominant choice in 2025 TypeScript ecosystem; multiple production HRIS examples; official docs comprehensive. No credible 2025 alternative for same capability surface in one repo. |
| Tailwind CSS v4 + shadcn/ui | HIGH | Official shadcn/ui Tailwind v4 support shipped March 2025; actively maintained; Radix primitives satisfy WCAG AA baseline. |
| Auth.js v5 with database sessions | HIGH | Auth.js v5 is stable enough for production (used in production apps); database sessions required for the Admin suspend-user → instant session revocation feature. JWT sessions cannot be revoked mid-session. |
| Drizzle ORM over Prisma | MEDIUM-HIGH | Drizzle is the 2025 community default for new projects; transaction API is more SQL-transparent. Risk: Drizzle's migration tooling (`drizzle-kit`) is less battle-tested than Prisma's — run migrations in a Neon branch before applying to production. |
| PostgreSQL on Neon | HIGH | Free tier is genuinely free (no 90-day cliff); branching is useful for schema testing; serverless cold start (~500ms) acceptable for academic demo. |
| Supabase Storage for files | HIGH | 1 GB free, private buckets, signed URLs are exactly what the watermarked-draft access pattern needs. Only risk: free projects pause after 1 week of inactivity — set a weekly ping to keep the project alive during development. |
| sharp for image watermarking | HIGH | libvips-backed, 40–50x faster than Jimp; well-maintained (weekly releases); composite API is straightforward for overlay watermarks. |
| pdf-lib for PDF watermarking | MEDIUM | pdf-lib is the standard pure-JS PDF library; text watermarking on each page is documented and works. Risk: complex PDFs with embedded fonts may render the watermark incorrectly — test with representative editor uploads in Week 2. |
| Vercel Cron Jobs for scheduled tasks | MEDIUM | Works well for simple hourly checks; free on Hobby tier. Risk: Vercel serverless functions have a 10s (Hobby) / 60s (Pro) execution timeout — if the cron job processes many stale projects in one run, it may timeout. Mitigation: process one batch of 20 projects per invocation and re-queue on next run. |
| Vercel as deployment host | HIGH | Zero-config Next.js deployment; no credit card for Hobby tier; GitHub CI/CD built in; Cron Jobs included. |
