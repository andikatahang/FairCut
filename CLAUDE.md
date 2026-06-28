# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Manava** is an Enterprise Resource Planning (ERP) platform for professional visual services companies (photo retouching studios, video editing houses, color grading labs). It unifies Human Resource Management (HRM) and Sales of Services (SoS) operations to provide:

- **Fair revision limits** with objective scope definition and revision classification
- **Transparent compensation** tied to performance metrics
- **Secure payment collection** via dual-phase escrow
- **Integrated capacity planning** between HR operations and project scheduling
- **IFRS 15 compliant** revenue recognition

### Current Status

This is a **planning/design phase** project. All architectural and business logic design is documented in `prd.md`. Reference UI designs are in `referensi-tampilan/` directory. **Do not use** AI slop or basic AI design. 

**No production code yet.** When implementation begins:
1. Technology stack will be determined (likely web-based, full-stack)
2. Development setup instructions will be added to this file
3. Database schema and API contracts will be documented

---

## Domain Model & Core Concepts

### Key Entities

| Entity | Purpose | Key Relationships |
|--------|---------|-------------------|
| **Editor (HR)** | Visual services professional | Availability, projects, compensation, performance metrics |
| **Client (Sales)** | Company or individual hiring services | Projects, briefs, payments, disputes |
| **Project** | Single service delivery engagement | Brief, revisions, scope, timeline, payment |
| **Revision Envelope** | Scope boundary definition | INCLUDED, EXCLUDED, ALLOWANCE revision rules |
| **Brief** | Service request details | Scope confirmation, revision costs, acceptance criteria |
| **Revision** | Work iteration requested by client | Classification (minor/major), cost impact, approval workflow |
| **Escrow (Finance)** | Dual-phase payment holding | DP 50% (initial), Final 50% (post-delivery) |
| **Editor KPI** | Performance measurement | Client rating, completion rate, manager rating |

### Workflows & Integrations

#### Service Delivery Lifecycle
1. **Booking** → Client requests service, Editor availability checked, Scope locked via Revision Envelope
2. **Payment Security** → 50% DP (down payment) held in escrow, Brief signed digitally
3. **Delivery** → Editor works within INCLUDED scope + ALLOWANCE revision budget
4. **Revision Classification** → AI + manual review classifies revisions as minor (free) or major (paid)
5. **Completion & Payment Release** → Final 50% released from escrow to company (automated, < 1hr SLA)

#### HR-Sales Integration
- Editor **availability** affects project capacity planning
- Editor **leave/absence** impacts active projects (cross-module coordination)
- Editor **performance metrics** influence project assignment and future capacity
- Editor **compensation** includes project bonuses tied to revision management and client ratings

#### Finance Integration
- Escrow account holds all client payments in two tranches
- Revenue recognition follows IFRS 15 (recognized when control of deliverable transfers)
- Payroll links to project bonuses (editor compensation tied to performance)
- Monthly P&L reconciliation: payroll costs + escrow inflow/outflow = profitability

### Revision Envelope Framework

The **Revision Envelope** defines revision boundaries:
- **INCLUDED**: Revisions covered in base project cost (e.g., "up to 3 rounds")
- **EXCLUDED**: Revisions not covered (e.g., "significant scope change")
- **ALLOWANCE**: Budget allocated for minor revisions (e.g., "3 free rounds, then €25/round")

This framework:
- Protects editors from unlimited unpaid work
- Makes revision costs transparent to clients upfront
- Enables objective classification for dispute resolution

### AI Change Detection

AI classification engine determines if a revision is "minor" (within ALLOWANCE, free) or "major" (requires additional payment):
- **Target accuracy:** ≥ 85%
- **Falls back to:** Manual review by mediator if AI confidence is low
- **Evidence:** Objective metrics (pixel differences, scope variance) replace subjective judgment

---

## Architecture Principles

When implementation begins, follow these architectural patterns:

### Module Organization

Organize by **business domain**, not by technical layer:

```
src/
├── auth/                 # Authentication & authorization
├── editor/              # Editor HR management
│   ├── models/
│   ├── services/
│   ├── routes/
│   └── tests/
├── project/             # Project & scope management
│   ├── models/
│   ├── services/
│   ├── routes/
│   └── tests/
├── revision/            # Revision tracking & classification
│   ├── ai-classifier/   # Change detection & ML integration
│   ├── models/
│   ├── services/
│   └── tests/
├── payment/             # Escrow & payment processing
│   ├── models/
│   ├── services/
│   └── tests/
├── kpi/                 # Performance & KPI management
├── finance/             # Revenue recognition & reporting
└── shared/              # Cross-domain utilities
    ├── audit-trail/
    ├── notifications/
    └── dispute-resolution/
```

### Data Consistency & Workflows

- **Transactional integrity**: Revisions + escrow releases must be atomic (no partial updates)
- **Audit trail**: All scope changes, revision classifications, payment movements are immutable and logged
- **State machines**: Projects, revisions, and disputes follow explicit state transitions
- **Idempotency**: Payment release operations must be safely retryable

### API Design

- All endpoints return consistent envelope: `{ success, data, error, metadata }`
- Metadata includes pagination for list endpoints, change audit info for mutations
- Version API v1 at `/api/v1/`
- Scope all resources by domain: `/api/v1/editor/:id`, `/api/v1/project/:id/revision`

### Authentication & Authorization

- Implement **role-based access control** (RBAC):
  - `admin` - Full platform access
  - `editor` - Self-service HR, project delivery, KPI visibility
  - `client` - Project booking, brief confirmation, payment status
  - `mediator` - Dispute resolution, revision classification review
  - `finance` - Escrow reconciliation, revenue reporting
