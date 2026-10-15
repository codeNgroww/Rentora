# RENTAL PROPERTY MANAGEMENT SAAS
## Storyboard & Implementation Task Backlog
### UAE-focused platform | Next.js + NestJS + Supabase

**Version:** 1.0 • 14 October 2026  

---

## 1. Product Direction

Build a multi-tenant SaaS platform for property owners and property management businesses in the UAE. MVP scope includes workspace access, portfolio dashboard, properties and units, tenants and leases, expenses, rent charges and payments, reports, notifications, audit history, and production readiness.

> [!NOTE]
> This is a proposed implementation backlog, not a verified inventory of features in the reference app.

---

## 2. Storyboard / Primary User Journey

1. **01. Access:** Register or sign in → create workspace → invite team members.
2. **02. Overview:** See property count, occupancy, rent due/collected, expenses, arrears, and net cash flow.
3. **03. Portfolio:** Create a property → add units → inspect unit availability and property details.
4. **04. Tenancy:** Create tenant → assign tenant to a unit → create lease → upload contract → track renewal.
5. **05. Expenses:** Add expense → assign category/property/vendor → attach receipt → optionally submit for approval.
6. **06. Rent:** Generate charges from lease → record payment → allocate full/partial amount → track arrears.
7. **07. Reporting:** Filter income/expenses → review arrears → export CSV or property statement.
8. **08. Operations:** Receive reminders → inspect audit history → complete UAT and release.

---

## 3. Agent Roles and Working Rules

- **Agent A — Platform / DevOps:** Repository, environment configuration, CI, deployment skeleton, shared conventions.
- **Agent B — Backend / Data:** NestJS modules, Supabase/Postgres schema, migrations, financial calculations, RLS coordination.
- **Agent C — Frontend shell / portfolio:** App layout, navigation, dashboard, property and unit screens.
- **Agent D — Expenses:** Expense CRUD, categories/vendors, attachments, recurring expenses, and approval workflow.
- **Agent E — Rent / reporting:** Lease charge generation, payment allocation, arrears, reports, and exports.
- **QA Agent:** Test plans, test fixtures, RLS isolation, financial edge cases, end-to-end acceptance.

> [!IMPORTANT]
> **Parallel-Work Rule:** Agree on schema, DTOs, API routes, error format, and permissions before agents implement overlapping features. One agent owns each shared migration area.

---

## 4. Priority Definitions

- **P0:** Required for first usable MVP.
- **P1:** Important after core flows are stable.
- **P2:** Later enhancement.

---

## 5. Epics and Implementation Tasks

### EPIC 0 — Project Foundation

| ID / Story | Owner | Priority | Task | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **FOUND-01**<br/>Initialize repository and environments | Tech Lead / Agent A | **P0** | Create monorepo or coordinated apps for Next.js frontend and NestJS API; add linting, formatting, env templates, README, and local run commands. | Both apps start locally; secrets are excluded from Git; setup instructions work on a clean machine. |
| **FOUND-02**<br/>Configure Supabase project | Backend / Agent B | **P0** | Configure Postgres, Auth, Storage buckets, local/dev/staging environment variables, and migration workflow. | App connects to the intended environment; migrations are reproducible; no service-role key reaches the browser. |
| **FOUND-03**<br/>Define shared contracts and conventions | Tech Lead + Backend | **P0** | Agree naming, API envelope, error format, pagination, validation, date/time handling, currency representation, and module boundaries. | OpenAPI/API conventions are documented and accepted before feature agents implement endpoints. |
| **FOUND-04**<br/>CI checks and deployment skeleton | DevOps / Agent A | **P1** | Add lint, type-check, tests, build checks, and staging deployment pipeline. | Pull requests run required checks and staging deploy can be repeated. |

---

### EPIC 1 — Authentication and Workspace

