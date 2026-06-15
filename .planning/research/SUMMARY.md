# Research Summary — FairCut

**Project:** FairCut HRIS + Simulated Escrow Platform
**Domain:** Freelance marketplace / HRIS for Indonesian creative editors
**Researched:** 2026-06-15
**Confidence:** HIGH

---

## Executive Summary

FairCut is a trust-enforcement platform, not a generic marketplace. Its core mechanic — escrow held before work begins, released only on confirmed completion or 7-day client silence — is what separates it from a simple job board. Building this correctly means the escrow transaction (deposit, hold, disburse) must be architecturally treated as the critical path, not one feature among many. Every other module either feeds into it (registration, directory, brief submission) or is triggered by it (watermark unlock, wallet balance, KPI update, withdrawal).

The stack decision is the most consequential open question (see below), but either path leads to the same architecture: a layered monolith, PostgreSQL with enforced constraints, server-side file watermarking via a background job, and database-driven cron polling for the two deadline timers. The implementation patterns are well-documented and research has HIGH confidence across all four areas. The risk is not "how to build it" but "whether the team builds the foundational constraints first" — integer wallet balances, immutable audit log, atomic escrow, status machine guards — before layering features on top.

The three items that can derail the project if left too late are: (1) atomic escrow with SELECT FOR UPDATE, which is architectural and must be correct from day one; (2) server-side watermarking, which has binary dependencies that must be spiked in Week 1; and (3) the two deadline timers (7-day auto-approve, 48h boundary escalation), which are integration-heavy and require a running queue worker plus database deadline columns before testing. These three items belong in the first half of the timeline, not the last sprint.

---

## Recommended Stack

### Primary Recommendation: Laravel 11 + PostgreSQL + Railway/VPS

**Rationale for this team:**
The team is Indonesian Informatics students at UII building a 7.5-week academic project. Laravel is the dominant PHP framework in Indonesia's web development ecosystem — most Indonesian CS programs teach it, most Indonesian tutorials are written for it, and the local developer community defaults to it. Choosing Laravel means the team can search for help in Bahasa Indonesia, reference locally-familiar course material, and find teammates who have already used Eloquent and Laravel queues.

Laravel's built-in tooling maps directly to FairCut's requirements:
- DB::transaction() with lockForUpdate() covers atomic escrow (the hardest part)
- Laravel Scheduler + Queue Worker covers both deadline timers without a third-party service
- Intervention Image v3 covers server-side watermarking in pure PHP (no Node binary dependency)
- Laravel Sanctum covers role-based session auth with instant revocation on Admin suspend
- The REVOKE UPDATE, DELETE ON audit_logs pattern is standard Laravel database practice

**Primary stack:**

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Backend | Laravel | 11.x | Indonesian ecosystem default; built-in queue worker; DB transaction API maps directly to escrow requirement |
| Frontend | Blade + Alpine.js | — | No build complexity; works inside Laravel monorepo; Alpine handles reactive counters (revision quota) without SPA overhead |
| Database | PostgreSQL | 16.x | Required — CHECK constraints, SERIALIZABLE isolation, trigger-enforced audit log immutability |
| File storage | Local disk (dev) / S3-compatible (prod) | — | Laravel Storage abstraction; swap from local to S3 by changing config, not code |
| Watermarking | Intervention Image v3 | 3.x | Pure PHP; no Node binary; JPG/PNG/WebP support; handles the text-overlay pattern needed |
| PDF watermark | FPDI + FPDF | — | Pure PHP PDF manipulation; no binary dependency |
| Auth | Laravel Sanctum | — | Session-based; supports instant revocation; role guard via middleware |
| Queues | Laravel Queue (database driver) | — | Jobs persisted in PostgreSQL; survive server restart; no Redis needed at this scale |
| Scheduler | Laravel Scheduler (php artisan schedule:run) | — | Cron entry + database deadline columns; handles both timers |
| Deployment | Railway (hobby) or university VPS | — | See Open Questions |

**Deployment note:** Railway's hobby tier is free but has credit limits. For a semester-long project, a university VPS or shared hosting with PHP 8.x + PostgreSQL is more reliable. Confirm deployment target with the team — it determines the timer strategy.

