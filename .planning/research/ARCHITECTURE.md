# Architecture Research — FairCut

**Researched:** 2026-06-15
**Confidence:** HIGH (patterns are well-established; all constraints map cleanly to standard solutions)

---

## System Components

FairCut fits a **layered monolith** with a clear React SPA frontend and a Laravel API backend sharing one PostgreSQL database. Do not introduce microservices — the team size and 7.5-week timeline make a distributed system a liability, not an asset.

### Component Map

```
Browser (React SPA)
    │  HTTP/JSON over HTTPS (TLS enforced)
    ▼
Laravel API (REST)
    ├── Auth Layer          — JWT or Sanctum session; role guard (Client / Editor / Admin)
    ├── HTTP Controllers    — Thin. Validate input, call Service, return response. No business logic.
    ├── Service Layer       — All business rules live here (escrow logic, quota enforcement, status transitions)
    ├── Repository Layer    — Eloquent queries isolated behind interfaces; never called from Controllers directly
    ├── Job/Queue Worker    — Background jobs dispatched from Services (watermark, disbursement)
    └── Scheduler (Cron)    — Single entry point; polls deadline fields every minute; dispatches due jobs
    │
    ▼
PostgreSQL Database
    ├── Domain Tables       — users, editor_profiles, projects, contracts, transactions, wallets, disputes
    ├── audit_logs          — INSERT-only; application role has no UPDATE/DELETE privilege on this table
    └── jobs / failed_jobs  — Laravel queue tables for async work
    │
    ▼
File Storage (local disk or S3-compatible)
    ├── /watermarked/       — Watermarked drafts served to client during In Progress / Revision
    └── /originals/         — Clean files; never served until project reaches Completed
```

### Boundary Rules (what talks to what)

| Caller | May Call | Must Not Call |
|--------|----------|---------------|
| Controller | Service Layer only | Repository, Eloquent models directly |
| Service | Repository, other Services, Queue dispatcher | Controller, HTTP layer |
| Repository | Eloquent models | Service Layer (no circular deps) |
| Queue Job | Service Layer | Controller |
| Scheduler | Queue dispatcher only | Service directly (keeps scheduler thin) |
| Frontend | API endpoints only | Database, file storage |

This boundary prevents business logic from bleeding into controllers or becoming hidden inside Eloquent models, which is the single most common cause of untestable Laravel codebases on academic projects.

---

## Data Flow

### Onboarding Flow (Editor Registration)

```
Editor fills form (name, email, KTP upload, portfolio)
    → POST /api/register/editor
    → Controller validates multipart form
    → AuthService::registerEditor() creates User + EditorProfile (status: pending_verification)
    → AuditLogService::log('editor_registered', actor: editor_id)
    → Response: 201 Created

Admin opens verification queue
    → GET /api/admin/verifications
    → Returns all EditorProfiles where status = pending_verification

Admin approves
    → PATCH /api/admin/verifications/{id}/approve
    → VerificationService::approve() updates EditorProfile status → verified
    → AuditLogService::log('editor_approved', actor: admin_id)
    → Notification queued (email or in-app) to Editor
```

### Project Lifecycle Flow

```
Client sends brief
    → POST /api/projects
    → ProjectService::createDraft() creates Project (status: draft)
    → AuditLog: project_created

Client deposits escrow
    → POST /api/projects/{id}/deposit
    → EscrowService::deposit() — wraps in DB::transaction():
        1. Check wallet balance >= project_fee (throws if not)
        2. Deduct from client wallet
        3. Credit escrow_held on transaction record
        4. Set Project status → in_progress
        5. Generate Contract (max_revisions locked, fee locked)
        6. AuditLog: escrow_deposited
    → All steps commit or all roll back. No intermediate states.

Editor uploads draft
    → POST /api/projects/{id}/upload-draft
    → Controller saves raw file to /tmp/
    → Dispatches WatermarkJob to queue
    → WatermarkJob runs Sharp (image) or pdf-lib (PDF):
        1. Reads original file
        2. Composites "DRAFT — FairCut" watermark
        3. Saves watermarked version to /watermarked/{project_id}/
        4. Saves original to /originals/{project_id}/
        5. Updates Project.draft_uploaded_at = now()  ← this starts the 7-day timer
        6. AuditLog: draft_uploaded

Client requests revision
    → POST /api/projects/{id}/revisions
    → RevisionService::request():
        1. Load contract.max_revisions and project.revisions_taken
        2. Reject if revisions_taken >= max_revisions (HTTP 422)
        3. Increment revisions_taken
        4. Set Project status → revision
        5. AuditLog: revision_requested
    → UI disables "Request Revision" button when revisions_taken === max_revisions

Client confirms completion
    → POST /api/projects/{id}/confirm
    → EscrowService::disburse() — wraps in DB::transaction():
        1. Set Project status → completed
        2. Calculate payout = contract.fee * 0.90
        3. Calculate commission = contract.fee * 0.10
        4. Debit escrow_held
        5. Credit editor wallet by payout
        6. Credit platform wallet by commission
        7. Unlock original file (Project.original_unlocked = true)
        8. Update Editor KPI: completion_rate, rating
        9. AuditLog: disbursement_completed
    → All steps commit or all roll back.
```

