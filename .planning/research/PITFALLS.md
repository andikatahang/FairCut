# Pitfalls Research — FairCut

**Domain:** HRIS / Freelance Marketplace / Escrow Web Platform
**Researched:** 2026-06-15
**Confidence:** HIGH (domain-specific; findings cross-checked across fintech, OWASP, and state-machine literature)

---

## Financial / Escrow Pitfalls

### CRITICAL — Pitfall F1: Race Condition on Wallet Balance (Double-Spend)

**What goes wrong:**
Two concurrent HTTP requests both read the same wallet balance before either has written back. Both pass the "sufficient funds" check. Both deduct. The wallet goes negative. For FairCut this surfaces most acutely at `Konfirmasi Selesai` (escrow release) if a client double-taps the button, or at the withdrawal endpoint if the editor spams the submit.

**Why it happens:**
Application-layer balance checks (`SELECT balance FROM wallets WHERE id = ?` followed by `UPDATE`) are not atomic. Between the SELECT and the UPDATE, another request can read the same stale value.

**Consequences:**
- Editor wallet balance goes negative (violates the hard constraint in PROJECT.md)
- Escrow funds are disbursed twice, corrupting the platform's internal ledger
- Audit log records an impossible state that is permanent and immutable

**Prevention:**
Use `SELECT ... FOR UPDATE` (pessimistic row-level lock) inside a database transaction for all balance-mutating operations. The pattern is:
```sql
BEGIN;
SELECT balance FROM wallets WHERE id = ? FOR UPDATE;
-- validate balance here inside the transaction
UPDATE wallets SET balance = balance - ? WHERE id = ?;
COMMIT;
```
Never read balance in application code and then write; let the atomic `UPDATE ... WHERE balance >= amount` double-gate it:
```sql
UPDATE wallets SET balance = balance - :amount
WHERE id = :wallet_id AND balance >= :amount;
-- check affected rows = 1; if 0, reject
```

**Warning signs:**
- Withdrawal or disbursement endpoint has no database transaction wrapping SELECT and UPDATE together
- Balance check is done in application code before the DB write
- No `FOR UPDATE` or equivalent row-lock in any wallet mutation path

**Phase to address:** Wallet & Escrow module (Phase covering Contract & Escrow + Wallet)

---

### CRITICAL — Pitfall F2: Partial Disbursement on Parallel Gateway

**What goes wrong:**
The "Konfirmasi Selesai" parallel gateway must atomically: (1) mark the original file as accessible and (2) transfer escrow funds to the editor wallet minus 10% commission. If these are executed as two separate database calls without a wrapping transaction, a server crash or network timeout between them leaves the system in a split state: file unlocked but funds never transferred (editor loses money) or funds transferred but file still locked (client loses access to work they paid for).

**Why it happens:**
Developers implement the two operations as sequential service calls. The commit to `projects.file_access = unlocked` succeeds; the subsequent wallet transfer fails on a transient error. With no rollback wrapping both, the first change is permanent.

**Consequences:**
- Editor delivers work but is never paid — the core trust failure FairCut is designed to prevent
- Or client pays and can never download the final file — destroys user trust immediately
- The immutable audit log records the partial state, making manual remediation complex

**Prevention:**
Wrap both operations in a single database transaction. Both the `project_files.access_status` update and the `wallet_transactions` insert (with corresponding `wallets.balance` update) must either all commit or all roll back together.

If the two concerns live in different services or tables that cannot share a transaction, implement a transactional outbox: write both mutations as a single row in an `outbox` table first, then a separate processor applies them and marks the outbox row complete. Never treat them as independent.

**Warning signs:**
- Two separate `await db.update(...)` calls with no surrounding `BEGIN`/`COMMIT`
- The "completion" endpoint calls a `fileService.unlock()` and then a `walletService.transfer()` as independent async calls
- No rollback logic exists for the second operation if the first already committed

**Phase to address:** Completion & Payout module

---

### MODERATE — Pitfall F3: Commission Calculation Rounding Errors