| ID / Story | Owner | Priority | Task | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **AUTH-01**<br/>Register and sign in | Frontend + Backend | **P0** | Build sign-up, sign-in, sign-out, password reset, session restoration, and protected routes using Supabase Auth. | Valid users can authenticate; invalid sessions are redirected; errors are understandable. |
| **AUTH-02**<br/>Create workspace / organization | Frontend + Backend | **P0** | On first login, create a workspace and associate the creator as Owner. | Workspace creation is atomic and duplicate workspaces are not created accidentally. |
| **AUTH-03**<br/>Invite team members | Frontend + Backend | **P1** | Owner can invite members by email and assign Manager or Accountant roles. | Invited user can accept invitation; role is persisted and enforced by API and database. |
| **AUTH-04**<br/>Enforce tenant isolation and RBAC | Backend + QA | **P0** | Add workspace-scoped access checks and Supabase RLS policies for every tenant-owned table. | A user in Workspace A cannot read or mutate Workspace B data, including via direct API calls. |

---

### EPIC 2 — Portfolio Dashboard

| ID / Story | Owner | Priority | Task | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **DASH-01**<br/>Create dashboard layout | Frontend / Agent C | **P0** | Build responsive navigation, workspace selector, page header, date filters, and KPI card layout. | Desktop and mobile layouts work; loading, empty, and error states exist. |
| **DASH-02**<br/>Calculate portfolio KPIs | Backend / Agent B | **P0** | Provide property count, occupied/vacant units, rent due, rent collected, expenses, and net cash flow for a selected period. | Totals match underlying records and use documented definitions; timezone is Asia/Dubai for display. |
| **DASH-03**<br/>Show recent activity and alerts | Full-stack | **P1** | Display recent rent payments, new expenses, upcoming lease expiries, and overdue rent. | Items link to the relevant record and respect workspace permissions. |

---

### EPIC 3 — Properties and Units

| ID / Story | Owner | Priority | Task | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **PROP-01**<br/>Create and edit property | Full-stack / Agent C | **P0** | Capture name, property type, address, emirate, optional building/community, notes, and status. | Valid property can be created, edited, archived, and searched. |
| **PROP-02**<br/>Manage units | Full-stack | **P0** | Add units under a property with unit number, bedrooms, bathrooms, rent reference, and occupancy status. | Unit numbers are unique within a property; occupancy status cannot contradict active lease data. |
| **PROP-03**<br/>Property and unit details | Frontend + Backend | **P1** | Create list/detail pages with filters, unit table, tenant/lease summary, and property-level financial summary. | Users can navigate from portfolio to property to unit and back. |
| **PROP-04**<br/>Property documents and images | Full-stack | **P2** | Upload property photos and relevant documents to private Supabase Storage. | Only authorized workspace members can access files; upload size/type rules are enforced. |

---

### EPIC 4 — Tenants and Leases

| ID / Story | Owner | Priority | Task | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **TEN-01**<br/>Create tenant profile | Full-stack | **P0** | Store tenant name, contact details, preferred contact method, and optional internal notes. | Required fields validate; sensitive identifiers are not collected unless product/legal requirements justify them. |
| **LEASE-01**<br/>Create lease and assign unit | Full-stack | **P0** | Link tenant(s) to a unit; record start/end dates, rent amount, payment frequency, deposit amount, and status. | A unit cannot have overlapping active leases unless explicitly supported; dates and amounts validate. |
| **LEASE-02**<br/>Upload lease contract | Full-stack | **P1** | Attach signed contract or supporting documents to the lease record. | File access is workspace-scoped and actions are audited. |
| **LEASE-03**<br/>Renewal and expiry tracking | Backend + Frontend | **P1** | Show leases expiring within configurable windows and allow recording renewal or end-of-lease. | Dashboard alert reflects lease dates and avoids duplicate alerts. |
| **LEASE-04**<br/>Lease lifecycle | Full-stack + QA | **P1** | Support draft, active, expiring, ended, and terminated states with allowed transitions. | Illegal transitions are rejected; ending a lease updates occupancy correctly. |

---

### EPIC 5 — Expense Management

