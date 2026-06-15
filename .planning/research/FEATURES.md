# Features Research — FairCut

**Domain:** Freelance marketplace + HRIS for Indonesian creative editors
**Researched:** 2026-06-15
**Scope note:** All features evaluated against FairCut's fixed constraints — 7.5-week timeline, simulated escrow, three roles (Client / Editor / Admin), web-responsive only, no real payment gateway.

---

## Authentication & Onboarding

### Table Stakes

These are non-negotiable. Users encountering a platform without these features interpret the absence as unsafe or unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Role-based registration (Client vs Editor) | Users must land in the right permission context from step one; role determines every subsequent screen | Low | FairCut has three roles: Client, Editor, Admin. Admin is seeded, not self-registered |
| Email + password authentication | Minimum viable identity; users will not attempt a platform without knowing who they are logging in as | Low | Standard credential flow; no OAuth required for v1 |
| Identity document upload for Editors (KTP) | Creative editors in Indonesia are asked to prove they are real people before being trusted with client money; absence of this signals the platform does not care about accountability | Medium | KTP upload + format validation (JPG/PDF, size cap). Status transitions to `Pending Verifikasi` |
| Admin-gated approval queue | Marketplace trust depends on a human review step for new supply-side actors; auto-approval would flood the directory with unverified accounts | Medium | Admin sees queue, approves or rejects with reason; editor notified on outcome |
| Profile status visibility | Editors and clients need to know where they stand at each step (Pending / Approved / Rejected) so they do not re-submit or abandon | Low | Status flag visible in editor dashboard |
| Password recovery flow | Users forget passwords; no recovery = permanent lockout = churn | Low | Email-based reset link; required for any web app |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Admin SLA reminder (5-business-day queue warning) | Indonesian freelancers already distrust platforms; a visible guarantee that their application will not rot in a queue is a trust signal competitors miss | Low | Dashboard badge / automated reminder to Admin when queue age exceeds 5 business days |
| Rejection with documented reason | Editors who are rejected without explanation leave and do not return; a reason lets them fix and reapply, growing supply | Low | Stored in notification log; surfaces in editor dashboard |
| Specialization tagging at registration | Clients filtering by type of editor (motion graphics, color grading, short-form) need supply to self-declare skills; platforms that require manual matching create friction | Low | Enum field selected at registration; drives directory filter |

### Anti-features (v1)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| OAuth / SSO (Google, Facebook login) | Adds third-party dependency, token management, and identity-reconciliation complexity; not required for a closed academic marketplace | Standard email + password only |
| Email OTP / two-factor authentication at login | Significant UX friction and SMS/email gateway cost; v1 trust is handled by KTP + Admin approval, not 2FA | Defer to post-launch; note it in PITFALLS as a future requirement |
| Onboarding wizard / multi-step tour | Interactive product tours require significant front-end state management and distract from core flows; non-technical users need simple flows, not guided tours | Write clear UI labels and placeholder text instead |
| LinkedIn portfolio import | Third-party API dependency; Indonesian creative editors largely do not use LinkedIn as their portfolio host | Accept a plain URL field for portfolio link |

---

## Project / Contract Management

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Editor directory with search/filter | Clients must be able to find an editor; without discovery the platform has no supply-demand connection | Medium | Filter by specialization and rating; browsable list with profile cards |
| Project brief submission by client | Clients need a structured channel to describe the work; freeform messaging is too unstructured for a contract-based platform | Low | Brief = project description + document link; creates a `Draft` project record |
| Digital contract auto-generation | Industry standard expectation: every hired engagement must have a written agreement. Absence = no legal reference point if conflict arises | Medium | System generates contract on escrow deposit; locks `max_revisions`, fee, and date |
| Locked revision quota on contract | The primary exploitation vector for creative editors is unlimited revision demands; a platform that does not lock this upfront is not solving the core problem | Medium | `max_revisions` set in contract; `revisions_taken` counter incremented on each approval; button disabled when exhausted |
| Project status visibility (both actors) | Clients and editors must know project state at a glance; ambiguity creates disputes | Low | Status state machine: Draft → In Progress → Revision → Completed / Disputed |
| Watermarked draft delivery | Editors who deliver clean final files before payment confirmation have no leverage; watermarking is the industry-standard protection for pre-payment previews | High | Server-side injection on upload; client can only download watermarked version while project is `In Progress` or `Revision` |
| Final file unlock on completion | Client must receive the clean deliverable when payment is confirmed; this is the value exchange that closes the contract | Low | Triggered atomically with escrow disbursement on `Konfirmasi Selesai` |
| One active contract per project (data constraint) | Multiple overlapping contracts on one project create irreconcilable payment and revision state; the constraint must be enforced at the data layer | Low | Unique constraint in the data model; not a UI feature |
| Audit log for all project state changes | Disputes on freelance platforms are won or lost based on timestamped evidence; a platform without this has no credibility with either party | Medium | Immutable append-only log; actor + timestamp + event type for every transition |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 7-day auto-approve with auto-payout | 72% of freelancers have been ghosted by clients; a platform that auto-releases payment after a defined silence window eliminates the most common editor income risk | Medium | Cron/scheduler checks draft upload timestamp; triggers approval and payout flow if client silent for 7 calendar days |
| Revision counter visible to both parties in real time | Both parties knowing exactly how many revisions remain prevents the "I didn't know I was out of revisions" conflict that leads to disputes | Low | Simple counter displayed on project detail view |
| Immutable audit log accessible to project actors | Showing editors their own transaction and event history builds trust; most platforms hide this or make it admin-only | Medium | Read-only audit trail view on project detail; actor can only see their own events |