### Alternative: Next.js 15 + Drizzle + Neon + Vercel

Stack research recommends this as the primary option from a TypeScript ecosystem perspective. It is the correct choice if the team has React/TypeScript experience and is comfortable with Next.js App Router.

The trade-off: Next.js Server Actions and Drizzle ORM have steeper learning curves for developers whose primary language is PHP. Vercel Cron Jobs have a 10-second execution timeout on the Hobby tier (requires batching the auto-approve job). Drizzle migrations are less battle-tested than Laravel migrations.

If the team has strong TypeScript confidence, this stack is excellent and the research for it is comprehensive (see STACK.md). If any team member says "I've never used React," default to Laravel.

**The architecture patterns are identical across both stacks.** The choice is a language/tooling preference, not an architectural difference.

---

## Key Findings

### Features: Table Stakes vs Differentiators

The feature dependency chain has a single critical gate: **escrow deposit must be atomic and must be the gate to `in_progress` status.** Nothing downstream (watermark, revisions, timers, payout) is meaningful without this. The entire platform value chain collapses if this step is skippable or non-atomic.

**Table stakes — must ship in v1 (no workaround exists):**

1. Role-based registration: Client / Editor (KTP + portfolio) / Admin (seeded, not self-registered)
2. Admin verification queue with approve/reject + reason; rejected editor receives notification
3. Editor public directory filtered by specialization and rating
4. Project brief submission → `Draft` project record
5. Escrow deposit (100% upfront) → Contract auto-generation with locked `max_revisions` → `in_progress`
6. Server-side watermark injection on draft upload (background job, not synchronous)
7. Watermarked draft accessible to client during `in_progress` / `revision`; original locked until completion
8. Revision quota enforcement — `revisions_taken < max_revisions` checked at backend, not just UI
9. `Konfirmasi Selesai` → atomic parallel: file unlock + disbursement (minus 10% commission)
10. 7-day auto-approve → payout if client silent after draft upload
11. Editor wallet with Rp100,000 withdrawal gate
12. Admin withdrawal approval (1x24 business hours SLA)
13. Immutable audit log for all status and financial events
14. Admin dispute opening, resolution, and 48h auto-escalation
15. 48h boundary timer for failed disbursements → Admin escalation
16. Editor KPI (rating, completion_rate) auto-updated on project completion
17. User suspension (removes profile from public directory)
18. HTTPS/TLS enforced at infrastructure level

**Differentiators — add value but do not block core flow (implement after table stakes):**

- Admin 5-business-day verification queue SLA reminder (dashboard badge)
- Commission breakdown visible at contract issuance (not just at payout)
- Project history count on public editor profile
- Dispute audit trail visible to involved parties

**Explicitly deferred to v2+:**

Real payment gateway (Midtrans/Xendit), chat/messaging between parties, file version history, text reviews, portfolio media hosting, OAuth/SSO, analytics dashboard, email OTP. These are the four scope traps most likely to be requested during development — hold them firm.

---

### Architecture: Critical Patterns

FairCut is a **layered monolith**. No microservices. One database. One application server. This is the correct choice for a 7.5-week team.

**Four patterns that are non-negotiable:**

**1. Atomic escrow with pessimistic lock**
Every wallet-mutating operation wraps a SELECT ... FOR UPDATE inside a DB::transaction(). This prevents the double-spend race condition where two concurrent requests both read the same balance before either deducts. Escrow deposit, disbursement, and withdrawal are all multi-row operations that must commit atomically or not at all. The audit log INSERT must be inside the same transaction as the state change — never fire-and-forget.

**2. Two-bucket file architecture**
On every draft upload: (a) watermarked copy → `/watermarked/` bucket, (b) original → `/originals/` bucket with no public URL. The client receives an authenticated URL to the watermarked copy only. The original is served only through a controller method that checks `project.status = 'completed'` at request time. Never expose originals via a static public path.

