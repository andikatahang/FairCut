# FairCut

## What This Is

FairCut is a responsive web-based HRIS platform that protects Indonesian freelance creative editors from unpaid work and unlimited revision exploitation. It enforces digital contracts with locked revision quotas, holds client funds in escrow before work begins, and releases payment only when the client confirms completion — with automatic fallbacks when clients go silent.

## Core Value

An editor who completes their work gets paid — always, on time, with zero opportunity for the client to demand unlimited revisions or disappear without releasing funds.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Registration & Onboarding**
- [ ] Editor can register with full name, email, specialization, KTP upload, and portfolio link
- [ ] System validates upload format and stores record with status `Pending Verifikasi`
- [ ] Admin can view pending verification queue and approve or reject with reason
- [ ] Approved editor profile becomes visible in public directory; rejected editor receives notification log
- [ ] Admin receives automated dashboard reminder if verification queue is unattended > 5 business days

**Editor Directory & Brief Submission**
- [ ] Client can browse editor directory filtered by specialization and rating
- [ ] Client can send project brief (description + document link) to a specific editor profile
- [ ] System generates a project record in `Draft` status upon brief submission

**Contract & Escrow**
- [ ] Client deposits 100% project fee upfront into simulated escrow; status changes to `In Progress`
- [ ] System auto-generates a digital contract locking `max_revisions`, compensation value, and issue date
- [ ] One active contract per project enforced at the data layer

**Project Execution & Revision Quota**
- [ ] Editor uploads draft work; system automatically injects watermark on visual files
- [ ] Client can only download watermarked draft while project is `In Progress` or `Revision`
- [ ] Client can request revision only if `revisions_taken < max_revisions`; "Request Revision" button is disabled when quota is exhausted
- [ ] Each accepted revision request increments `revisions_taken` by 1 and logs to Audit Log

**Completion & Parallel Payout**
- [ ] Client pressing "Konfirmasi Selesai" triggers parallel execution: unlock original file for client download + transfer escrow funds to editor wallet (minus 10% platform commission)
- [ ] If client is silent for 7 calendar days after watermarked draft upload, system auto-approves project and executes payout
- [ ] All escrow operations (deposit, hold, disbursement) are atomic — no partial transfers recorded

**KPI & Performance Tracking**
- [ ] Editor's `rating` and `completion_rate` auto-update when project status transitions to `Completed`
- [ ] KPI data visible on public editor profile

**Wallet & Withdrawal**
- [ ] Editor can request withdrawal only if wallet balance ≥ Rp100,000
- [ ] System validates balance before queuing transfer; displays insufficient-balance message with current amount
- [ ] Withdrawal processed within 1×24 business hours

**Admin Controls**
- [ ] If auto-disbursement fails, system triggers 48-hour Boundary Timer; unresolved transfers escalate to Admin dashboard for manual execution
- [ ] Admin can suspend a user account, removing their profile from public directory
- [ ] Admin can open and resolve disputes; disputes auto-escalate to Admin if unresolved within 48 hours

**Audit & Compliance**
- [ ] Every project status change and financial transaction recorded in Audit Log with timestamp and actor
- [ ] Audit Log entries are immutable (no UPDATE or DELETE allowed)
- [ ] System enforces HTTPS/TLS for all data in transit

### Out of Scope

- Mobile app (Android/iOS) — web-responsive only per project constraint
- Third-party e-signature integration (PrivyID, Peruri) — out of academic scope
- Real payment gateway (Midtrans, Xendit) — all transactions are simulated internally
- AI/ML recommendation or search algorithms — deferred; scope cut to meet academic timeline

## Context

- **Domain**: Indonesian freelance creative editor market, structurally underprotected due to informal work arrangements
- **Academic project**: Built by Group 5, Informatics students, Universitas Islam Indonesia — 7.5-week delivery timeline
- **Simulated finance**: All escrow, disbursement, and withdrawal logic uses internal wallet simulation — no real money moves
- **Minimum withdrawal discrepancy**: CONTEXT.md Section 6 shows Rp10,000 in an error message example; Section 8 sets the constraint at Rp100,000. **Resolved: Rp100,000 is authoritative** (aligns with the data constraint table)
- **Target users**: Non-technical freelancers — all primary flows must be completable without a technical manual
- **Responsive baseline**: All primary flows must work at 360px viewport with no horizontal scroll
- **Accessibility**: Project status text must meet WCAG 2.1 Level AA (4.5:1 contrast ratio)

## Constraints

- **Timeline**: 7.5 academic weeks — scope is fixed; no new modules after roadmap is set
- **Finance**: Simulated only — no real payment gateway integration
- **Authentication**: Role-based (Client / Editor / Admin) — role determines all module access rights
- **Data integrity**: Project status transitions are one-way and irreversible; wallet balance cannot go negative
- **Transactions**: Must be atomic — no partial disbursement records in the Transactions table
- **Audit log**: Immutable — append-only, no updates or deletes
- **Scalability target**: Handle 200 concurrent active projects without performance degradation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Simulated escrow (internal wallet) instead of real payment gateway | Academic scope + timeline constraint; integrating Midtrans/Xendit would add compliance and testing overhead beyond semester window | — Pending |
| Web-responsive only, no mobile app | Reduces scope to core HRIS functionality within 7.5-week timeline | — Pending |
| Watermark injected server-side on upload | Prevents client from bypassing protection by downloading before confirmation | — Pending |
| 10% platform commission deducted automatically on disbursement | Business model + transparency; baked into contract at issuance | — Pending |
| 48h Boundary Timer → Admin escalation for failed disbursements | Protects editors from system failures causing payment delays without requiring manual monitoring by default | — Pending |
| 7-day Auto-Approve if client is silent after final draft upload | Protects editors from clients ghosting after work is delivered | — Pending |
| Rp100,000 minimum withdrawal (authoritative, overrides Section 6 example) | Aligns with data constraint table in Section 8; prevents micro-transaction overhead | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-15 after initialization*