### Anti-features (v1)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time chat / messaging between client and editor | Full chat requires websockets, message storage, read receipts, and moderation; the project brief + status updates cover necessary communication | The project brief submission and status comments are sufficient for v1 |
| Milestone-based partial payments | Milestone payments require multiple escrow tranches, separate disbursement triggers, and significantly more complex state management; FairCut's single-project model does not need this | One full upfront deposit per project; enforce atomically |
| File version history / diff viewer | Version control for creative deliverables (video, image) is a solved problem in dedicated tools (Frame.io, Google Drive); building it in FairCut is scope explosion | Provide a single "current draft" slot; previous drafts are not required by the data model |
| Client-editor negotiation on revision count | Allowing negotiation after contract generation reopens the very risk the platform is designed to close | `max_revisions` is locked at contract issuance; no post-issuance amendments in v1 |
| Third-party e-signature (PrivyID, Peruri) | Integration adds compliance overhead and external API dependency; explicitly out of academic scope | System-generated contract record serves as internal proof of agreement |
| AI matching / recommendation engine | Requires training data, ML pipeline, and ongoing model maintenance; zero value at a platform with fewer than 200 active projects | Manual browse + filter by specialization and rating |

---

## Payment & Escrow

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Full upfront escrow deposit by client | The entire value proposition of the platform rests on payment being secured before work begins; any model that allows post-delivery payment recreates the unpaid invoice problem | High | Client deposits 100% fee; status changes to `In Progress`; funds held in platform wallet |
| Atomic disbursement on completion | Partial transfers create irreconcilable wallet state; users expect the money to either move entirely or not at all | High | Single transaction: escrow → editor wallet (minus 10% commission); no intermediate state |
| Platform commission deducted automatically | Transparent commission deducted at disbursement is standard marketplace practice; surprises at payout erode trust | Low | 10% deducted from escrow on disbursement; displayed in contract and on project detail |
| Editor wallet balance visible | Editors must be able to see their accumulated earnings before requesting withdrawal | Low | Wallet balance on editor dashboard; updated after each disbursement |
| Withdrawal request with minimum balance gate | Prevents micro-transaction overhead and aligns with the Rp100,000 floor specified in the data model | Low | Button disabled + message shown if balance < Rp100,000; error message shows current balance |
| Withdrawal processing within 1×24 business hours | Freelancers who must wait days for their own money stop using the platform; a stated SLA is a trust signal | Low | Queue-based; Admin executes transfer; status visible to editor |
| Transaction history for editor | Editors must be able to reconcile income; a platform with no financial history is not a professional tool | Low | List of all disbursements and withdrawals with timestamps |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 48-hour boundary timer → Admin escalation on failed disbursement | System failures that silently trap editor money are the fastest way to destroy platform trust; an automatic escalation path with a hard SLA turns a failure into a managed process | Medium | Cron monitors disbursement queue; flags to Admin dashboard after 48h if unresolved |
| Commission displayed at contract issuance | Most platforms hide commission until payout; showing the net amount at contract generation prevents "where did my money go" disputes | Low | Contract document shows gross fee, 10% commission, and net editor payout |
| Automatic payout on 7-day client silence | See Project/Contract section; this is listed here because it is a payment trigger, not just a status change | Medium | Shares implementation with auto-approve; payment execution is the critical half |