### Payout / Withdrawal Flow

```
Editor requests withdrawal
    → POST /api/wallet/withdraw
    → WalletService::requestWithdrawal():
        1. Load editor wallet balance
        2. Reject if balance < Rp100,000 (HTTP 422 with current balance)
        3. Create withdrawal record (status: pending)
        4. AuditLog: withdrawal_requested

Admin processes withdrawal
    → PATCH /api/admin/withdrawals/{id}/approve
    → WalletService::processWithdrawal() — DB::transaction():
        1. Re-check balance (double-check; balance cannot go negative)
        2. Debit wallet by withdrawal amount
        3. Set withdrawal status → completed
        4. AuditLog: withdrawal_completed
```

---

## Atomic Transaction Pattern

**The rule:** Every operation that touches more than one row — escrow deposit, disbursement, withdrawal — must execute inside a single `DB::transaction()` block. If any step throws, Laravel rolls back the entire transaction. No partial records. No orphaned wallet debits.

### Implementation: EscrowService (Laravel)

```php
// app/Services/EscrowService.php

public function deposit(Project $project, User $client): void
{
    DB::transaction(function () use ($project, $client) {
        $wallet = $client->wallet()->lockForUpdate()->firstOrFail();

        if ($wallet->balance < $project->fee) {
            throw new InsufficientFundsException();
        }

        // 1. Deduct from client
        $wallet->decrement('balance', $project->fee);

        // 2. Create escrow transaction record
        Transaction::create([
            'project_id'    => $project->id,
            'type'          => 'escrow_hold',
            'amount'        => $project->fee,
            'status'        => 'held',
        ]);

        // 3. Advance project status
        $project->update(['status' => 'in_progress']);

        // 4. Lock contract terms
        Contract::create([
            'project_id'    => $project->id,
            'max_revisions' => $project->requested_revisions,
            'fee'           => $project->fee,
            'issued_at'     => now(),
        ]);

        // 5. Append-only audit log (also inside transaction)
        AuditLog::create([
            'event'      => 'escrow_deposited',
            'actor_id'   => $client->id,
            'project_id' => $project->id,
            'payload'    => ['amount' => $project->fee],
        ]);
    });
    // If any line above throws, ALL changes are rolled back automatically.
}
```

**Critical: `lockForUpdate()`** on wallet reads. Without it, two concurrent deposit attempts could both read the same balance before either deducts — a classic TOCTOU race that lets balance go negative. The pessimistic lock serializes concurrent writes to the same wallet row.

**Wallet balance invariant:** Never credit first and then debit in the same transaction. Always debit the source before crediting the destination. The check-then-debit sequence inside a locked row is the pattern.

---

## Timer-Based Automation

FairCut has two deadline timers:

| Timer | Trigger | Deadline | Action |
|-------|---------|----------|--------|
| Auto-Approve | `draft_uploaded_at` set | +7 calendar days | Run `EscrowService::disburse()` as if client confirmed |
| Boundary Timer | Disbursement job fails | +48 hours | Escalate to Admin dashboard |

### Recommended Pattern: Database Deadline Field + Polling Cron

Do not use `setTimeout` or in-process timers. They vanish on server restart. Do not use a separate queue scheduler service — team overhead is too high. Use this:

1. Store the deadline as a timestamp column on the domain table.
2. A Laravel Scheduler entry runs every minute and queries for due records.
3. Due records are dispatched as queue jobs (not executed inline, so the cron finishes fast).

```php
// app/Console/Kernel.php

protected function schedule(Schedule $schedule): void
{
    $schedule->job(new ProcessAutoApprovalsJob)->everyMinute();
    $schedule->job(new ProcessBoundaryTimersJob)->everyMinute();
}
```

```php
// app/Jobs/ProcessAutoApprovalsJob.php

public function handle(EscrowService $escrow): void
{
    $due = Project::query()
        ->where('status', 'in_progress')
        ->whereNotNull('draft_uploaded_at')
        ->where('draft_uploaded_at', '<=', now()->subDays(7))
        ->get();

    foreach ($due as $project) {
        AutoApproveProjectJob::dispatch($project->id);
    }
}
```