**3. Database-deadline timer pattern**
Both timers store their deadline as a timestamp column on the domain table (`auto_approve_deadline` on projects; `boundary_deadline_at` on transactions). A scheduler entry polls every minute for due records and dispatches queue jobs. This survives server restarts because truth is in the database row, not process memory. Every timer job must recheck project status inside a transaction before acting — idempotency is required.

**4. Immutable audit log via DB-level REVOKE**
`REVOKE UPDATE, DELETE ON audit_logs FROM faircut_app_user;` in the first migration. The application database role has INSERT and SELECT only. Without this, the audit log is immutable only by convention — a SQL injection or compromised credential can silently alter it.

**Component responsibilities (Laravel path):**

| Component | Responsibility |
|-----------|---------------|
| Controller | Validate HTTP input; call Service; return response. Zero business logic. |
| Service Layer | All business rules: escrow, quota enforcement, status transitions, timer dispatch |
| Repository | Eloquent queries behind interfaces; never called from Controllers directly |
| Queue Job | Background work: watermarking, auto-approve execution, boundary escalation |
| Scheduler | Polls deadline columns every minute; dispatches jobs; never executes logic inline |
| FileController | Serves files through auth + status check; never exposes raw storage paths |

**Suggested build order (7 phases from ARCHITECTURE.md):**
Phase 1 Foundation → Phase 2 Editor Onboarding + Admin Verification → Phase 3 Client Directory + Brief Submission → Phase 4 Contract + Escrow Deposit (critical path) → Phase 5 Project Execution (Upload + Watermark + Revisions) → Phase 6 Completion + Payout + Timers → Phase 7 Wallet + Withdrawal + Admin Controls

---

### Top 3 Risk Items

These three items need early spikes (Week 1-2). Discovering any of them is hard in Week 5 or later is a project-threatening event.

**Risk 1: Atomic escrow with SELECT FOR UPDATE (CRITICAL)**
This is the architectural heart of the platform. If the escrow transaction has a race condition, wallet balances go negative, funds disburse twice, and the audit log records impossible states permanently. The pattern is straightforward but must be implemented correctly from the start. Spike: write a test that fires two simultaneous deposit requests from the same wallet and confirms only one succeeds. Do this in Week 1 or 2, before any UI is built.

**Risk 2: Server-side file watermarking (HIGH)**
Watermarking has binary dependencies (Intervention Image for PHP; Sharp for Node). These must be installed and tested on the actual deployment host, not just localhost. Accepted file types must be decided before building the pipeline — images only (straightforward) vs video (requires FFmpeg, may not be available on host). Watermarking must run as a background job, not synchronously in the upload handler. Spike: upload a real image on the deployment host and confirm the watermarked copy is generated and the original is locked. Do this in Week 1-2.

**Risk 3: Timer automation (MODERATE-HIGH)**
The 7-day auto-approve and 48h boundary timer require: (a) `auto_approve_deadline` column on projects, (b) a running queue worker, (c) a cron entry or persistent scheduler process, and (d) completed project records to test against. If the deployment environment does not support persistent background processes, the timers are broken at submission. Spike: confirm the hosting environment supports `php artisan queue:work` and `php artisan schedule:run` as persistent processes. Do this before Week 3.

---

## Phase 1 Non-Negotiables

These database-layer foundations must exist before any feature work begins. Every subsequent phase writes to these tables and relies on these constraints. Building features first and adding these later is the primary cause of integration-week fires on student projects.

**DB schema constraints (first migration, not afterthought):**