| ID / Story | Owner | Priority | Task | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **EXP-01**<br/>Expense list, filters, and search | Frontend + Backend / Agent D | **P0** | Create expense table with date, property/unit, category, vendor, amount, status, and search/filter controls. | Pagination, sorting, filters, empty state, and mobile fallback work. |
| **EXP-02**<br/>Create and edit expense | Full-stack / Agent D | **P0** | Capture title, amount, date, category, property, optional unit/vendor, payment method, reference, notes, and tax fields if approved. | Server validates amount and associations; records are workspace-scoped. |
| **EXP-03**<br/>Receipt and invoice attachments | Full-stack | **P1** | Upload receipt/invoice files to private storage and preview/download for authorized users. | Unsupported types and oversized files are rejected; signed access is time-limited where appropriate. |
| **EXP-04**<br/>Expense approval workflow | Full-stack | **P2** | Optional draft, submitted, approved, rejected, and voided states with approver and reason. | Only permitted roles can approve; status history is retained. |
| **EXP-05**<br/>Recurring expenses | Backend + Frontend | **P1** | Configure recurrence cadence, next run, end date, and target property/category; create expenses idempotently. | Retries do not create duplicates; generated expenses are traceable to the rule. |
| **EXP-06**<br/>Expense audit history | Backend | **P1** | Record creator, editor, timestamps, changes, and void reason. | Audit entries cannot be silently edited by ordinary users. |

---

### EPIC 6 — Rent Charges and Payments

| ID / Story | Owner | Priority | Task | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **RENT-01**<br/>Generate rent schedule | Backend / Agent B | **P0** | Create rent charges from an active lease payment frequency and due-date rule. | Charges are unique per lease and period; generation can be safely retried. |
| **RENT-02**<br/>Record payment | Full-stack | **P0** | Record date, amount, method, reference, payer, and notes; support manual/offline payments. | Payment is stored once; amount must be positive and belongs to the correct workspace. |
| **RENT-03**<br/>Allocate payment to rent charges | Backend + QA | **P0** | Support full and partial allocations and compute outstanding balances. | Allocated total cannot exceed payment amount or charge balance without explicit credit handling. |
| **RENT-04**<br/>Overdue rent and arrears | Backend + Frontend | **P0** | Calculate due, overdue, partially paid, and paid charges based on due dates and allocations. | Statuses are derived consistently and shown with clear as-of date. |
| **RENT-05**<br/>Security deposit tracking | Full-stack | **P1** | Track deposits separately from rental income and operating cash flow; record refund/deduction events. | Deposit balances never inflate rent income or net operating cash flow. |
| **RENT-06**<br/>Payment history and receipts | Frontend + Backend | **P1** | Show tenant/lease payment history and generate printable payment receipt. | Receipt includes reference, amount, date, property/unit, and workspace branding where configured. |

---

### EPIC 7 — Reports and Exports

| ID / Story | Owner | Priority | Task | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **REPORT-01**<br/>Income and expense report | Backend + Frontend | **P0** | Filter by date range, property, unit, category, and status; summarize income, expenses, and net cash flow. | Report totals reconcile with source records and document included statuses. |
| **REPORT-02**<br/>Rent arrears report | Backend + Frontend | **P1** | List overdue charges, tenant, unit, due date, amount due, and days overdue. | Filters work and report excludes voided charges. |
| **REPORT-03**<br/>Export CSV | Backend + Frontend | **P1** | Export currently filtered report data to CSV with safe escaping and stable column names. | Export matches visible filter criteria and prevents formula injection. |
| **REPORT-04**<br/>Owner/property statement | Full-stack | **P2** | Generate a period statement per property with rent, expenses, deposits, and closing balance where supported. | Statement reconciles with ledger and clearly states its accounting basis. |

---

### EPIC 8 — Notifications and Operational Quality