**What goes wrong:**
10% commission on amounts like Rp 175,000 produces Rp 17,500 (clean). But Rp 333,333 produces Rp 33,333.3 — a fractional rupiah. Floating-point arithmetic causes ledger imbalances: escrow_amount ≠ editor_payout + platform_commission over time.

**Prevention:**
Always store and calculate amounts in integer rupiah (no decimals). Use integer arithmetic: `commission = Math.floor(amount * 0.10)`, `editor_payout = amount - commission`. Define rounding direction in a single place (floor, ceiling, or banker's rounding) and never let it drift across modules.

**Warning signs:**
- Wallet balance column defined as `FLOAT` or `DOUBLE` instead of `BIGINT` (storing integer cents/rupiah)
- Commission calculation appears in multiple places in the codebase with no shared utility function

**Phase to address:** Contract & Escrow module

---

### MODERATE — Pitfall F4: Auto-Approve Timer Fires After Manual Confirmation

**What goes wrong:**
Client confirms completion manually at T+6 days. Status transitions to `Completed`. Payout executes. The 7-day auto-approve timer fires at T+7, reads a project that is already `Completed`, and attempts a second payout. If the timer logic does not check current status before acting, funds transfer twice.

**Prevention:**
All timer-triggered operations must recheck project status inside the same database transaction before executing. The timer job body must read-then-act atomically:
```sql
BEGIN;
SELECT status FROM projects WHERE id = ? FOR UPDATE;
-- only proceed if status = 'In Progress' or 'Revision'
-- (not 'Completed' or 'Cancelled')
COMMIT;
```
Make every timer handler idempotent: running it twice on a `Completed` project must be a no-op, not a second payout.

**Warning signs:**
- Timer handler queries project status in a separate SELECT before the UPDATE with no transaction wrapping both
- No explicit state check at the start of the auto-approve job body

**Phase to address:** Timer & Automation module

---

## Access Control Pitfalls

### CRITICAL — Pitfall A1: File Access Before Escrow Lock (Watermark Bypass via Direct URL)

**What goes wrong:**
Server-side watermarking is applied on upload. But the download endpoint returns a direct file path or a long-lived signed URL. An attacker (or curious client) bookmarks or shares the URL of the watermarked file during `In Progress`, then reuses the same URL after project `Completed` status — or worse, accesses the original (unwatermarked) file via a predictable path like `/uploads/originals/project-42.mp4` because the originals directory is not access-controlled.

**Why it happens:**
The watermark system protects the on-upload copy, but the serving layer does not enforce per-request authorization. Static file serving (nginx `location /uploads`) bypasses all application-layer RBAC.

**Consequences:**
- Client downloads final unwatermarked file without confirming completion (never triggering payout)
- Editor's original work is permanently accessible without payment — the primary trust breach FairCut must prevent

**Prevention:**
- Never serve files from a publicly accessible static path. All file downloads must go through an authenticated application route that checks `project.status` and `user.role` at request time.
- For the original file: only accessible when `project.status = 'Completed'` AND `requesting_user = project.client_id`.
- For the watermarked draft: only accessible when `project.status IN ('In Progress', 'Revision')` AND `requesting_user = project.client_id`.
- Generate short-lived (minutes, not hours) signed tokens for actual file bytes. The application issues a token; the token encodes `{file_id, allowed_statuses, expires_at, user_id}`. Any request with an expired or mismatched token is rejected.

**Warning signs:**
- `uploads/` directory served by web server without authentication
- Download link is a static URL containing the file path
- No status check performed when a download is requested

**Phase to address:** File Upload & Watermark module (before any client-facing download feature ships)

---

### CRITICAL — Pitfall A2: Horizontal Privilege Escalation (IDOR on Project Resources)

**What goes wrong:**
Editor A can view or act on Editor B's project by changing the project ID in the URL: `GET /api/projects/99/files` (where project 99 belongs to a different editor). OWASP classifies this as Broken Access Control — the #1 web application risk, present in 94% of tested apps.

**Why it happens:**
Backend route handlers check that the user is authenticated (has a valid session) but do not verify that `project.editor_id = current_user.id` or `project.client_id = current_user.id`. Role check passes (user is an Editor); ownership check is missing.

**Consequences:**
- Editors can download other editors' watermarked drafts
- Clients can confirm completion on another client's project, triggering payout to the wrong editor
- Admin functions exposed to non-admins via URL manipulation

**Prevention:**
Every data query involving a project must include ownership scoping at the database layer, not the application layer:
```sql
SELECT * FROM projects WHERE id = :id AND (client_id = :user OR editor_id = :user);
```
Never fetch a project by ID alone, then check ownership in application code after — that pattern is racy and error-prone. Define a `canAccess(userId, projectId, role)` guard called as middleware on every project route.

**Warning signs:**
- Route handler does `Project.findById(req.params.id)` without an ownership condition
- Ownership check is done after fetching (if not project → 404; else if project.editorId !== user.id → 403) — two separate DB calls
- Tests exist for authentication but not for cross-user access

**Phase to address:** All modules with project-scoped endpoints; enforce in Phase 1 as a baseline middleware pattern

---

### MODERATE — Pitfall A3: Client-Side Revision Button Disable as Only Guard

**What goes wrong:**
The "Request Revision" button is disabled in the frontend when `revisions_taken >= max_revisions`. A technically literate client sends the `POST /api/projects/:id/revisions` request directly via browser dev tools or curl, bypassing the UI entirely. Backend increments `revisions_taken` without its own quota check.

**Prevention:**
The frontend disable is a UX courtesy, not a security control. The backend must independently validate `revisions_taken < max_revisions` before accepting any revision request. Return HTTP 422 with a descriptive error message if the quota is exhausted.

**Warning signs:**
- Revision endpoint does not query `max_revisions` from the contract before incrementing
- Backend treats "button is disabled" as an implicit guarantee

**Phase to address:** Project Execution & Revision Quota module

---

### MODERATE — Pitfall A4: Admin Routes Accessible to Editor/Client via Role Confusion

**What goes wrong:**
Admin-only endpoints (suspend user, manual payout execution, dispute resolution) return data or execute actions when called by a non-Admin session with a valid JWT. This happens when middleware checks `req.user.role === 'admin'` but the role string comes from the JWT payload that was never verified against the database after issuance — or when a role check middleware is accidentally omitted from one admin route.

**Prevention:**
- Centralize role guard as a middleware factory: `requireRole('admin')` applied to entire admin routers, not individual handlers
- Verify role from the database on sensitive operations, not only from the JWT
- Use integration tests that assert 403 responses for non-admin roles on every admin endpoint

**Warning signs:**
- Role checks scattered across individual handlers rather than applied at the router level
- No test covering "Editor calls Admin endpoint → expect 403"

**Phase to address:** Auth & RBAC module (establish early; all subsequent modules inherit)

---

## Timer / Automation Pitfalls

### CRITICAL — Pitfall T1: Silent Cron Job Failure

**What goes wrong:**
The 7-day auto-approve cron job fails to run — server restart, deployment, unhandled exception in the job body, or cloud platform sleeping idle containers. No alert fires. Projects stay in `In Progress` indefinitely. Editors never get paid automatically. The 48-hour boundary timer for failed disbursements also never escalates to Admin. Both editors and admins are unaware.

**Why it happens:**
Cron output goes to a log nobody reads. Cloud platforms (Heroku, Render, Railway free tier) spin down dynos after inactivity — killing any in-process setInterval or node-cron scheduler. There is no heartbeat monitoring.

**Consequences:**
- Auto-approve never fires → editor is unpaid for weeks on silent clients
- 48h boundary timer never fires → failed disbursements never escalate → Admin never sees them
- Platform appears broken to editors who expect automated payment

**Prevention:**
- Use a durable, database-backed scheduler (e.g., `pg-boss` for PostgreSQL, or `BullMQ` with Redis) rather than in-process `setInterval` or `node-cron`. These survive restarts by reading pending jobs from durable storage on startup.
- Implement a job heartbeat: every successful run writes a `last_run_at` timestamp to a `system_health` table. A separate lightweight monitor alerts if `last_run_at > expected_interval * 1.5`.
- Make every timer job idempotent — safe to re-run on startup.
- For academic deployment: document the cron setup explicitly and test it on the actual hosting environment, not only localhost.

**Warning signs:**
- Timer implemented as `setInterval` or `node-cron` at app startup without persistence
- No database record of last successful cron execution
- No alert or log entry when cron runs (success or failure)

**Phase to address:** Timer & Automation module; verify in deployment environment before academic submission

---

### MODERATE — Pitfall T2: Timezone Drift on "7 Calendar Days"

**What goes wrong:**
"7 calendar days after watermarked draft upload" is ambiguous in implementation. If the server uses UTC and the database stores timestamps in UTC but the requirement is interpreted as "7 × 24 hours = 604800 seconds", a file uploaded at 23:59 WIB (UTC+7) is auto-approved 7 days later at 23:59 WIB. This is probably fine. But if the server clock is set to UTC+7 (WIB) and the deployment platform converts timestamps — or a developer hardcodes `new Date()` without explicit timezone handling — the timer fires at the wrong time.

**Prevention:**
- Store all timestamps in UTC in the database
- Calculate all time deltas in UTC: `WHERE draft_uploaded_at <= NOW() - INTERVAL '7 days'`
- Never use string-formatted dates for time arithmetic
- Document the timezone assumption in a single config constant

**Warning signs:**
- Timestamp calculations mix `new Date()` (local timezone) with database UTC timestamps
- "7 days" calculated as string comparison rather than datetime arithmetic

**Phase to address:** Timer & Automation module

---

### MODERATE — Pitfall T3: Timer Does Not Survive Application Redeploy

**What goes wrong:**
During the 7-week development cycle, the application will be redeployed many times. An in-process timer (setTimeout / setInterval) tracking the 48h boundary or 7-day auto-approve is destroyed on each redeploy. Projects that were mid-timer reset their clocks on every deployment.

**Prevention:**
Timer state must live in the database, not process memory. The auto-approve job must query: `SELECT * FROM projects WHERE status IN ('In Progress', 'Revision') AND draft_uploaded_at <= NOW() - INTERVAL '7 days'`. This query is correct regardless of restarts because truth is in the database row, not the process timer.

**Warning signs:**
- Timer logic stores expiry as an in-memory variable: `const timers = {}; timers[projectId] = setTimeout(...)`
- No `deadline_at` column on projects table

**Phase to address:** Timer & Automation module; add `auto_approve_deadline` column to projects schema at the database design phase

---

## Status Machine Pitfalls

### CRITICAL — Pitfall S1: Illegal Reverse Status Transitions

**What goes wrong:**
A project transitions to `Completed`. A subsequent API call (race condition, duplicate request, or malicious replay) transitions it back to `In Progress` or `Revision`. Escrow funds are released again. Alternatively, a project goes from `Draft` directly to `Completed`, skipping escrow deposit entirely — meaning the editor delivers work with no payment guarantee.

**Why it happens:**
The status update endpoint accepts any new status value without validating the current status. Guards are written as application-level if/else checks that can be bypassed if the same endpoint is called concurrently or via direct database access.

**Consequences:**
- Double payout (escrow released twice)
- Work delivered without payment protection (escrow never locked)
- Audit log records impossible transitions, corrupting compliance history

**Prevention:**
Define the allowed transition matrix explicitly and enforce it at the database layer:

| From | To | Allowed |
|------|----|---------|
| Draft | In Progress | Yes (escrow deposit) |
| In Progress | Revision | Yes (revision request) |
| In Progress | Completed | Yes (client confirm or auto-approve) |
| Revision | In Progress | Yes (editor re-submits) |
| Revision | Completed | Yes (client confirm after revision) |
| Completed | anything | NEVER |
| Cancelled | anything | NEVER |

Implement as a database-level check constraint or as a guarded UPDATE:
```sql
UPDATE projects
SET status = :new_status
WHERE id = :id AND status = :expected_current_status;
-- check affected rows = 1; if 0, reject (concurrent modification or illegal transition)
```

**Warning signs:**
- `UPDATE projects SET status = ? WHERE id = ?` with no current-status condition
- Status transitions validated only in frontend code
- No test covering "attempt to move Completed → In Progress → expect rejection"

**Phase to address:** Project Execution module; define transition matrix before any status-changing endpoint is built

---

### MODERATE — Pitfall S2: Revision Counter Drift Under Concurrent Requests

**What goes wrong:**
A client sends two rapid revision requests (double-tap, network retry, or race condition). Both requests read `revisions_taken = 2` with `max_revisions = 3`. Both pass the quota check. Both increment: result is `revisions_taken = 4`, exceeding the contract quota with no record of how. The audit log shows two legitimate-looking revision events.

**Prevention:**
Use a database-level atomic increment with a conditional constraint:
```sql
UPDATE projects
SET revisions_taken = revisions_taken + 1
WHERE id = :id
  AND revisions_taken < (SELECT max_revisions FROM contracts WHERE project_id = :id)
  AND status = 'In Progress';
-- check affected rows = 1; if 0, reject
```
This is atomic — no read-then-write gap. Combine with a `CHECK (revisions_taken <= max_revisions)` constraint on the projects table for belt-and-suspenders protection.

**Warning signs:**
- Backend reads `revisions_taken`, compares to `max_revisions` in application code, then separately issues an increment
- No database-level CHECK constraint on revisions_taken

**Phase to address:** Project Execution & Revision Quota module

---

### MINOR — Pitfall S3: Project Stuck in Limbo After Editor Rejection of Brief

**What goes wrong:**
A brief is submitted; the editor declines it. The project record stays in `Draft` indefinitely with no actor able to move it forward. The client may not know it was rejected. The project occupies the editor's queue visually. Over time, stale Draft projects accumulate and pollute the Admin dashboard.

**Prevention:**
Define explicit terminal states: `Cancelled` (declined/withdrawn) is a terminal state alongside `Completed`. Add a "decline brief" action that transitions `Draft → Cancelled` with a logged reason. Add a cleanup query for Admin to view and act on orphaned Drafts older than N days.

**Phase to address:** Brief Submission & Directory module

---

## Audit Log Pitfalls

### CRITICAL — Pitfall L1: Partial Immutability — Blocked at App Layer, Open at DB Layer

**What goes wrong:**
The application layer never issues `UPDATE` or `DELETE` on the audit_logs table. But the database user the application connects with has `UPDATE` and `DELETE` privileges on that table. A SQL injection vulnerability, a compromised application credential, or a developer running a hotfix in production can silently alter or delete log entries. The log appears immutable by convention, not by enforcement.

**Consequences:**
- Compliance evidence can be destroyed without detection
- Disputes cannot be resolved reliably if the log can be altered after the fact
- For academic assessment: if the examiner checks DB permissions, this is an immediate flag

**Prevention:**
The database user the application runs as must have only `INSERT` and `SELECT` on `audit_logs`. `UPDATE` and `DELETE` must be revoked:
```sql
REVOKE UPDATE, DELETE ON audit_logs FROM app_user;
```
A separate privileged user (admin-only, not used by the application) retains DDL access for schema migrations only.

**Warning signs:**
- Application DB connection string uses a superuser or `postgres` role
- `audit_logs` table permissions were never explicitly configured
- No database-level test asserting that `UPDATE audit_logs` fails

**Phase to address:** Database schema phase; set permissions in the initial migration, not as an afterthought

---

### CRITICAL — Pitfall L2: Dual-Write Divergence Between State and Audit Log

**What goes wrong:**
The application updates `projects.status` in one query and then writes to `audit_logs` in a separate query. A crash, timeout, or unhandled exception between the two means the project state changes but no audit entry is recorded — or (worse) the audit entry is written but the state change fails and is rolled back, leaving a phantom log entry for an event that never happened.

**Prevention:**
Both the state mutation and the audit log INSERT must be inside the same database transaction. This is non-negotiable. One transaction either commits both or rolls back both:
```sql
BEGIN;
UPDATE projects SET status = 'Completed' WHERE id = :id;
INSERT INTO audit_logs (project_id, actor_id, event_type, payload, created_at)
  VALUES (:id, :actor, 'PROJECT_COMPLETED', :payload, NOW());
COMMIT;
```

**Warning signs:**
- State updates and audit inserts are in separate `try` blocks with independent error handling
- Audit insert is called as a fire-and-forget (`await auditService.log(...)` outside the transaction)

**Phase to address:** All modules; establish as a coding pattern in the first module that touches projects

---

### MODERATE — Pitfall L3: Missing Actor on Automated Events

**What goes wrong:**
The 7-day auto-approve cron job transitions a project to `Completed` and releases payment. The audit log records the event but `actor_id` is `NULL` because there is no user session in a cron context. Later, during a dispute, neither party can tell whether the completion was triggered by the client, the editor, or the system. Examiners reviewing the log cannot reconstruct what happened.

**Prevention:**
Reserve a sentinel actor for system-initiated events. Either create a dedicated `system` user row in the users table and use its ID, or add a non-nullable `actor_type` column (`'user'` or `'system'`) alongside `actor_id`. Every audit entry must unambiguously identify who or what caused it.

**Warning signs:**
- `audit_logs.actor_id` is nullable
- Cron job handler does not set an actor before writing the log

**Phase to address:** Timer & Automation module; design the sentinel actor at schema phase

---

### MINOR — Pitfall L4: Audit Log Becomes a Performance Bottleneck

**What goes wrong:**
Every page load, status check, or project listing also queries `audit_logs` to display the event history. With 200 concurrent active projects generating many events each, the audit log table grows large. Queries that join projects to audit_logs without indexes cause slow page loads.

**Prevention:**
- Index `audit_logs(project_id, created_at DESC)` from day one
- Never join audit_logs into a project listing query — only load audit history on the specific project detail page
- Keep current project state in the `projects` table; audit_logs is for history only, not for deriving current state

**Phase to address:** Database schema phase

---

## Academic / Timeline Pitfalls

### CRITICAL — Pitfall P1: Integration Left to the Final Week

**What goes wrong:**
In a 7.5-week project, teams often build modules in isolation (auth, escrow, watermark, timers) and attempt to wire them together in week 7. The seams between modules surface unexpected data shape mismatches, missing foreign keys, inconsistent status strings (`"in_progress"` vs `"In Progress"` vs `"inprogress"`), and broken transaction boundaries. Integration week becomes firefighting week with no buffer.

**Prevention:**
- Define shared data contracts (status enum values, API response shapes, table schemas) in a single source of truth at the start of the project, before any module is built
- Build and test one complete end-to-end flow (brief → escrow deposit → watermarked draft → confirm → payout) in the first or second sprint, even if only with stub implementations
- Integration tests for the critical path must pass at every phase transition, not just at the end

**Warning signs:**
- No shared enum/constant file for status strings
- Modules developed by different team members with no agreed API contract
- First time two modules interact is in the final sprint

**Phase to address:** Foundation phase (first 1-2 weeks); enforce status enum as a shared constant immediately

---

### CRITICAL — Pitfall P2: Watermark Implementation Discovered to Be Complex Too Late

**What goes wrong:**
Server-side watermarking on visual files (images, video thumbnails) requires a library like Sharp (images) or FFmpeg (video). These have non-trivial setup, binary dependencies, and processing time. A team that leaves watermark implementation to week 5 discovers that:
- FFmpeg is not available on the deployment host
- Processing a video file blocks the HTTP request thread for seconds
- The watermark appears on some file types but silently skips others

**Prevention:**
- Spike the watermark implementation in week 1 or 2: write a proof-of-concept that injects a visible text/image watermark on the exact file types the platform accepts
- Clarify accepted file types early: images only (Sharp is straightforward), or video (FFmpeg adds significant complexity)
- Run watermark processing as a background job, not synchronously in the upload endpoint — the upload endpoint should return immediately and set `file.status = 'processing'`; a worker applies the watermark and sets `file.status = 'ready'`

**Warning signs:**
- Accepted file types never formally decided
- Watermark library not yet installed by week 3
- Watermark applied synchronously in the upload request handler

**Phase to address:** File Upload & Watermark module (must be in the first half of the timeline)

---

### MODERATE — Pitfall P3: Scope Creep from "Nice to Have" Features

**What goes wrong:**
The PROJECT.md Out of Scope list is correct and important. But during development, team members add small features: email notifications, rating UI with stars, dispute chat, portfolio image gallery. Each feels small. Collectively they consume 2-3 weeks and the critical-path features (atomic escrow, working timers, watermarking) are incomplete at submission.

**Prevention:**
- Treat Out of Scope as a locked list. Any addition requires explicit team consensus and a written trade-off acknowledgment
- Measure progress weekly against the critical-path requirements in PROJECT.md, not against total features built
- If behind schedule, cut differentiators before cutting table-stakes escrow/timer/watermark features

**Warning signs:**
- Team is building email notifications before escrow is working
- "Just a small addition" requests approved without checking project timeline

**Phase to address:** All phases; enforce scope discipline at every sprint planning

---

### MODERATE — Pitfall P4: Testing Only the Happy Path

**What goes wrong:**
The academic demo shows: register → submit brief → deposit → upload draft → confirm → payout. Every module works in sequence. The examiner then asks: "What happens if the client requests a revision after the quota is exhausted?" or "What happens if two people confirm completion at the same time?" These edge cases were never tested. The system crashes, returns 500, or produces incorrect data live.

**Prevention:**
For each critical requirement, write at least one adversarial test:
- Revision request with `revisions_taken = max_revisions` → expect 422
- Double-confirm completion (two near-simultaneous requests) → expect one success, one rejection
- Download original file before completion → expect 403
- Auto-approve fires on already-Completed project → expect no-op (idempotent)
- Withdrawal with balance < Rp100,000 → expect 422 with exact balance displayed

**Warning signs:**
- Test suite only covers the sequence shown in the requirements document
- No test ever intentionally violates a business rule

**Phase to address:** Each module; adversarial tests written alongside feature implementation, not at the end

---

### MINOR — Pitfall P5: KTP Upload Stored Without Access Control

**What goes wrong:**
Editor KTP (national ID) uploads are sensitive personal data. If stored at a predictable path (`/uploads/ktp/editor-12.jpg`) served statically, anyone with the URL can access it. This is a privacy violation and, in Indonesian law context, potentially a PDP (Personal Data Protection) compliance issue.

**Prevention:**
- Store KTP uploads in the same access-controlled file serving path as project files (not a public static directory)
- Only Admin role can fetch KTP files, and only for the purpose of verification
- After verification decision (approve/reject), the access need is satisfied; consider whether long-term storage is necessary

**Warning signs:**
- KTP files served from the same public uploads directory as portfolio images
- No role check on the KTP file download route

**Phase to address:** Registration & Onboarding module

---

## Phase-Specific Warning Summary

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Database schema design | No status enum constant; nullable actor_id; float balance columns | Define enums, constraints, and DB user permissions in the first migration |
| Auth & RBAC | Ownership check missing from project routes; admin routes unguarded | Apply `requireOwnership` and `requireRole` middleware at the router level before any feature routes |
| File Upload & Watermark | FFmpeg/Sharp not available on host; synchronous processing blocks thread | Spike in week 1-2; use background worker for processing |
| Contract & Escrow | Race condition on wallet balance; commission rounding error | `SELECT FOR UPDATE` + integer arithmetic; wrap in single transaction |
| Project Execution | Revision counter drift; client-side-only quota guard | Atomic conditional UPDATE; backend validation independent of frontend |
| Completion & Payout | Partial parallel gateway; timer fires post-completion | Single wrapping transaction; idempotency guard in timer job |
| Timer & Automation | Silent cron failure; in-process timer destroyed on redeploy | Durable DB-backed scheduler; heartbeat monitoring; `deadline_at` column |
| Audit Log | Partial immutability; dual-write divergence; null actor | DB-level REVOKE; shared transaction for state+log; sentinel system actor |
| Integration | Status string mismatches; broken transaction boundaries | Shared enum constant from day one; end-to-end test in sprint 1 |
| Academic Submission | Untested edge cases exposed in demo | Adversarial tests for every business rule violation |