```sql
-- 1. Integer wallet balances — BIGINT, never FLOAT/DECIMAL
ALTER TABLE wallets ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);

-- 2. Immutable audit log via REVOKE
REVOKE UPDATE, DELETE ON audit_logs FROM faircut_app_user;

-- 3. Status enum as CHECK constraint (prevents string drift across modules)
ALTER TABLE projects ADD CONSTRAINT valid_status
  CHECK (status IN ('draft', 'in_progress', 'revision', 'completed', 'cancelled', 'disputed'));

-- 4. One active contract per project
ALTER TABLE contracts ADD CONSTRAINT one_contract_per_project UNIQUE (project_id);

-- 5. auto_approve_deadline column (set to draft_uploaded_at + 7 days on upload)
ALTER TABLE projects ADD COLUMN auto_approve_deadline TIMESTAMP NULL;

-- 6. Boundary timer columns on transactions
ALTER TABLE transactions ADD COLUMN disbursement_attempted_at TIMESTAMP NULL;
ALTER TABLE transactions ADD COLUMN boundary_deadline_at TIMESTAMP NULL;
ALTER TABLE transactions ADD COLUMN escalated_to_admin BOOLEAN DEFAULT FALSE;

-- 7. Indexes for timer polling (200-project target, sub-5ms query)
CREATE INDEX idx_projects_status_deadline ON projects (status, auto_approve_deadline);
CREATE INDEX idx_transactions_boundary ON transactions (boundary_deadline_at, escalated_to_admin);
CREATE INDEX idx_audit_logs_project ON audit_logs (project_id, created_at DESC);

-- 8. Sentinel system actor for automated events
-- Insert at seed time: a fixed user row with role='system' for cron-triggered audit entries
-- audit_logs.actor_id must NEVER be NULL — use system actor for automated events
```

**Status enum constants — define in one shared file before any controller is written:**
Do not hardcode strings like `'in_progress'` or `'In Progress'` in multiple places. Define an enum constant once (PHP: `ProjectStatus::IN_PROGRESS`; TypeScript: `ProjectStatus.IN_PROGRESS`) and import it everywhere. String drift between modules is the most common integration failure on student projects.

**Auth + RBAC baseline from Phase 1:**
Apply role guards at the router level for entire route groups, not per-handler. Apply ownership scoping on all project-scoped queries at the database layer — the query must include `AND (client_id = :user OR editor_id = :user)`, not an after-fetch check.

---

## Open Questions (Need Team Decision Before Roadmap Is Finalized)

**Question 1: Accepted file types for draft upload**
Images only (JPG/PNG/WebP) or also video (MP4)?

This directly impacts the watermarking stack. Images: Intervention Image (PHP) or Sharp (Node) — straightforward, no binary issues, can spike in an hour. Video: FFmpeg — significant additional complexity, may not be available on the deployment host, requires a separate processing pipeline. Recommendation: start with images only. If editors on this platform primarily deliver video work, this must be decided in Week 1 — not Week 4.

**Question 2: Deployment target**
Vercel (if Next.js) / Railway / university VPS / shared hosting?

This determines the timer strategy. Vercel Cron Jobs are the simplest if using Next.js. For Laravel, `php artisan schedule:run` needs a persistent cron entry — university VPS or Railway are viable; most shared hosting is not. The deployment environment must be decided and tested before the timer implementation begins, or the team discovers in Week 6 that timers don't work in production.

**Question 3: "7 calendar days" exact definition**
Exactly 7 x 24 hours = 604,800 seconds from `draft_uploaded_at`? Or "midnight WIB at the end of day 7"?

Recommendation: `WHERE draft_uploaded_at <= NOW() - INTERVAL '7 days'` in UTC. This is 7 x 24 hours from upload time. The midnight-WIB interpretation adds timezone boundary logic that is error-prone. Document the chosen definition in code comments and in the contract display so editors know exactly when to expect auto-approval. All timestamp arithmetic in UTC; never use string-formatted dates for time calculations.

---

## Pitfalls to Watch

Ranked by severity and likelihood given the 7.5-week timeline:

**1. CRITICAL — Race condition on wallet balance / partial disbursement (F1 + F2)**
Two concurrent requests both read the same balance before either deducts. Mitigation: SELECT ... FOR UPDATE inside DB::transaction() on every wallet mutation. File unlock and fund transfer must be in the same transaction — if either fails, both roll back. Test with concurrent requests before any UI is built. This is the most important technical constraint in the codebase.

**2. CRITICAL — Audit log immutability is convention, not enforcement (L1 + L2)**
The app never calling UPDATE/DELETE on audit_logs is insufficient. The DB user must have these privileges revoked. Also: state mutations and audit log INSERTs must share the same transaction — never fire-and-forget. Both of these must be set in the first migration, not added later.