```php
// app/Jobs/AutoApproveProjectJob.php

public function handle(EscrowService $escrow): void
{
    $project = Project::findOrFail($this->projectId);

    // Guard: already completed by human or another job
    if ($project->status !== 'in_progress') {
        return;
    }

    $escrow->disburse($project, actor: 'system_auto_approve');
}
```

**Boundary Timer schema addition:**

```sql
ALTER TABLE transactions ADD COLUMN disbursement_attempted_at TIMESTAMP NULL;
ALTER TABLE transactions ADD COLUMN boundary_deadline_at TIMESTAMP NULL;
ALTER TABLE transactions ADD COLUMN escalated_to_admin BOOLEAN DEFAULT FALSE;
```

When a disbursement job fails:
1. Catch the exception in `AutoApproveProjectJob::failed()`.
2. Set `boundary_deadline_at = now() + 48 hours` on the Transaction.
3. `ProcessBoundaryTimersJob` polls for `boundary_deadline_at <= now() AND escalated_to_admin = false`.
4. Sets `escalated_to_admin = true` and writes an AuditLog entry.
5. Admin dashboard query: `SELECT * FROM transactions WHERE escalated_to_admin = true AND resolved = false`.

**Why this beats alternatives:**
- Pure cron (fixed time): Can't handle per-project individual deadlines (all projects would share the same fire time).
- Redis delayed queues: Adds Redis as an infra dependency; overkill for 200 concurrent projects.
- Database polling every minute: Handles 200 projects with a single indexed query in under 5ms. Index `(status, draft_uploaded_at)` and `(boundary_deadline_at, escalated_to_admin)`.

---

## Watermark Injection

**Rule:** Never trust the client to receive the original file before payment is confirmed. The watermark pipeline runs server-side on every upload.

### Implementation: Queue Job with Sharp (via Node) or Intervention Image (PHP)

For a Laravel backend, **Intervention Image v3** is the pragmatic choice — zero Node.js dependency, pure PHP, handles JPG/PNG/WebP. For PDF, use **FPDI + FPDF** or **Spatie/pdf-to-image** for rasterizing pages then watermarking.

```php
// app/Jobs/WatermarkJob.php

public function handle(): void
{
    $project = Project::findOrFail($this->projectId);
    $originalPath = storage_path("app/originals/{$project->id}/{$this->filename}");
    $watermarkedPath = storage_path("app/watermarked/{$project->id}/{$this->filename}");

    $image = Image::read($originalPath);

    $image->text(
        text: 'DRAFT — FairCut',
        x: $image->width() / 2,
        y: $image->height() / 2,
        font: function (FontFactory $font) {
            $font->filename(resource_path('fonts/roboto.ttf'));
            $font->size(48);
            $font->color('rgba(200, 200, 200, 0.6)');
            $font->align('center');
            $font->valign('middle');
            $font->angle(45);
        }
    );

    $image->save($watermarkedPath);

    $project->update([
        'watermarked_file_path' => "watermarked/{$project->id}/{$this->filename}",
        'original_file_path'    => "originals/{$project->id}/{$this->filename}",
        'draft_uploaded_at'     => now(),
    ]);

    AuditLog::create([
        'event'      => 'draft_uploaded',
        'actor_id'   => $project->editor_id,
        'project_id' => $project->id,
    ]);
}
```

**File serving rules (enforced in controller, not just by path):**

```php
// FileController.php

public function serveDraft(Project $project): StreamedResponse
{
    $this->authorize('downloadDraft', $project);  // Policy: status in [in_progress, revision]
    return Storage::download($project->watermarked_file_path);
}

public function serveOriginal(Project $project): StreamedResponse
{
    $this->authorize('downloadOriginal', $project);  // Policy: status = completed AND requester is client/editor on this project
    return Storage::download($project->original_file_path);
}
```

Never expose `/storage/originals/` via a public route. Serve all files through these controller methods that check project status before streaming.

---

## Suggested Build Order

Dependencies flow downward. Each phase must be complete before the next can function.