- Session-based for web clients; JWT for third-party integrations
- All state-changing operations require authentication + role verification

---

## Development Conventions

### Code Quality Standards

Follow the user's global coding style rules (in `~/.claude/rules/ecc/`):

- **80% test coverage minimum** across unit, integration, and E2E tests
- **Immutability first**: Prefer creating new objects over mutations
- **Small focused files**: Max 800 lines; target 200-400 lines per file
- **Semantic naming**: Variables and functions clearly express intent
- **No hardcoded secrets**: Use environment variables or secret managers

### Testing Strategy

1. **Unit Tests**: Test domain logic (revision classification, KPI calculations, escrow calculations)
2. **Integration Tests**: Test workflow boundaries (project creation → scope lock, revision → classification → payment)
3. **E2E Tests**: Test critical paths (client booking, editor delivery, mediator dispute resolution)

Use **TDD approach**: Write tests first, implement to pass.

### Frontend Design Direction

The project uses **frontend-design plugin** (enabled in `.claude/settings.json`). When building UI:

- **Reference designs** are in `referensi-tampilan/` (landing page, auth page, dashboard)
- **Design quality standard**: Avoid template defaults; UI should reflect the product's intentionality
- **Semantic HTML first**: Use proper landmark elements (`<header>`, `<nav>`, `<main>`, `<footer>`)
- **Animation**: Motion should clarify flow, not distract; animate only compositor-friendly properties (transform, opacity)
- **Responsive design**: Test at 320, 768, 1024, 1440, 1920 breakpoints
- **Accessibility**: WCAG 2.2 AA minimum; test keyboard navigation and reduced-motion preferences

### Git & Commits

- Follow **conventional commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- Write detailed commit messages; reference the PRD section if architectural decision
- Create **atomic commits**: Each commit should be a logically complete change
- **No force pushes** to shared branches (main, develop)

---

## Development Setup (To Be Added)

Once technology stack is chosen, document:
- Node version, package manager (npm/yarn/pnpm)
- Database setup (PostgreSQL, MongoDB, etc.)
- Environment variables required
- Build commands (`build`, `dev`, `lint`, `test`)
- Database migration strategy

---

## Deployment & DevOps (To Be Added)

Once deployment strategy is finalized, document:
- Hosting platform (AWS, Vercel, self-hosted)
- CI/CD pipeline
- Environment promotion strategy (dev → staging → production)
- Database backup & recovery procedures
- Monitoring & observability setup

---

## Important Files & References

- **`prd.md`** — Complete Product Requirements Document; describes all workflows, KPIs, and success metrics
- **`referensi-tampilan/`** — UI design references for landing page, authentication, dashboard, and mobile layouts
- **`.claude/settings.json`** — Claude-specific plugin configuration (frontend-design enabled)

---

## Common Development Patterns

### Revision Classification Logic

The core AI engine classifies revisions as minor or major:

```
Pseudocode:
function classifyRevision(originalBrief, currentDeliverable, requestedRevision):
  1. Extract scope delta using change detection algorithm
  2. Run ML model on scope delta
  3. If confidence >= 85%:
       return AI classification (minor/major)
  4. Else:
       flag for mediator review, return PENDING
  5. Log classification with evidence (pixel delta, scope variance, confidence)
```

When implementing, ensure:
- Change detection algorithm is deterministic & testable
- Confidence scores are logged for audit trail
- Manual override by mediator is tracked
- Classification is immutable (audit trail preserved)

### Escrow State Transitions

```
Payment States:
INITIAL → DP_RECEIVED → AWAITING_COMPLETION → FINAL_RECEIVED → RELEASED_TO_COMPANY
                                              ↓
                                      REFUND_INITIATED (if disputed/cancelled)
```

Ensure:
- State transitions are validated (no skipping states)
- Timestamp of each transition is logged
- SLA for RELEASED (< 1 hour from FINAL_RECEIVED) is monitored
- Audit trail captures who triggered each transition

### Editor KPI Calculation

```
Editor KPI = (Client Rating Score + Completion Rate + Manager Rating) / 3

Where:
- Client Rating Score: Average star rating from all projects (1-5 scale)
- Completion Rate: (Projects Completed On Time) / (Total Projects Assigned)
- Manager Rating: Subjective quarterly assessment by HR manager
```

When implementing:
- KPI calculated daily, not real-time
- Historical KPI snapshots kept for trend analysis
- KPI feeds into future project assignment algorithm
- Performance reports visible to editor via ESS (Employee Self-Service)

---

## Escalation & Support

- **Questions about product/business logic**: Refer to `prd.md` (sections 1-4 cover objectives, workflows, KPIs)
- **Questions about UI/design intent**: Review reference designs in `referensi-tampilan/`
- **Team coordination**: Daily standups should sync cross-module integration points (HR + Sales + Finance)
- **Architectural decisions**: Document in commit message & PRD amendments as needed

---

## Notes for Future Implementers

This is a **complex, integrated domain**. Key risks to watch:

1. **HR-Sales Integration**: Leave approval affecting active projects requires careful state management and notifications
2. **Financial Accuracy**: Escrow + payroll reconciliation must be exact; automated tests critical
3. **Dispute Resolution**: AI classification failures require rapid mediator intervention; SLA monitoring essential
4. **IFRS 15 Compliance**: Revenue recognition timing must align with deliverable acceptance; audit trail non-negotiable
5. **Data Integrity**: All scope changes, revisions, and payment movements must be immutable (use event sourcing pattern if needed)

Start with **core entities** (Editor, Project, Brief, Revision) and **happy path workflows** (book → lock scope → deliver → release payment). Build dispute/exception flows after core happy path is solid.