### Anti-features (v1)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real payment gateway (Midtrans, Xendit) | Explicitly out of academic scope; adds compliance, sandbox/production environment management, and webhook complexity | Internal wallet simulation with all correct behavioral logic; swap gateway later |
| Cryptocurrency / digital wallet payments | No user research supports this need in the Indonesian creative editor market; adds regulatory complexity | IDR-denominated internal simulation only |
| Partial refunds / split disbursements | Partial financial operations require fractional state management and open dispute surface area | All-or-nothing disbursement; disputes handled by Admin who can override the payout |
| Client payment installments | Instalment logic requires tracking partial deposits, determining when work can begin, and handling incomplete payment sequences | Full upfront deposit only; no exceptions |
| Tax invoice generation (Faktur Pajak) | Indonesian tax compliance for digital services requires specific document formats and PKP registration; academic project cannot credibly implement this | Note as a post-launch requirement |
| Multi-currency support | No requirement; platform is IDR-only for the Indonesian market | Hard-code IDR; format all values with rupiah notation |

---

## Admin & Compliance

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Editor verification queue | Without admin approval, the platform cannot control who gets listed in the directory; this is the gating function for supply quality | Medium | List of pending registrations; approve / reject with reason |
| User suspension (remove from public directory) | Platforms that cannot remove bad actors are unsafe; suspension with directory removal is the minimum enforcement tool | Low | Flag on user record; suspended profiles invisible to browsing clients |
| Dispute opening and resolution | When escrow is involved, disputes must have a resolution path that does not require going outside the platform; Admin is the arbiter | Medium | Dispute record opened by either party; Admin views evidence and resolves; auto-escalate after 48h if unresolved |
| Manual disbursement execution (escalation fallback) | If automated payout fails and the boundary timer expires, Admin must be able to execute the transfer manually; otherwise the editor has no recourse | Medium | Admin action on flagged transaction; executes transfer and marks resolved |
| Immutable audit log (system-wide) | Every financial and status event must be recorded with actor, timestamp, and event type; this is the evidentiary basis for any dispute resolution | Medium | Append-only; no UPDATE or DELETE on audit records; admin can read all entries |
| HTTPS / TLS enforcement | Users will not submit ID documents or financial data over an unencrypted connection; absence is a hard trust failure | Low | Infrastructure-level requirement; enforced at server config, not application code |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 5-business-day queue SLA reminder to Admin | Editors waiting for verification longer than a week will assume the platform is dead; an automated prompt to Admin ensures the queue does not stagnate | Low | Dashboard badge or email alert when oldest pending registration exceeds 5 business days |
| Auto-escalation of unresolved disputes at 48h | Disputes left open corrode platform trust; a hard timer that escalates to Admin ensures no dispute can be silently ignored | Medium | Cron or scheduled check; flags any open dispute older than 48h to Admin action queue |
| Dispute audit trail (both parties can see the log for their project) | Transparency in dispute handling reduces the feeling that Admin decisions are arbitrary | Low | Read-only view of project's audit events accessible to involved actors |

### Anti-features (v1)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Analytics / reporting dashboard (revenue, cohorts, funnel) | Business intelligence requires aggregation pipelines, chart libraries, and meaningful data volume; none exists at launch | Defer; Admin sees raw queue counts and transaction lists only |
| Automated fraud detection / ML risk scoring | Requires training data and model infrastructure; the Indonesian creative editor market is small enough that Admin manual review is sufficient | Admin review of KTP and portfolio link is the fraud check |
| Role permission editor (Admin can configure roles) | Role structure is fixed (Client / Editor / Admin); a UI for changing permissions is a meta-feature with no v1 use case | Hard-code role-to-permission mapping |
| Multi-admin / Admin sub-roles | Academic platform has one Admin actor; sub-roles (Super Admin, Finance Admin) add identity management complexity | Single Admin role; all Admin users share full permissions |
| GDPR / data export tooling | Platform is Indonesia-based; PDPA (UU PDP) compliance is the relevant framework but implementing export tooling is post-launch work | Document data fields and retention policy; do not build export UI in v1 |

---