**3. CRITICAL — Silent cron job failure (T1)**
The 7-day auto-approve and 48h boundary timer produce no visible output when they fail. If the queue worker stops (server restart, deployment, hosting sleep), editors stop getting paid automatically with no visible indication. Mitigation: write a `last_run_at` heartbeat to a `system_health` table on every cron invocation; surface it on the Admin dashboard. Confirm the hosting environment supports persistent background processes before Week 3.

**4. CRITICAL — Watermarking complexity discovered too late (P2)**
If the watermark spike is left to Week 4+, the team may discover FFmpeg is unavailable on the host, or that processing blocks the upload thread, with no time to fix it. Spike in Week 1-2 on the actual deployment host with a real file of the accepted type.

**5. CRITICAL — Integration left to the final week (P1)**
All four critical modules (escrow, watermark, timers, audit log) must be tested end-to-end in the first or second sprint, even with stub implementations. Status enum constants must be defined before any controller is written. If the first time two modules interact is Week 6, the team will spend Week 7 firefighting.

**Moderate pitfalls to track (not Phase 1 blockers):**
- Auto-approve timer fires after manual completion (F4) — idempotency guard (status recheck inside transaction)
- Revision counter drift under concurrent requests (S2) — atomic conditional UPDATE at DB layer; CHECK constraint on revisions_taken
- Client-side-only revision button disable (A3) — backend must independently validate quota regardless of UI state
- IDOR on project resources (A2) — ownership scoping in every project query from day one
- Timezone drift on "7 calendar days" (T2) — all arithmetic in UTC, never string comparison

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Laravel path: HIGH (ecosystem familiarity dominant factor for this team). Next.js path: HIGH technically but MEDIUM for this specific team without knowing their TypeScript experience level. Stack conflict resolved in favor of team capability over technical preference. |
| Features | HIGH | Feature set is unambiguous. Table stakes are well-defined with no credible workarounds. Dependency chain is clear. Anti-features list is firm and specific. |
| Architecture | HIGH | Layered monolith with atomic transactions, two-bucket file storage, DB-deadline timers, and REVOKE-enforced audit log are well-established patterns. All constraints map cleanly to standard solutions with code examples. |
| Pitfalls | HIGH | Cross-checked against fintech transaction patterns, OWASP Top 10 (IDOR is #1 web risk), and scheduler reliability literature. Phase warnings are specific and actionable. |

**Overall confidence: HIGH**

### Gaps to Address During Planning

- **Accepted file types:** Images-only vs video must be decided before watermark implementation begins. Blocking for Phase 5 planning.
- **Deployment environment:** Timer strategy depends on hosting. Must be confirmed before Phase 1 schema finalization.
- **"7 calendar days" exact definition:** Team must agree and document before implementing the timer deadline column. Recommendation is 7 x 24h from upload timestamp in UTC.
- **Laravel vs Next.js final decision:** If team has React/TypeScript experience, Next.js stack is equally valid and well-researched in STACK.md. If uncertain, default to Laravel.

---

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` (2026-06-15) — Full-stack technology selection with version-specific rationale; Next.js 15, Drizzle, Neon, Vercel, sharp, pdf-lib
- `.planning/research/FEATURES.md` (2026-06-15) — Feature categorization across 5 functional areas; dependency chain analysis; MVP recommendation
- `.planning/research/ARCHITECTURE.md` (2026-06-15) — Laravel layered monolith patterns; atomic EscrowService with lockForUpdate(); timer polling with database deadline fields; Intervention Image watermark pipeline; 7-phase build order
- `.planning/research/PITFALLS.md` (2026-06-15) — 17 pitfalls across financial, access control, timer, status machine, audit log, and academic timeline categories; cross-checked against OWASP Top 10 and fintech transaction patterns
- `.planning/PROJECT.md` — Authoritative requirements, constraints, and key decisions

### Secondary (MEDIUM confidence)
- Laravel ecosystem familiarity in Indonesian Informatics programs — inferred from regional developer community norms; not team-specific. Team should confirm stack preference before roadmap is finalized.

---

*Research completed: 2026-06-15*
*Ready for roadmap: yes — pending resolution of 3 open questions above*