| ID / Story | Owner | Priority | Task | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **NOTIF-01**<br/>In-app notifications | Full-stack | **P1** | Create notifications for lease expiry, overdue rent, expense approval, and recurring expense generation. | Users see only authorized workspace notifications and can mark them read. |
| **NOTIF-02**<br/>Email notification adapter | Backend | **P2** | Create provider-agnostic email service with templates and retry handling. | Email delivery failures are logged safely; core transactions do not fail because an email provider is down. |
| **AUDIT-01**<br/>Audit critical actions | Backend | **P1** | Audit workspace invitations, lease changes, expense approvals/voids, payment changes, and exports. | Audit log includes actor, action, entity, timestamp, and safe before/after details. |
| **QA-01**<br/>Automated test coverage | QA + all agents | **P0** | Unit, API integration, RLS isolation, and end-to-end tests for core flows. | Critical user journeys pass in CI; authorization and financial calculation tests are mandatory. |
| **SEC-01**<br/>Security and privacy review | Tech Lead + QA | **P0** | Review secrets, RLS, API guards, file access, validation, rate limiting, logs, and backup/restore approach. | No cross-workspace access; no secrets in client bundle; critical findings resolved before release. |
| **REL-01**<br/>Staging UAT and release checklist | Product + QA + DevOps | **P0** | Run test scenarios, seed demo data, verify migrations, backups, monitoring, and rollback plan. | Product owner signs off on acceptance criteria before production release. |

---

## 6. Suggested Sprint Sequence

- **Sprint 0 — Architecture and setup (3–5 days):** `FOUND-01` to `FOUND-04`; agree schema, contracts, environments, coding conventions, and CI.
- **Sprint 1 — Secure app foundation (1 week):** `AUTH-01` to `AUTH-04`; shared layout; RLS and workspace isolation tests.
- **Sprint 2 — Portfolio data (1 week):** `PROP-01` to `PROP-03`; `DASH-01` and first version of `DASH-02`.
- **Sprint 3 — Tenants and leases (1 week):** `TEN-01`; `LEASE-01` to `LEASE-04`; lease document access.
- **Sprint 4 — Expenses (1 week):** `EXP-01` to `EXP-03`; categories, vendors, audit fields; `EXP-05` if time permits.
- **Sprint 5 — Rent and payments (1–2 weeks):** `RENT-01` to `RENT-06`; validate allocation logic and dashboard reconciliation.
- **Sprint 6 — Reports and notifications (1 week):** `REPORT-01` to `REPORT-03`; `NOTIF-01`; `DASH-03`; `AUDIT-01`.
- **Sprint 7 — Hardening and launch (1 week):** `QA-01`, `SEC-01`, `REL-01`; resolve UAT issues; verify backup/restore and monitoring.

*Indicative timeline: approximately 7–9 weeks for a small experienced team, subject to scope, integrations, and UAE compliance review.*

---

## 7. Definition of Done

- Code is reviewed, linted, type-checked, and tested.
- Every API route validates inputs and enforces authentication, workspace scope, and role permissions.
- Database migrations are repeatable; RLS policies are tested for cross-workspace access.
- UI includes loading, empty, success, and error states and works on desktop and mobile.
- Money uses fixed-precision numeric storage; currency and date/time assumptions are documented.
- Financial calculations have unit and integration tests, including partial payments, voids, arrears, deposits, and recurring expense retries.
- Files are private by default; access is authorized; secrets are not exposed in browser bundles or logs.
- Acceptance criteria are demonstrated in staging and documented.

---

## 8. Key Product Decisions to Confirm

1. Are tenants allowed to log in during MVP, or is this strictly an internal owner/manager platform?
2. Should rent collection be recorded manually only, or should online payment integration be in the first release?
3. Which UAE tenancy and document requirements apply to the target emirates and customer segment?
4. Should VAT fields and VAT reporting be included in MVP, and what accounting basis should reports use?
5. Will a workspace manage multiple owners/clients with separate statements, or just one organization portfolio?
6. Which email/SMS/WhatsApp provider should be used for notifications?

---

## 9. Recommended First Build Order

1. **Repository & environment setup:** Shared contracts, workspace isolation, and monorepo structure.
2. **Core data model:** Migrations, RLS policies, seed scripts.
3. **End-to-end vertical slices:**
   $$\text{Create Property} \longrightarrow \text{Create Unit} \longrightarrow \text{Add Tenant / Lease} \longrightarrow \text{Create Expense} \longrightarrow \text{Record Rent Payment} \longrightarrow \text{Reconcile Dashboard Totals}$$

---
*End of document · Version 1.0*