## User Profile & Portfolio

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Public editor profile visible in directory | Clients cannot select an editor they cannot see; the public profile is the supply-side product page | Low | Shows: name, specialization, portfolio link, rating, completion rate |
| Star rating visible on profile | Rating is the primary quality signal on any marketplace; its absence forces clients to evaluate with no information | Low | Auto-updated from completed project data; displayed as aggregate score |
| Completion rate visible on profile | Completion rate tells clients whether the editor finishes what they start; it is the reliability signal that pairs with rating | Low | Auto-calculated: completed projects / total projects accepted |
| Portfolio link (external URL) | Creative editors' work lives on YouTube, Vimeo, Behance, or personal sites; a link field is the minimum credible portfolio surface | Low | Plain URL field; opens in new tab; validated as a URL format |
| KPI auto-update on project completion | Profiles that require manual updates go stale immediately; auto-update on status transition is the only credible approach | Low | Triggered by project status → Completed transition; no manual editor action required |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| KPI visible to clients on profile before hire | Clients on Indonesian platforms typically have no objective basis for choosing an editor; showing rating + completion rate creates a merit-based selection signal that reduces exploitation of editors (less-rated editors get spammed with revision demands; high-rated editors get better clients) | Low | Data already computed; surface on profile card in directory |
| Specialization filter in directory | Indonesian creative market has distinct sub-specializations (color grading, motion graphics, short-form reels, long-form documentary); a filter that matches the real taxonomy of the market is more useful than a generic tag system | Low | Enum-driven; matches fields collected at registration |
| Project history count on profile | "Has completed X projects on FairCut" is a trust signal specific to the platform; it signals the editor is not new to this specific workflow | Low | Derived from completed project count; display on profile |

### Anti-features (v1)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Client-written text reviews | Text reviews require moderation, spam prevention, fake review detection, and a reporting mechanism; the rating number is sufficient for v1 | Auto-computed numeric rating only; defer text reviews |
| Portfolio file hosting (upload images/videos to platform) | Media hosting requires CDN, storage cost, and file size limits; for a 7.5-week academic project this is pure infrastructure overhead | External portfolio URL only |
| Badge / certification system | Badges require defining criteria, awarding logic, and display hierarchy; adds no value when the user base is < 200 projects | Rating + completion rate are sufficient trust signals |
| Follow / favorite editor | Social graph features require feed infrastructure; no v1 use case justifies it | Clients browse the directory; no persistent preference state needed |
| Editor availability calendar | Calendar synchronization (block dates, working hours) requires scheduling logic and is irrelevant at academic scale | Editors accept or decline briefs; no availability pre-declaration needed |

---

## Feature Dependencies

```
Editor Registration → Admin Approval → Public Profile visible in Directory
  ↓
Client submits Brief → Project created (Draft)
  ↓
Client deposits Escrow → Contract auto-generated → Project status: In Progress
  ↓
Editor uploads Draft → Watermark injected → Client downloads watermarked preview
  ↓
Client requests Revision (if revisions_taken < max_revisions)
  OR
Client clicks Konfirmasi Selesai
  OR
7-day silence → Auto-approve trigger
  ↓
Atomic Disbursement: escrow → editor wallet (minus 10%)
  + Final file unlocked for clean download
  ↓
Rating + completion_rate auto-updated on editor profile
  ↓
Editor requests Withdrawal (if balance ≥ Rp100,000)
  ↓
Admin executes withdrawal within 1×24 business hours
```

**Critical path note:** The entire platform value chain collapses if the escrow deposit step fails or is skippable. The data model must enforce that `In Progress` status is unreachable without a confirmed deposit record. Everything downstream depends on this gate.

---

## MVP Recommendation

### Must be in v1 (table stakes with no viable workaround)

1. Role-based registration with KTP upload (Editor) and Admin approval queue
2. Editor directory with specialization + rating filter
3. Project brief submission → Draft project record
4. Escrow deposit → Contract auto-generation with locked `max_revisions`
5. Server-side watermark injection on draft upload
6. Revision quota enforcement (counter + disabled button when exhausted)
7. `Konfirmasi Selesai` → atomic disbursement + file unlock
8. 7-day auto-approve → automatic payout
9. Editor wallet with Rp100,000 withdrawal gate
10. Immutable audit log for all project and financial events
11. Admin dispute resolution with 48h auto-escalation
12. 48h boundary timer for failed disbursements → Admin escalation
13. Public editor profile with auto-updated rating and completion rate

### Can be deferred (differentiators that add polish but do not unblock core flow)

- Admin 5-business-day queue SLA reminder (valuable but manually checkable)
- Commission displayed at contract issuance vs at payout (trust signal; implement at the same time as contract display, low effort)
- Project history count on editor profile (derived data; add when time allows)

### Explicitly not in v1

Everything in the Anti-features sections above. The primary scope traps for this project are: real payment gateway integration, chat/messaging between parties, file version history, text reviews, and portfolio media hosting. These are the features most likely to be requested late in the project and must be held firmly out of scope.
