# PRODUCT REQUIREMENTS DOCUMENT
## Rental Property Management SaaS
### Implementation-ready product, technical, API, data, security, and delivery specification

**Field Specification**  
**Version:** 1.0  
**Prepared:** 14 October 2026  
**Market:** United Arab Emirates (UAE)  
**Business model:** Multi-tenant SaaS  
**Frontend:** Next.js + React + TypeScript  
**Backend:** NestJS REST API  
**Database / Auth / Storage:** Supabase PostgreSQL / Supabase Auth / Supabase Storage  
**Reference:** [https://phenomenal-heliotrope-be9ef3.netlify.app/#/expenses](https://phenomenal-heliotrope-be9ef3.netlify.app/#/expenses)  

---

**Purpose:** Define requirements for a rental property management platform covering properties, units, tenants, leases, rent tracking, expenses, reporting, and workspace administration.

**Reference fidelity note:** The URL and client-side Expenses route are known, but the live page's exact visual layout and interactive behavior could not be verified. This document separates available reference facts from proposed requirements.

---

## 1. Executive Summary

Build a multi-tenant rental property management platform for property owners, property managers, and accountants. Each customer has an isolated workspace and can manage properties and units, tenant records, lease agreements, rent obligations, payment allocations, expenses, and financial reports.

The first production release covers all core operational modules. The tenant self-service portal and online rent collection are future extensions unless separately approved.

### Product Goals
- Centralize property, unit, tenant, and lease records.
- Track rent due, full and partial payments, and outstanding balances.
- Record, categorize, and report property-related expenses and receipts.
- Calculate cash flow and property-level financial summaries using explicit reporting rules.
- Provide monthly and annual reports with CSV, Excel, and PDF exports.
- Enforce secure multi-workspace access, role permissions, and auditable financial changes.

---

## 2. Reference Verification: Verified vs Proposed

### Available Reference Facts
- **Reference URL:** `https://phenomenal-heliotrope-be9ef3.netlify.app/#/expenses`
- The supplied URL includes a client-side route named `#/expenses`.
- The reference has been identified as an apartment rental management application.

### Not Verified from the Live Reference
- Exact page layout, colors, navigation, expense form fields, and row actions.
- Property, tenant, lease, rent, payment, reporting, and notification workflows.
- Authentication, role permissions, database schema, and integrations.
- Support for multiple workspaces, online payments, or tenant self-service.

*All detailed features below are proposed requirements, not claims about existing reference behavior. Capture screenshots of the Expenses page, navigation, create/edit forms, and other accessible modules before reproducing the UI.*

---

## 3. Product Decisions

| Decision | Final Specification |
| :--- | :--- |
| **Product type** | Rental property management |
| **Business model** | Multi-tenant SaaS |
| **Primary users** | Property owners and property management businesses |
| **Additional roles** | Property managers and accountants |
| **Market** | United Arab Emirates |
| **Currency** | AED by default; workspace-configurable |
| **Frontend** | Next.js, React, TypeScript |
| **Backend** | NestJS REST API |
| **Database** | Supabase PostgreSQL |
| **Authentication** | Supabase Auth |
| **File storage** | Private Supabase Storage |
| **Release scope** | Full core platform |
| **Tenant portal** | Future extension |
| **Online rent collection** | Integration-ready; not assumed in MVP |

---

## 4. Users, Roles, and Permissions

- **Owner:** Manages workspace, team, portfolio, financial records, and settings.
- **Manager:** Manages properties, units, tenants, leases, expenses, and rent operations as authorized.
- **Accountant:** Reviews financial data, records transactions, reconciles and exports reports within assigned permissions.
- *Tenant self-service is not in the initial release.*

### Role-Based Access Control Matrix

| Capability | Owner | Manager | Accountant |
| :--- | :---: | :---: | :---: |
| View assigned portfolio | Yes | Yes | Yes |
| Manage workspace members | Yes | No | No |
| Manage properties and units | Yes | Yes | No |
| Manage tenants and leases | Yes | Yes | Read-only |
| Create expenses | Yes | Yes | Yes |
| Edit/void expenses | Yes | Policy-based | Policy-based |
| Record rent payments | Yes | Yes | Policy-based |
| View financial reports | Yes | Yes | Yes |
| Change workspace settings | Yes | No | No |

*Permissions must be enforced by the API and database policies, not merely by hiding controls in the UI.*

---

## 5. Functional Scope and Requirements

### 5.1 Authentication and Workspaces
- Register, sign in/out, and reset passwords using Supabase Auth.
- Create a workspace, invite members, assign roles, and switch between accessible workspaces.
- Isolate customer records by workspace and validate membership on every request.
- Guide new customers through creating their first property.
- **Acceptance:** Protected routes and APIs reject unauthenticated users; users cannot read or mutate another workspace's records.

### 5.2 Dashboard
- Show properties, occupied/vacant units, rent collected, rent outstanding, paid expenses, pending expenses, and net cash flow.
- Show income/expense trends, category breakdown, recent transactions, upcoming rent dates, and lease expiry reminders.
- Filter by date range, property, unit, and status; KPIs are computed from authorized database records.

### 5.3 Properties and Units
- Create, edit, view, and archive properties; store name, address, type, and optional reference.
- Manage units, unit numbers, status, rental details, and occupancy.
- Show property-level income, expenses, and profitability.
- Prevent overlapping active leases for the same unit by default, subject to an explicit override policy if needed.

### 5.4 Tenants and Leases
- Store tenant contact information and workspace association.
- Create, renew, and end leases with dates, rent amount, payment frequency, deposit, and renewal terms.
- Upload lease documents to private storage and show tenancy/payment history.
- Notify authorized users about lease expirations and overdue rent.

### 5.5 Expense Management — Core Module
- **Expense list fields:** Date, description, property/unit, category, vendor, amount/currency, payment method, status, and actions.
- Support search, sorting, pagination, and filters for date range, property, unit, category, vendor, method, and status.
- **Create/edit fields:**
  - **Required:** Amount greater than zero, expense date, description, category.
  - Property is required for property-specific expenses; unit is optional and must belong to that property.
  - **Optional:** Vendor, payment method, invoice/reference number, receipt, notes.
  - **Status:** Pending or paid; a paid expense requires a valid payment timestamp (`paidAt`).
  - Workspace and actor IDs are derived server-side, not trusted from the client.
- **Default categories:** Maintenance and repairs, utilities, cleaning, management fees, insurance, property taxes/applicable local charges, service charges, marketing, legal/professional fees, supplies, and other. Workspace admins can add custom categories.
- **Expense rules:**
  - Pending expenses do not count as cash paid; show them separately.
  - Voided expenses are excluded from active totals but retained in audit history.
  - Finalized paid amounts must not be silently altered; use an audited correction or reversal.
  - Receipt upload does not automatically mark an expense paid.
  - Recurring expense generation must be idempotent and must not create duplicates on retry.
- **Acceptance:** Authorized users can create, view, edit permitted fields, filter, attach receipts, and void expenses. Dashboard and reports update consistently.

### 5.6 Rent and Payments
- Generate rent charges from active leases using configurable payment frequency and due dates.
- Record full and partial payments and allocate payments to one or more rent charges.
- Calculate outstanding balances and flag overdue amounts using due dates and configured grace periods.
- Maintain payment references, receipt information, and tenant-level history.
- Prevent duplicate payment submissions and over-allocation, including under concurrent requests.

### 5.7 Reports and Analytics
- Monthly income/expense summary and cash-flow trend.
- Expense breakdown by category, property, unit, and vendor.
- Rent collection and arrears reports.
- Property-level profitability view with explicitly defined inclusions/exclusions.
- Export structured data to CSV/XLSX and presentation-ready reports to PDF.

### 5.8 Notifications and Audit
- In-app and email reminders for rent due/overdue, lease expiry, and recurring expenses.
- Audit key financial changes with actor, timestamp, entity, action, and relevant before/after values.
- Record delivery status and failures for operational notifications.

---

## 6. Financial Business Rules

### Expense Lifecycle
$$\text{Pending} \rightarrow \text{Paid}; \quad \text{Pending} \rightarrow \text{Voided}; \quad \text{Paid} \rightarrow \text{Voided (only through authorized reversal workflow)}$$
A voided record is retained for audit and excluded from active totals. Metadata edits on paid expenses may be allowed, but amount corrections require an auditable correction/reversal.

### Rent Calculations
$$\text{Outstanding} = \text{Rent charge amount} - \sum (\text{Valid allocations})$$
- A charge is settled at zero outstanding.
- It is overdue when outstanding is positive and the configured due date plus grace period has passed.

### Reporting Conventions
- **Rent collected:** Successful incoming payments allocated to rent charges during the selected period.
- **Rent outstanding:** Unpaid balance on eligible rent charges as of the reporting date.
- **Expenses paid:** Non-voided expenses paid during the selected period.
- **Pending expenses:** Shown separately and excluded from cash flow.
- **Net cash flow:** Included cash received minus included cash paid; additional cash flows must be explicitly defined.
- **Security deposits and deposit refunds** are tracked separately from rental income and operating expenses.
- **Cash flow is not accounting profit.** Accruals, capitalization, depreciation, and a full general ledger are outside the initial model.

---

## 7. API Specification

**Base path:** `/api/v1`  
All routes require a valid Supabase access token unless explicitly marked public. Use NestJS DTO validation, server-derived workspace scope, consistent errors, and Swagger/OpenAPI documentation.

| Module | Method / Endpoint | Purpose |
| :--- | :--- | :--- |
| **Workspaces** | `GET /workspaces` | List accessible workspaces |
| **Workspaces** | `POST /workspaces` | Create workspace |
| **Properties** | `GET /properties` | List/filter properties |
| **Properties** | `POST /properties` | Create property |
| **Properties** | `GET /properties/:id` | View property |
| **Properties** | `PATCH /properties/:id` | Update property |
| **Units** | `GET /properties/:id/units` | List units |
| **Units** | `POST /properties/:id/units` | Create unit |
| **Tenants** | `GET /tenants` | Search tenants |
| **Tenants** | `POST /tenants` | Create tenant |
| **Leases** | `GET /leases` | List leases |
| **Leases** | `POST /leases` | Create lease |
| **Expenses** | `GET /expenses` | Filtered list |
| **Expenses** | `POST /expenses` | Create expense |
| **Expenses** | `GET /expenses/:id` | View expense |
| **Expenses** | `PATCH /expenses/:id` | Edit permitted fields |
| **Expenses** | `POST /expenses/:id/void` | Void with reason |
| **Expenses** | `POST /expenses/:id/attachments` | Register authorized attachment |
| **Categories** | `GET /expense-categories` | List categories |
| **Categories** | `POST /expense-categories` | Create category |
| **Rent** | `GET /rent-charges` | List charges |
| **Rent** | `POST /rent-charges` | Create or generate charges |
| **Payments** | `GET /payments` | List payments |
| **Payments** | `POST /payments` | Record payment and allocations |
| **Dashboard** | `GET /dashboard/summary` | Dashboard KPIs |
| **Reports** | `GET /reports/summary` | Financial summary |
| **Reports** | `GET /reports/expenses` | Expense report |
| **Reports** | `GET /reports/rent-arrears` | Outstanding rent report |
| **Notifications** | `GET /notifications` | List notifications |
| **Audit** | `GET /audit-logs` | Authorized audit history |

### Expense API Example

```http
POST /api/v1/expenses
Content-Type: application/json

{
  "propertyId": "UUID",
  "unitId": null,
  "categoryId": "UUID",
  "vendorId": null,
  "description": "Plumbing repair",
  "amount": "450.00",
  "currency": "AED",
  "expenseDate": "2026-10-14",
  "status": "paid",
  "paymentMethod": "bank_transfer",
  "paidAt": "2026-10-14T10:30:00Z",
  "reference": "INV-1042",
  "notes": "Kitchen pipe repair"
}
```

*Notes on monetary values and validation:*
- Use decimal strings in JSON for monetary values.
- Validate that category/property/vendor references belong to the same workspace; unit must belong to property.
- Reject unknown or unauthorized references.
- Require `paidAt` for paid expenses.
- Derive actor and workspace IDs server-side.

### List Filter Example

```http
GET /api/v1/expenses?from=2026-10-01&to=2026-10-31&propertyId=UUID&categoryId=UUID&status=paid&page=1&limit=25&sort=expenseDate:desc
```

Use inclusive date filters, allowlisted sort fields, server-side pagination, bounded page size, and totals computed under the same filters and authorization scope.

### Standard Error Example

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "The expense data is invalid.",
  "details": [
    {
      "field": "amount",
      "message": "Amount must be greater than zero."
    }
  ],
  "requestId": "server-generated-request-id"
}
```

**HTTP Status Conventions:**
- `400` Validation error
- `401` Unauthenticated
- `403` Forbidden
- `404` Unavailable / inaccessible resource
- `409` Conflict
- `500` Unexpected error (do not expose stack traces or secrets)

---

## 8. Database Specification

| Table | Purpose / Key Fields |
| :--- | :--- |
| `profiles` | Application profile linked to `auth.users.id` |
| `workspaces` | Customer account, default currency, time zone, settings |
| `workspace_members` | Membership, role, status; unique `(workspace_id, user_id)` |
| `properties` | Workspace-owned properties, address, type, status |
| `units` | Units within properties; unique unit number per property |
| `tenants` | Workspace-owned tenant contact records |
| `leases` | Unit/tenant contract, dates, rent, frequency, deposit |
| `expense_categories`| Workspace-defined categories |
| `vendors` | Workspace suppliers and contact information |
| `expenses` | Amount, currency, date, category, property/unit, status, paid timestamp |
| `expense_attachments`| Private storage path, filename, uploader |
| `recurring_expense_rules` | Schedule, next run, generation configuration |
| `rent_charges` | Lease, due date, amount, status |
| `payments` | Incoming payment amount, currency, date, method, reference |
| `payment_allocations` | Payment-to-charge allocation and amount |
| `notifications` | User notification and delivery status |
| `audit_logs` | Actor, action, entity, timestamp, change metadata |
| `idempotency_keys` | Unique operation keys and persisted results |

### Database Constraints and Implementation Rules
- Use UUID primary keys, foreign keys, `created_at`/`updated_at` timestamps, and appropriate indexes.
- Use `NUMERIC(12,2)` or equivalent fixed precision; never use floating-point values for persisted money.
- Store date-only fields as `DATE`; store event/audit timestamps as UTC `timestamptz`.
- Index `workspace_id`, `property_id`, transaction dates, category IDs, and rent due dates.
- Use database transactions and appropriate locking for payment allocation and balance updates.
- Prevent duplicate scheduled expenses with unique schedule identifiers or idempotency records.
- Use private storage paths and short-lived signed URLs for receipts and lease documents.
- Avoid hard deletion of finalized financial records; use voiding/archival and audit history.
- Never aggregate different currencies without an explicit conversion rate and reporting policy.

---

## 9. UI/UX Specification

**Visual Direction:** Clean, premium, operational dashboard; exact reference styling must be confirmed from screenshots.

- **Desktop:** Persistent collapsible sidebar; **mobile:** compact navigation and accessible primary actions.
- **Top bar:** Workspace selector, global search, notifications, profile menu.
- **Reusable components:** Tables, filters, forms, dialogs, status badges, date pickers, KPI cards, charts, breadcrumbs, and toasts.
- **States:** Every page must have loading, empty, error, success, and no-results states.
- **Expenses page:** Title, "Add expense" CTA, KPI cards, search, filters, sortable table, pagination, row actions, and receipt detail view.
- **Expense form:** Groups fields into details, property allocation, payment details, attachments, and notes.
- Use field-level validation and preserve valid input after recoverable API errors.
- Accessible labels, keyboard navigation, readable contrast, and status text in addition to color.
- Support Arabic text and plan for right-to-left (RTL) layouts; format dates and currency from workspace settings.

---

## 10. UAE-Specific Requirements

- Default currency **AED** and default time zone **Asia/Dubai**; allow workspace configuration.
- Store property address fields including emirate, area, and optional building/unit reference.
- Support lease dates, contractual rent, frequency, deposit, renewal terms, and configurable reminders.
- Allow UAE-relevant expense categories and configurable local charge labels.
- Support Arabic names, addresses, notes, and documents; plan for RTL UI.
- *Do not claim automated legal/regulatory compliance.* Have UAE rental procedures, tenancy documents, tax/VAT implications, and retention rules reviewed by qualified local advisers before automating compliance.

---

## 11. Non-Functional Requirements

| Area | Requirement |
| :--- | :--- |
| **Security** | Supabase Auth, server-side RBAC, workspace isolation, RLS, private storage |
| **Data integrity** | Fixed-precision amounts, constraints, atomic allocations, idempotency |
| **Performance** | Typical list/dashboard requests target under 2 seconds at expected load |
| **Responsive UI** | Desktop, tablet, and mobile support |
| **Accessibility** | Keyboard navigation, labels, contrast, accessible validation |
| **Auditability** | Actor, timestamp, action, entity, relevant before/after values |
| **Reliability** | Backups, recovery procedure, monitoring, error correlation |
| **Localization** | Configurable currency, date format, time zone, Arabic/RTL readiness |

---

## 12. Security Requirements

- Validate Supabase JWTs and authorize every request with NestJS guards.
- Enable RLS on exposed tables, add explicit policies, and test access using multiple workspaces.
- Revoke unnecessary database grants; RLS policies do not replace table privileges.
- Keep service-role keys and database credentials server-side only.
- Rate-limit authentication and sensitive endpoints; validate all DTOs.
- Validate file types, sizes, ownership, and access permissions.
- Use private buckets, short-lived signed URLs, secure headers, and managed secrets.
- Log financial mutations and privileged access; never log passwords, tokens, or secrets.
- Run dependency scanning, backup/recovery tests, and cross-workspace authorization tests.

---

## 13. Proposed Repository Structure

```text
rental-management/
├── apps/
│   ├── web/                     # Next.js: app routes, components, features, lib
│   └── api/                     # NestJS modules: auth, workspaces, properties, units, tenants, leases, expenses, rent, payments, reports, notifications, audit
├── packages/
│   ├── contracts/               # Shared DTO schemas and API types
│   ├── ui/                      # Shared UI components
│   └── config/                  # Shared lint/TypeScript settings
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── tests/
├── docs/
│   ├── PRD.md
│   ├── API.md
│   └── architecture/
└── package.json
```

---

## 14. Agent Workstreams and Dependencies

| Agent | Responsibility | Dependency / Output |
| :--- | :--- | :--- |
| **1. Product & architecture** | API contracts, data model, permissions, financial rules, environments | Foundation; approved schemas and decisions |
| **2. Database & security** | Migrations, constraints, RLS, storage policies, seed data, DB tests | Agent 1 schemas; secure database |
| **3. Backend API** | NestJS auth, guards, property/tenant/lease/expense/rent/payment/report modules | Contracts and DB interfaces |
| **4. Frontend & UX** | App shell, dashboard, CRUD screens, expense/rent workflows, reports | API contracts; mock data can unblock work |
| **5. QA & deployment** | E2E, security tests, deployment, monitoring, release checks | Test plans early; integrated app for final gate |

*Parallel work is permitted after contracts are agreed. Database and API implementations must not independently redefine the same business rules.*

---

## 15. Delivery Plan

| Milestone | Planning Estimate | Exit Criteria |
| :--- | :--- | :--- |
| **Architecture & foundation** | 1 week | Repo, environments, auth, migrations, permissions |
| **Property & tenancy** | 1–2 weeks | Properties, units, tenants, leases |
| **Expenses & rent** | 2–3 weeks | Expense lifecycle, schedules, allocations |
| **Dashboard & reports** | 1–2 weeks | Validated KPIs and exports |
| **QA & production launch** | 1–2 weeks | Security, E2E, deployment, recovery |

*Estimated overall delivery: 6–10 weeks for a small experienced team working in parallel. This is a planning estimate, not a guarantee; reference discovery, compliance review, integrations, and scope changes may extend it.*

---

## 16. Testing and Acceptance Criteria

| Test Area | Required Result |
| :--- | :--- |
| **Authentication** | Protected APIs reject missing/invalid tokens |
| **Workspace isolation** | User A cannot access User B's data |
| **Relationships** | Invalid property/unit/category references rejected |
| **Expenses** | Create/update/void and totals behave correctly |
| **Reporting** | Voided excluded; pending not counted as paid |
| **Rent allocation** | Partial/full payments produce correct balances |
| **Concurrency** | No over-allocation under simultaneous requests |
| **Recurring expenses** | Retries do not generate duplicate records |
| **Receipts** | Unauthorized users cannot download attachments |
| **Exports** | Rows/totals match authorized filters |
| **Audit** | Financial changes record actor and timestamp |
| **Responsive UI** | Core flows work at desktop and mobile breakpoints |
| **Recovery** | Failed operations do not leave partial financial updates |

### Production Release Gate
- All P0 features implemented and tested.
- No unresolved critical/high-severity security findings.
- No known cross-workspace access vulnerabilities.
- Migrations tested against a clean database; RLS tests pass.
- Backups and recovery procedures documented.
- Error monitoring and request correlation configured.
- Production smoke test covers sign-in, property setup, expense creation, rent payment, and report generation.

---

## 17. Out of Scope for Initial Release

- Direct bank synchronization and automatic rent payment collection.
- AI/OCR receipt recognition.
- Full accounting/general ledger, accrual accounting, capitalization, and depreciation.
- Tax filing or automated jurisdiction-specific compliance.
- Native iOS/Android applications.
- Public property listing or tenant-acquisition marketplace.

---

## 18. Risks and Mitigations

| Risk | Mitigation |
| :--- | :--- |
| **Incorrect financial totals** | Explicit definitions, decimal arithmetic, calculation tests |
| **Cross-workspace data exposure** | Server-side authorization, RLS, multi-tenant security tests |
| **Duplicate payments/expenses** | Idempotency keys, database constraints, transactional workers |
| **Ambiguous profitability** | Define treatment of deposits, pending costs, capital expenses, and date basis |
| **Receipt privacy** | Private storage, access checks, file validation, signed URLs |
| **Reference scope unknown** | Capture screenshots and validate page-by-page before copying UI |

---

## 19. Open Decisions Before Production

- Exact reference UI and behavior after screen capture.
- Whether online rent payment providers are needed in the first release.
- Whether transactions are AED-only initially or multi-currency from launch.
- Email provider and notification delivery preferences.
- Data retention, backup recovery objectives, and production hosting choice.
- UAE legal/accounting review of tenancy and financial reporting requirements.

---

## 20. Definition of Done

- Users can securely access a workspace and manage authorized team members.
- Properties, units, tenants, and leases can be managed.
- Expenses can be created, edited within policy, filtered, attached to receipts, and voided.
- Rent obligations and payment allocations produce correct balances.
- Dashboard figures match source records under defined reporting rules.
- Reports can be filtered and exported.
- Financial changes are auditable and attachments are private.
- Core workflows pass automated tests on desktop and mobile.
- Production deployment, backups, and monitoring are configured.

**Recommended next step:** Capture the reference Expenses screen, navigation, and create/edit forms. Use those screenshots to confirm exact visual requirements and convert the PRD into screen-level implementation tickets.

---
*End of document · Version 1.0*