```
Phase 1 — Foundation
  ├── Database schema (all tables, constraints, indexes)
  ├── Auth system (registration, login, role guard)
  ├── Audit log infrastructure (insert-only, trigger-enforced)
  └── Base Service/Repository wiring
        WHY FIRST: Every other phase writes to these tables and logs.
        Nothing works without auth; nothing is trustworthy without the audit log.

Phase 2 — Editor Onboarding + Admin Verification
  ├── Editor registration form + KTP upload
  ├── Admin verification queue UI
  └── Notification log on approval/rejection
        WHY SECOND: Editors must exist and be verified before
        clients can find or hire them. Unblocks directory.

Phase 3 — Client-Side Directory + Brief Submission
  ├── Editor public directory (filter by specialization, rating)
  ├── Project brief submission → Project record (status: draft)
  └── Editor receives brief notification
        WHY THIRD: Requires verified editors (Phase 2).
        Produces the Project entity that escrow depends on.

Phase 4 — Contract + Escrow Deposit (CRITICAL PATH)
  ├── EscrowService::deposit() with DB::transaction + lockForUpdate
  ├── Auto-generated Contract (max_revisions, fee, issued_at)
  └── Project status → in_progress
        WHY FOURTH: Highest-risk code. Build and test in isolation
        before adding upload and timer dependencies.

Phase 5 — Project Execution (Upload + Watermark + Revisions)
  ├── Editor draft upload → WatermarkJob dispatched
  ├── Watermarked draft served to client; original locked
  ├── Revision request with quota enforcement
  └── draft_uploaded_at set (starts 7-day timer clock)
        WHY FIFTH: Requires escrow (Phase 4) to be in_progress.
        Timer only starts when upload happens.

Phase 6 — Completion + Payout + Timers
  ├── Client "Konfirmasi Selesai" → EscrowService::disburse()
  ├── Auto-approve scheduler (ProcessAutoApprovalsJob)
  ├── Boundary timer + Admin escalation (ProcessBoundaryTimersJob)
  └── Editor KPI update (rating, completion_rate)
        WHY SIXTH: Requires full project lifecycle (Phases 4-5).
        Timers can only be tested end-to-end once upload is live.

Phase 7 — Wallet + Withdrawal + Admin Controls
  ├── Editor wallet dashboard (balance, transaction history)
  ├── Withdrawal request + balance validation
  ├── Admin withdrawal approval
  ├── User suspension
  └── Dispute opening / resolution / 48h escalation
        WHY LAST: Wallet balance only exists after disbursements run.
        Disputes require complete project records.
```

### Build Order Implications for Roadmap

- **Phases 1 and 4 are gates.** If Phase 1 (auth + schema) slips, everything slips. If Phase 4 (escrow atomicity) has bugs, financial data is corrupt.
- **Phase 4 needs the most review time.** Reserve extra testing budget here.
- **Phase 6 timers are integration-heavy.** They require a running queue worker AND a cron entry AND database records from Phases 4-5. Do not attempt before Phase 5 is stable.
- **Phase 7 is naturally last** because wallet balances only accumulate after disbursements. Testing withdrawal requires at least one completed project.

---

## Anti-Patterns to Avoid

### 1. Fat Controllers
Business logic (escrow, quota checking, status transitions) inside controller methods. The fix is already built into the component boundary table above: controllers call Services and return responses.

### 2. Direct Model Mutation Outside Transactions
Any code that does `$wallet->balance -= $amount; $wallet->save()` outside a transaction is a data integrity bug. Always use `DB::transaction()` for multi-step financial operations.

### 3. Client-Side Timer Logic
`setTimeout(7 * 24 * 60 * 60 * 1000, ...)` in JavaScript. The browser tab closes, the timer dies. All timers must be database-driven and polled server-side.

### 4. Serving Original Files via Public Storage Path
If `/storage/originals/` is publicly accessible, clients can bypass the payment gate. All files must route through authenticated controller methods that check project status.

### 5. Updating Audit Logs
Any `UPDATE audit_logs` or `DELETE FROM audit_logs` in application code is a compliance violation. Enforce this at the database level: revoke UPDATE and DELETE privileges from the application database role on the `audit_logs` table.

```sql
REVOKE UPDATE, DELETE ON audit_logs FROM faircut_app_user;
```

### 6. Allowing Status Transitions in Reverse
Project status is a one-way state machine: `draft → in_progress → revision → completed`. Add a database check constraint or an Eloquent model guard that throws if a transition goes backward. Never allow `completed → in_progress`.

---

## Scalability Note (200 Concurrent Projects)

The 200-project target is achievable with basic indexing:

```sql
CREATE INDEX idx_projects_status_uploaded ON projects (status, draft_uploaded_at);
CREATE INDEX idx_transactions_boundary ON transactions (boundary_deadline_at, escalated_to_admin);
CREATE INDEX idx_audit_logs_project ON audit_logs (project_id, created_at);
```

A single PostgreSQL instance handles this load with no read replicas needed. Do not prematurely add caching layers (Redis) — the added infra complexity is not justified at this scale for an academic project.
