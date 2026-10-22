# PRODUCT REQUIREMENTS DOCUMENT
## Rentora — Multi-Tenant Rental Property Management SaaS
### Implementation-ready product, technical, API, data, security, and multi-tenant delivery specification

**Specification:** Multi-Tenant SaaS Platform Specification  
**Version:** 2.0  
**Updated:** 19 October 2026  
**Market:** United Arab Emirates (UAE)  
**Business model:** B2B Multi-Tenant SaaS with Super Admin Governance  
**Frontend:** Next.js + React + TypeScript  
**Backend:** NestJS REST API  
**Database / Auth / Storage:** Supabase PostgreSQL / Supabase Auth / Supabase Storage  

---

## 1. Executive Summary

Rentora is a multi-tenant rental property management SaaS platform designed for property management firms, real estate developers, and large landlords across the United Arab Emirates.

The platform employs a **two-tier multi-tenant hierarchy**:
1. **Super Admin Layer (Platform Governance):** Global platform operators who onboard, monitor, configure, and manage client companies, subscription plans, and administrative governance.
2. **Company Layer (Tenant Isolation):** Each client organization functions as a self-contained **Company**. A company manages its designated portfolio of properties, units, tenants, lease contracts, rent charges, payment collections, expenses, vendors, and audit logs.

### Core Architectural Mandates
- **Elimination of "Workspace ID":** The legacy workspace concept is fully deprecated. **`company_id`** is the sole top-level tenant partition key.
- **Universal `company_id` and `property_id` in Every Collection:** To ensure complete tenant isolation and instant property-level filtering, **every data table/collection across the system explicitly stores both `company_id` and `property_id`**.
- **Universal Audit Attribution (`created_by` & `updated_by`):** Every data collection in the database must capture:
  - `created_by` (UUID referencing the actor who created the record)
  - `updated_by` (UUID referencing the actor who last modified the record)
  - `created_at` (UTC timestamp)
  - `updated_at` (UTC timestamp)
- **Zero Static Mock Data Policy:** Complete deprecation and removal of all client-side mock stores (`clientDemoStore.ts`), mock JSON files (`rentora-store.json`), and hardcoded dummy data. All operations execute strictly against the live database.
- **Robust Frontend <-> Backend REST Connection:** Next.js frontend links directly to the NestJS REST API with JWT Bearer authentication headers. Mock fallbacks are eliminated; the UI displays genuine loading states, server error alerts, and live server updates.
- **Supabase as Unified Database & Auth Backend:** Implementation of Supabase PostgreSQL with connection pooling, Row-Level Security (RLS), Supabase Auth, and standardized environment variables (`.env`) for both frontend and backend.
- **Universal Activity Logging Plugin:** A system-wide plugin and service (`ActivityLogsService`) hooked into every collection. Automatically captures all creations, updates, state transitions, and deletions with entity snapshots and diff deltas.
- **Mobile-First Responsive Layout:** When the application URL is opened on mobile devices or tablets (viewport < 768px), the UI automatically morphs into a mobile-first experience featuring an app-style bottom navigation bar, off-canvas drawer, card-transformed data lists, and touch-optimized bottom sheet modals.

---

## 2. Super Admin & Company Provisioning Architecture

```mermaid
graph TD
    SA[Platform Super Admin] -->|1. Creates & Manages| COMP[Company / Tenant Record]
    SA -->|2. Provisions POC Account| POC[Company Point of Contact - POC]
    POC -->|Email, Password, Phone| CADMIN[Company Admin Portal]
    CADMIN -->|Manages Staff| CU[Company Users: Managers, Accountants]
    CADMIN -->|Manages Portfolio| PROP[Properties & Units]
    PROP -->|Scopes Operations| OPS[Leases, Rent Charges, Payments, Expenses]
    OPS -->|Plugin Hook| ACT[Universal Activity Logs Service]
```

### 2.1 Super Admin Capabilities
- **Company Management:** Create new companies, edit company metadata, suspend/reactivate companies, and archive companies.
- **Company Onboarding & POC Setup:** When creating a company, the Super Admin must provide:
  - **Company Basic Information:** Legal Company Name, Trade License Number, Tax Registration Number (TRN), Head Office Address, Emirate (Dubai, Abu Dhabi, Sharjah, etc.), Default Currency (AED), and Time Zone (`Asia/Dubai`).
  - **Company POC (Point of Contact):**
    - POC Full Name
    - POC Email (serves as the primary admin login)
    - POC Temporary / Initial Password (hashed and stored securely in auth)
    - POC Phone Number (UAE mobile format `+971 5X XXX XXXX`)
- **Tenant Health & Metrics:** Monitor overall tenant counts, total active properties, units under management, and platform-level audit logs.

### 2.2 Company POC & User Lifecycle
- The provisioned POC account automatically holds the **Company Admin** role within the created company.
- Upon first sign-in using their provisioned email and password, the POC can invite additional staff members (Property Managers, Accountants) scoped strictly to that `company_id`.

---

## 3. Product Decisions

| Decision | Final Specification |
| :--- | :--- |
| **Product Architecture** | True Multi-Tenant SaaS with Super Admin Governance |
| **Tenant Partitioning Key** | **`company_id`** on all collections (Workspaces eliminated) |
| **Property Scoping Key** | **`property_id`** on all collections (enabling deep property-level filtering) |
| **Audit Requirement** | **`created_by`** and **`updated_by`** on all collections |
| **Data Integrity Policy** | **100% Live Database** — Total elimination of static mock data and local JSON files |
| **Database Engine** | **Supabase PostgreSQL** with connection pooling (PgBouncer) & RLS |
| **API Integration** | Direct typed Next.js REST connection to NestJS API with Supabase JWT Bearer headers |
| **Environment Architecture**| Standardized `.env` structure for Backend and Frontend |
| **Activity Logging Plugin** | Universal lifecycle plugin & service (`activity_logs`) capturing creations & updates across all collections |
| **Mobile Experience** | Dedicated mobile-responsive layout: bottom navigation, card-based table collapse, bottom sheets |
| **Super Admin Persona** | Dedicated platform administration portal for company provisioning |
| **Company POC Info** | POC Name, Email, Password, Phone Number, Trade License, TRN |
| **Market & Currency** | United Arab Emirates (AED default; FTA 5% VAT compliant) |
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS / Vanilla CSS |
| **Backend** | NestJS REST API with Supabase PostgreSQL |
| **Authentication** | Supabase Auth (JWT with claims: `sub`, `company_id`, `role`, `is_super_admin`) |
| **File Storage** | Private Supabase Storage with signed short-lived URLs |
| **Lease Invoicing** | Multi-cheque proforma invoice breakdown ($N$ installments = $N$ proforma invoices) |
| **Rent Payment Receipts** | Official Tax Invoice with company name, authentic circular **PAID** seal, and payment proof attachment |

---

## 4. Users, Roles, and Permissions

```
Platform Super Admin (Global Governance)
       │
       ▼
Company Admin / POC (Full Company Portfolio Authority)
       ├── Property Manager (Operational: Units, Leases, Payments, Expenses)
       └── Accountant (Financial: Expense Verification, Rent Reconciliation, Tax Reports)
```

### 4.1 Role Definitions
1. **Super Admin (Global Platform Authority):**
   - **Company Full Lifecycle Rights:** Full authoritative rights to **Create**, **Update**, and permanently **Delete** client tenant companies.
   - **Credential Management & Password Reset:** Exclusive rights to **reset passwords** of company POC accounts directly in Supabase Auth, generating secure credentials and provisioning instant login links.
   - **Account Status Governance:** Can transition company tenant accounts between `active` (operational) and `suspended` (locked access).
   - **Platform-wide Tenant Context Switching:** Can inspect individual company portfolios, audit activity logs, and monitor database partition health.
2. **Company Admin / Owner (POC):**
   - Point of contact and legal licensee of the company account.
   - Full read/write authority across all company properties, team members, leases, financials, and company profile settings.
3. **Property Manager:**
   - Operational management for properties, units, tenants, leases, and recording rent/expense transactions.
   - Cannot modify company registration details or delete companies.
4. **Accountant:**
   - Financial management: reviews expenses, verifies cheques, records allocations, downloads tax invoices, and exports audit/financial reports.

### 4.2 Role-Based Access Control (RBAC) Matrix

| Capability | Super Admin | Company Admin (POC) | Property Manager | Accountant |
| :--- | :---: | :---: | :---: | :---: |
| **Create Tenant Companies** | **Yes** | No | No | No |
| **Update Company Information & Status** | **Yes** | Yes (profile only) | No | No |
| **Delete Tenant Companies (Cascading Purge)** | **Yes** | No | No | No |
| **Reset Company POC Account Passwords** | **Yes** | Self-reset only | No | No |
| **Provision Initial POC Credentials** | **Yes** | No | No | No |
| **Invite company staff (Manager/Accountant)** | Yes (support) | Yes | No | No |
| **Manage company properties & units** | View-only | Yes | Yes | No |
| **Manage tenants & leases** | View-only | Yes | Yes | Read-only |
| **Generate & preview lease proforma invoices** | No | Yes | Yes | Yes |
| **Record rent payments & attach proof** | No | Yes | Yes | Yes |
| **View official tax invoices with PAID seal** | No | Yes | Yes | Yes |
| **Create & void expenses** | No | Yes | Yes (policy) | Yes (policy) |
| **View financial reports & rent arrears tabs** | Platform aggregated | Company level | Property level | Company level |
| **Export company financial & arrears CSVs** | Yes | Yes | Yes | Yes |
| **Access global audit logs** | All Companies | Company Scoped | Assigned Props | Financial Only |

---

## 5. Functional Scope & Modules

### 5.1 Super Admin Portal & Company Provisioning
- **Company Directory:** Paginated list of all companies with status (Active, Pending, Suspended), POC email, POC phone, property counts, and registration dates.
- **Create Company Modal / Wizard:**
  - Company Legal Name (e.g., `Al Reem Properties LLC`)
  - Trade License Number & TRN (UAE Tax Registration Number)
  - POC Full Name (e.g., `Sultan Al Nuaimi`)
  - POC Email (e.g., `sultan@alreemproperties.ae`)
  - POC Temporary Password
  - POC Phone Number (e.g., `+971 50 123 4567`)
  - Default Currency (AED) & Emirate
- **Company Status Control:** One-click suspend/reactivate with an audit reason.

### 5.2 Multi-Tenant Company Isolation
- Every API endpoint inspects the authenticated JWT session:
  - If user is Super Admin: permitted to call `/api/v1/super-admin/*`.
  - If user is Company Staff: `company_id` is extracted from the verified token/membership.
  - The client cannot spoof or alter `company_id`.
  - All database queries enforce `WHERE company_id = :sessionCompanyId`.

### 5.3 Properties and Units
- Properties belong to a specific company (`company_id`).
- Units belong to a property (`property_id`) and company (`company_id`).
- Unit types: `residential` (requires bedrooms/bathrooms) or `commercial` (offices/shops; bedrooms/bathrooms hidden).
- All unit and property mutations automatically record `created_by` and `updated_by`.

### 5.4 Tenants and Leases
- Tenants belong to `company_id` and link to their primary `property_id`.
- Multiple units under a single tenant: Support leases spanning multiple units under one contract.
- **Editable Cheque PDC Schedule:**
  - Standard UAE 1, 2, 4, or 6 cheque schedules.
  - Fully editable cheque rows: custom amounts, due dates, cheque numbers, and issuing bank names.

### 5.5 Lease Invoicing: Multi-Installment Proforma Invoices
- **Automated Installment Generation:**
  - Creating a lease with $N$ payments (e.g., 4 cheques) automatically generates $N$ distinct **Proforma Tax Invoices** (e.g., `PI-2026-001`, `PI-2026-002`, `PI-2026-003`, `PI-2026-004`).
  - Each proforma invoice features:
    - **Header:** Company Legal Name (not generic platform branding), TRN, Dubai Address.
    - **Details:** Installment $X$ of $N$, Due Date, Cheque Number, Bank Name.
    - **Bill To:** Tenant Name, Contact, Emirates ID.
    - **Premises:** Property Name, Unit Number(s), Contract Period.
    - **Financials:** Base Rent, 5% UAE VAT, Total AED Due.
    - **Clean Presentation:** No artificial "proforma stamp/watermark"; clean, executive corporate design.
    - **Settlement Instructions:** Company bank account name, IBAN, Swift, Cheque Beneficiary (`company_name`).
- Accessible from **Add Lease Modal** ("Preview Invoices"), **Tenants & Leases** table ("Invoices" button), and **Rent Due & Charges** table.

### 5.6 Rent Payments: Official Tax Invoice with PAID Seal & Proof Attachment
- **Payment Recording with Proof:**
  - In `RecordPaymentModal`, operators can upload payment proof (cheque scan, bank deposit receipt, wire transfer slip, image, or PDF up to 8MB).
  - Previews file with thumbnail, file name, and size. Stored as `proof_url` and `proof_name`.
- **Official Tax Invoice & Receipt:**
  - Displays Company Legal Name, TRN, and Invoice / Receipt Number (`INV-2026-XXXX`).
  - Breakdown: Base rent amount, 5% UAE VAT, Total Paid amount.
  - **Authentic Circular "PAID" Seal:**
    - Double-ring rubber stamp tilted at -9° to -12°.
    - Company name in the outer border (`COMPANY_NAME.toUpperCase()`).
    - Center text: **PAID / مدفوع**, payment clearance date, and "CLEARED & VERIFIED".
  - **Attached Proof Section:**
    - If proof was uploaded, renders a clean "Payment Proof" preview banner with image display or document download link.

### 5.7 Reports & Analytics: Tabbed Performance & Arrears View
- Organized as an intuitive **Tabbed Interface**:
  - **Tab 1: Property Financial Performance:**
    - Top KPI cards: Rental Income, Operating Expenses, Net Cash Flow.
    - Full-width table breaking down income, expenses, and cash flow per property.
    - Contextual "Export Financials CSV" button.
  - **Tab 2: Rent Arrears & Aging:**
    - Red badge indicator showing total delinquent count `(N)`.
    - Top KPI cards: Total Overdue Arrears, Delinquent Charges, Oldest Overdue (days).
    - Table displaying Tenant, Property/Unit, Due Date, Days Overdue badge, Total Billed, and Outstanding Balance.
    - Contextual "Export Arrears CSV" button.

### 5.8 Expenses Management
- Top single-line category filter bar with pill counters and percentage progress.
- 100% full-width expense table with Property & Unit tags, payment method, and action buttons.
- "+ Add Expense" action exists strictly within the Expenses module.

### 5.9 Activity Logs Collection & Universal Plugin
- **Universal Capture Plugin:**
  - Implemented as an automatic lifecycle plugin/interceptor attached to **every collection** across the system (`companies`, `properties`, `units`, `tenants`, `leases`, `rent_charges`, `payments`, `payment_allocations`, `expenses`, `vendors`, `expense_categories`, etc.).
  - Captures every mutating action: `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `VOID`.
  - Zero-effort per collection: any newly introduced entity or module inherits logging automatically without custom boilerplate.
- **Data Captured per Event:**
  - `company_id`: Tenant identifier (mandatory).
  - `property_id`: Scoped property identifier (if applicable to record).
  - `collection_name`: Name of the entity/table (e.g. `units`, `leases`, `payments`).
  - `record_id`: UUID of the affected record.
  - `action`: `CREATE` | `UPDATE` | `DELETE` | `STATUS_CHANGE` | `VOID`.
  - `old_data`: JSONB snapshot of record before mutation (`null` on `CREATE`).
  - `new_data`: JSONB snapshot of record after mutation (`null` on `DELETE`).
  - `diff`: JSONB object mapping only the altered attributes (`{ field: { from, to } }`).
  - `actor_id` (`created_by`): Supabase Auth UUID of the initiating user.
  - `actor_name` & `actor_email`: Human-readable identification.
  - `ip_address` & `user_agent`: Network security audit trail.
  - `created_at`: UTC timestamp.
- **Activity Logs UI & Audit Feed:**
  - Real-time chronological activity feed with filtering by Property, Collection, Action Type, Actor, and Date Range.
  - Expandable detail drawer showing visual side-by-side JSON and field-level diffs.

### 5.10 Mobile-First Responsive Layout & Architecture
- **Responsive Viewport Target:**
  - Fully responsive and adaptive across all screen sizes: Desktop (>= 1024px), Tablet (768px – 1023px), and Mobile (< 768px).
  - Specifically designed so opening the application URL on a mobile browser renders an app-like layout with zero side-scrolling, tiny tap targets, or cramped tables.
- **Mobile Navigation Architecture:**
  - **Fixed App Bottom Navigation Bar:** High-frequency shortcuts positioned at the thumb zone with safe area insets:
    1. *Dashboard* (Overview KPIs)
    2. *Properties* (Buildings & Units)
    3. *Leases* (Tenants & Contracts)
    4. *Payments* (Collections & Invoices)
    5. *Expenses* (Bills & Receipts)
  - **Off-Canvas Slide-out Drawer:** Toggled via a top-left hamburger button for secondary screens: Reports & Analytics, Activity Logs, Settings, Company Profile, and Sign Out.
- **Mobile-Optimized Header:**
  - Compact sticky top bar featuring the Company Name badge, active property switcher dropdown, and notification bell.
  - Timeframe filter bar transforms into a horizontal touch-scrollable pill carousel (`Today`, `Month`, `Quarter`, `Year`, `Custom`).
- **Data Display: Card-Based Transformation:**
  - Desktop multi-column data tables automatically transform into touch-friendly **Card Lists** on viewports < 768px.
  - Each card highlights:
    - Primary title & subtitle (e.g., *Unit 402 — Al Reem Tower*)
    - Status pill badge (e.g., *Occupied*, *Paid*, *Overdue*)
    - Key metrics (Rent AED, Due Date, Balance)
    - Tap action to view details or bottom action buttons (*View Invoice*, *Record Payment*, *Edit*).
- **Touch-Optimized Bottom Sheets & Modals:**
  - Modals morph into slide-up **Bottom Sheets** with drag handles, smooth animations, safe-area keyboard avoidance, and fixed bottom CTA buttons (*Submit*, *Cancel*).
  - Camera & File upload integration allows snapping instant photos of cheques, receipts, or deposit slips directly from mobile phones.

---

## 6. Financial & Invoicing Calculation Rules

### 6.1 UAE VAT Compliance (FTA Decree-Law No. 8 of 2017)
$$\text{Base Rent} = \frac{\text{Total Installment}}{1 + \frac{\text{VAT Rate}}{100}}$$
$$\text{VAT Amount} = \text{Total Installment} - \text{Base Rent} \quad (\text{Standard Rate: } 5.0\%)$$
$$\text{Total Amount} = \text{Base Rent} + \text{VAT Amount}$$

### 6.2 Rent Arrears Aging Formula
$$\text{Days Overdue} = \max\left(0, \, \text{Current Date} - \text{Due Date}\right)$$
$$\text{Outstanding Balance} = \text{Charge Amount} - \sum \text{Allocated Payments}$$

---

## 7. API Specification

**Base Path:** `/api/v1`  
All responses return JSON with standard error envelopes. Scoping keys (`company_id`, `property_id`, `created_by`, `updated_by`) are resolved and validated server-side.

### 7.1 Super Admin Endpoints
| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/super-admin/companies` | List all companies across the platform |
| `POST` | `/super-admin/companies` | Create new company & provision POC account |
| `GET` | `/super-admin/companies/:id` | View company profile and metrics |
| `PATCH` | `/super-admin/companies/:id` | Update company status (Active/Suspended), plan, TRN |
| `GET` | `/super-admin/analytics` | Platform-wide growth and volume metrics |

#### Super Admin Company Creation Payload Example:
```json
POST /api/v1/super-admin/companies
Content-Type: application/json

{
  "name": "Al Reem Properties LLC",
  "tradeLicenseNo": "CN-1092834",
  "trn": "100293849500003",
  "emirate": "Dubai",
  "address": "Floor 14, Marina Plaza, Dubai Marina",
  "defaultCurrency": "AED",
  "poc": {
    "fullName": "Sultan Al Nuaimi",
    "email": "sultan@alreemproperties.ae",
    "password": "SecureInitialPassword2026!",
    "phone": "+971501234567"
  }
}
```

### 7.2 Company Scoped Core Endpoints
Every core payload must contain or be server-injected with `company_id`, `property_id`, `created_by`, and `updated_by`.

| Module | Method | Endpoint | Scoping Parameters |
| :--- | :--- | :--- | :--- |
| **Properties** | `GET` | `/properties` | Scoped to `company_id` |
| **Properties** | `POST` | `/properties` | Injects `company_id`, `created_by`, `updated_by` |
| **Units** | `GET` | `/units?propertyId=...` | Scoped to `company_id` & `property_id` |
| **Units** | `POST` | `/units` | Requires `company_id`, `property_id` |
| **Tenants** | `GET` | `/tenants?propertyId=...` | Scoped to `company_id` & `property_id` |
| **Tenants** | `POST` | `/tenants` | Requires `company_id`, `property_id` |
| **Leases** | `GET` | `/leases?propertyId=...` | Scoped to `company_id` & `property_id` |
| **Leases** | `POST` | `/leases` | Generates $N$ proforma invoices with `company_id`, `property_id` |
| **Rent Charges** | `GET` | `/rent-charges` | Scoped to `company_id` & `property_id` |
| **Payments** | `POST` | `/payments` | Saves `proofUrl`, `proofName`, `company_id`, `property_id` |
| **Expenses** | `GET` | `/expenses` | Filter by `company_id`, `property_id`, date, category |
| **Expenses** | `POST` | `/expenses` | Injects `company_id`, `property_id`, `created_by`, `updated_by` |
| **Reports** | `GET` | `/reports/summary` | Property performance tabs scoped to `company_id` |
| **Reports** | `GET` | `/reports/rent-arrears` | Arrears tab scoped to `company_id` & `property_id` |
| **Activity Logs**| `GET`| `/activity-logs` | Filter by `company_id`, `property_id`, `collection`, `action`, `actorId`, `dateRange` |
| **Activity Logs**| `GET`| `/activity-logs/:id` | View granular audit diff and state snapshots |

---

## 8. Database Specification: Universal Scoping Schema

### 8.1 Universal Column Architecture
To satisfy the multi-tenant architecture and property-level query requirements, **all collections/tables** (without exception) implement the following standard column blueprint:

```sql
-- Standard Tenant Scoping & Audit Columns (Present in ALL Collections)
company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
property_id  UUID REFERENCES properties(id) ON DELETE CASCADE,
created_by   UUID NOT NULL REFERENCES auth.users(id),
updated_by   UUID NOT NULL REFERENCES auth.users(id),
created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
updated_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
```

> **Scoping Rules:**
> - `company_id`: Mandated foreign key partition key across all collections. All queries and RLS policies filter by `company_id`.
> - `property_id`: Required on all property-associated operational tables (`units`, `tenants`, `leases`, `rent_charges`, `payments`, `payment_allocations`, `expenses`, `expense_attachments`). On company-wide tables (`vendors`, `expense_categories`, `notifications`, `activity_logs`, `idempotency_keys`), `property_id` is present to allow property-level filtering or set to `NULL` for company-wide entities. On `properties`, its primary key `id` serves as the property identifier.
> - `workspace_id` is **permanently eliminated** from all schemas, DTOs, indices, and database tables.
> - `created_by` & `updated_by`: Mandatory audit trail columns tracking the authenticated user ID (`auth.users.id`).

### 8.2 Database Collection Catalog & Schema Details

| Collection / Table | Purpose | Scoping & Audit Columns | Key Entity Fields |
| :--- | :--- | :--- | :--- |
| **`companies`** | Tenant legal entity record | `id`, `created_by`, `updated_by`, `created_at`, `updated_at` | `name`, `trade_license_no`, `trn`, `poc_name`, `poc_email`, `poc_phone`, `emirate`, `address`, `currency`, `status` (`active`, `suspended`, `pending`) |
| **`company_users`** | Team membership & roles | `company_id`, `property_id` (opt), `created_by`, `updated_by`, timestamps | `user_id`, `role` (`admin`, `manager`, `accountant`), `status`, `invited_email` |
| **`properties`** | Real estate assets | `company_id`, `id` as `property_id`, `created_by`, `updated_by`, timestamps | `name`, `type` (`apartment_building`, `commercial_tower`, `villa_compound`), `address`, `emirate`, `total_units` |
| **`units`** | Individual leasable units | `company_id`, `property_id`, `created_by`, `updated_by`, timestamps | `unit_number`, `type` (`residential`, `commercial`), `floor`, `bedrooms`, `bathrooms`, `market_rent`, `status` |
| **`tenants`** | Tenant legal records | `company_id`, `property_id`, `created_by`, `updated_by`, timestamps | `full_name`, `email`, `phone_number`, `emirates_id`, `passport_number`, `preferred_contact` |
| **`leases`** | Tenancy contracts | `company_id`, `property_id`, `created_by`, `updated_by`, timestamps | `unit_id`, `unit_ids` (array), `tenant_id`, `start_date`, `end_date`, `annual_rent`, `number_of_cheques`, `cheques` (JSONB PDC schedule), `deposit`, `status` |
| **`rent_charges`** | Installment obligations | `company_id`, `property_id`, `created_by`, `updated_by`, timestamps | `lease_id`, `unit_id`, `tenant_id`, `period_start`, `period_end`, `due_date`, `amount`, `paid_amount`, `outstanding_amount`, `status`, `invoice_number`, `installment_index`, `installment_total` |
| **`payments`** | Rent payment collections | `company_id`, `property_id`, `created_by`, `updated_by`, timestamps | `unit_id`, `tenant_id`, `amount`, `currency`, `payment_date`, `payment_method`, `reference`, `subtotal_amount`, `vat_rate`, `vat_amount`, `total_amount`, `proof_url`, `proof_name`, `invoice_number` |
| **`payment_allocations`** | Charge settlement mapping | `company_id`, `property_id`, `created_by`, `updated_by`, timestamps | `payment_id`, `rent_charge_id`, `amount` |
| **`expense_categories`** | Category definitions | `company_id`, `property_id` (opt), `created_by`, `updated_by`, timestamps | `name`, `color`, `is_system_default` |
| **`vendors`** | Contractors & suppliers | `company_id`, `property_id` (opt), `created_by`, `updated_by`, timestamps | `name`, `contact_person`, `email`, `phone`, `trn_or_tax_id`, `service_category` |
| **`expenses`** | Outgoing expenditures | `company_id`, `property_id`, `created_by`, `updated_by`, timestamps | `unit_id` (opt), `category_id`, `vendor_id`, `amount`, `currency`, `expense_date`, `status`, `payment_method`, `paid_at`, `reference`, `void_reason` |
| **`expense_attachments`** | Invoice / receipt files | `company_id`, `property_id`, `created_by`, `updated_by`, timestamps | `expense_id`, `file_name`, `file_size`, `file_type`, `storage_path` |
| **`recurring_expense_rules`**| Automated recurring rules | `company_id`, `property_id`, `created_by`, `updated_by`, timestamps | `category_id`, `vendor_id`, `description`, `amount`, `cron_schedule`, `next_run_date`, `is_active` |
| **`notifications`** | Alert notifications | `company_id`, `property_id` (opt), `created_by`, `updated_by`, timestamps | `user_id`, `title`, `message`, `type`, `read`, `link_url` |
| **`activity_logs`** | Universal mutation audit plugin table | `company_id`, `property_id` (opt), `created_by`, `updated_by`, timestamps | `collection_name`, `record_id`, `action` (`CREATE`, `UPDATE`, `DELETE`, `VOID`), `old_data` (JSONB), `new_data` (JSONB), `diff` (JSONB), `actor_name`, `actor_email`, `ip_address`, `user_agent` |
| **`idempotency_keys`** | Duplicate prevention | `company_id`, `property_id` (opt), `created_by`, `updated_by`, timestamps | `idempotency_key`, `request_hash`, `response_payload`, `expires_at` |

### 8.3 Super Admin Provisioning & POC Authentication Sequence

```mermaid
sequenceDiagram
    autonumber
    actor SA as Super Admin
    participant SAP as Super Admin Portal
    participant API as NestJS API (/super-admin)
    participant AUTH as Supabase Auth (Admin API)
    participant DB as Supabase PostgreSQL
    actor POC as Company POC

    SA->>SAP: Enters Company Info (Name, TRN, License, Emirate)
    SA->>SAP: Enters POC Details (Name, Email, Password, Phone)
    SAP->>API: POST /api/v1/super-admin/companies
    API->>AUTH: auth.admin.createUser({ email, password, phone, user_metadata: { role: 'company_admin' } })
    AUTH-->>API: Returns new user_id
    API->>DB: INSERT INTO companies (name, trn, poc_name, poc_email, poc_phone, created_by, updated_by)
    API->>DB: INSERT INTO company_users (company_id, user_id, role='admin', created_by, updated_by)
    API-->>SAP: 201 Created (Company & POC Active)
    POC->>SAP: Signs into Company Portal using POC Email & Password
    SAP->>AUTH: signInWithPassword(email, password)
    AUTH-->>SAP: Returns JWT with claims (sub, company_id, role='admin')
    POC->>SAP: Full access to Company Portfolio & Property Operations
```

### 8.4 Universal Activity Logging Plugin (Database & Service Specification)

```mermaid
graph TD
    MUT[Any Mutation: INSERT / UPDATE / DELETE] -->|1. Event Trigger| PLUG[Universal Activity Plugin]
    PLUG -->|2. Compute State Delta| DIFF[Generate JSONB Field Diff]
    PLUG -->|3. Extract Context| CTX[company_id, property_id, actor_id, IP, UA]
    DIFF --> ACT_LOG[(activity_logs Collection)]
    CTX --> ACT_LOG
    ACT_LOG -->|Async Stream| UI[Real-time Activity Stream in Web UI]
```

#### 8.4.1 Plugin Trigger Mechanism
- The Activity Logging Plugin is bound to every operational table via a unified PostgreSQL trigger function: `fn_capture_activity_log()`.
- On every `INSERT`, it records:
  - `action = 'CREATE'`
  - `new_data = to_jsonb(NEW)`
  - `diff = null`
- On every `UPDATE`, it computes the exact delta between `OLD` and `NEW`:
  - `action = 'UPDATE'`
  - `old_data = to_jsonb(OLD)`
  - `new_data = to_jsonb(NEW)`
  - `diff = jsonb_object_agg(key, json_build_object('from', old_val, 'to', new_val))` for modified keys only.
- On every `DELETE`, it records:
  - `action = 'DELETE'`
  - `old_data = to_jsonb(OLD)`
- Inherits `company_id` and `property_id` directly from the record row, guaranteeing strict multi-tenant containment.

### 8.5 Supabase Database Implementation & Migration Strategy
- **Database Engine:** Supabase Managed PostgreSQL 15+.
- **Connection Architecture:**
  - **Transaction Connection Pooler (PgBouncer - Port 6543):** Used by NestJS backend for high-throughput, low-latency API queries and mutations (`DATABASE_URL`).
  - **Direct Session Connection (Port 5432):** Used for schema migrations and DDL execution (`DIRECT_URL`).
  - **Supabase Admin Client (`@supabase/supabase-js`):** Used in NestJS for administrative operations, service-role privileged tasks, and Super Admin company provisioning (`SUPABASE_SERVICE_ROLE_KEY`).
  - **Supabase Browser Client (`@supabase/ssr` / `@supabase/supabase-js`):** Used in Next.js for client authentication state, session storage, and token refresh (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- **Row-Level Security (RLS) Implementation:**
  - Every table has RLS explicitly enabled: `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`
  - Multi-tenant tenant policy pattern:
    ```sql
    CREATE POLICY "Company isolation policy" ON properties
      FOR ALL
      USING (company_id = (auth.jwt() ->> 'company_id')::uuid)
      WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);
    ```
  - Platform Super Admin bypass policy:
    ```sql
    CREATE POLICY "Super admin full access" ON properties
      FOR ALL
      USING ((auth.jwt() ->> 'is_super_admin')::boolean IS TRUE);
    ```
- **Migration & Schema Management:**
  - Migrations are stored in version control under `supabase/migrations/` (e.g. `20261019000000_multi_tenant_schema.sql`).
  - Schema deployment is automated via Supabase CLI (`supabase db push` / `supabase migration up`).

### 8.6 Complete Elimination of Static Mock Data & Frontend-to-Backend Architecture
- **Deprecation of Mock Stores:**
  - `apps/web/src/lib/demoStore.ts`: **DEPRECATED & DELETED**.
  - `apps/api/data/rentora-store.json`: **DEPRECATED & DELETED**.
  - `DataStoreService` in `apps/api`: Refactored to execute real database queries via Supabase client / PostgreSQL repository.
- **Frontend-to-Backend HTTP Client (`apps/web/src/lib/api.ts`):**
  - All frontend API calls go through the centralized typed `request<T>()` client.
  - Automatically attaches the current active user session's Supabase access token:
    ```typescript
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
    ```
  - **Zero Silent Fallback to Mock Data:** If the backend or database returns an error, the frontend bubbles the real error up to UI error boundaries and displays actionable user alerts (e.g. toast notification), ensuring transparent visibility into system status.
  - Data contracts are strictly shared across frontend and backend via `@rental-saas/contracts`.

### 8.7 Environment Configuration Architecture (`.env`)
The platform adopts strict environment-driven configuration across all application workspaces. Below are the definitive environment templates:

#### 8.7.1 Backend Environment Configuration (`apps/api/.env`)
```bash
# ==========================================
# RENTORA API ENVIRONMENT CONFIGURATION
# ==========================================
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# ------------------------------------------
# SUPABASE PROJECT CREDENTIALS (Project Macreme)
# ------------------------------------------
SUPABASE_URL=https://kbfaqsieyfnttbtbnnaf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# ------------------------------------------
# SUPABASE POSTGRESQL CONNECTION POOLER & DIRECT URL
# ------------------------------------------
# Transaction Pooler (Port 6543) - Recommended for API queries
DATABASE_URL=postgresql://postgres.kbfaqsieyfnttbtbnnaf:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct Connection (Port 5432) - Required for migrations
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.kbfaqsieyfnttbtbnnaf.supabase.co:5432/postgres

# Storage Bucket Names
SUPABASE_STORAGE_BUCKET_DOCS=company-documents
SUPABASE_STORAGE_BUCKET_PROOFS=payment-proofs
```

#### 8.7.2 Frontend Environment Configuration (`apps/web/.env.local`)
```bash
# ==========================================
# RENTORA WEB (NEXT.JS) ENVIRONMENT CONFIG
# ==========================================
# NestJS Backend API Endpoint
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Supabase Public Client Credentials
NEXT_PUBLIC_SUPABASE_URL=https://kbfaqsieyfnttbtbnnaf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Platform App Environment
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_DEFAULT_CURRENCY=AED
NEXT_PUBLIC_VAT_RATE=5.0
```

#### 8.7.3 Root Deployment & CI/CD (`.env.example`)
```bash
# Monorepo Master Environment Template
SUPABASE_URL=https://kbfaqsieyfnttbtbnnaf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.kbfaqsieyfnttbtbnnaf:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://kbfaqsieyfnttbtbnnaf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 9. UI/UX Specification

### 9.1 Super Admin Navigation
- Dedicated header/subdomain `/super-admin`.
- Super Admin Dashboard: Global company counter, active units, platform volume.
- Company Management: "+ Create Company" modal with company details and POC account provisioning.

### 9.2 Company Application Shell
- **Top Bar:**
  - Displays **Company Legal Name** prominently.
  - Global Timeframe Filter Bar (Today, This Month, This Quarter, This Year, Custom Range) appearing strictly once in the top navigation bar.
  - User profile, notification bell with unread badge, and sign-out.
- **Side Navigation (Desktop >= 1024px):**
  - Dashboard
  - Properties & Units
  - Tenants & Leases
  - Rent & Collections
  - Expenses (exclusively houses "+ Add Expense" action)
  - Reports & Statements (tabbed Financial Performance & Rent Arrears)
  - Activity Logs (Real-time universal mutation feed)

### 9.3 Invoicing & PDF Modals
- **Proforma Invoice View (`InvoiceModal.tsx`):**
  - Displays Company Name, TRN, Bill To, Unit, and Installment details.
  - Installment tabs allow navigating through all $N$ installments (e.g., 4 cheques).
  - Clean, unencumbered layout without confusing watermarks.
- **Paid Tax Invoice View (`InvoiceModal.tsx`):**
  - Features the official **PAID** seal with company name and clearance date.
  - Displays thumbnail and download link for uploaded payment proof.

### 9.4 Mobile-First Responsive Layout & Interaction Specification

```
┌──────────────────────────────────────────────┐
│  [≡]  AL REEM PROPERTIES        [🔔] [👤]    │  <-- Mobile Top Bar
├──────────────────────────────────────────────┤
│  [Today] [This Month] [This Quarter] [Year]  │  <-- Horizontal Scrollable Filter Pills
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ 🏢 Unit 402 - Al Reem Tower   [OCCUPIED│  │
│  │ AED 85,000 / yr · 4 Cheques            │  │  <-- Card-Based List Item
│  │ Tenant: Sultan Al Nuaimi               │  │      (Replaces Wide Table on Mobile)
│  │ [View Invoices]  [Record Payment]      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ 🏢 Unit 201 - Marina Heights   [VACANT]│  │
│  │ AED 60,000 / yr · Commercial           │  │
│  │ [Create Lease]                         │  │
│  └────────────────────────────────────────┘  │
│                                              │
├──────────────────────────────────────────────┤
│   📊       🏢       📝       💳       💰     │  <-- Fixed Thumb-Zone Bottom Nav
│  Home   Property   Leases   Collect  Expense │      (Safe-area inset padded)
└──────────────────────────────────────────────┘
```

#### 9.4.1 Responsive Breakpoint Matrix
- **Mobile (< 768px):**
  - **Navigation:** Desktop side navigation is completely hidden. Fixed **Bottom Navigation Bar** activates for the 5 core tabs (*Dashboard*, *Properties*, *Leases*, *Payments*, *Expenses*). Secondary items (*Reports*, *Activity Logs*, *Settings*) live in the top-left hamburger slide-out drawer.
  - **Data Layout:** All data tables collapse into touch-optimized **Card Views** with clear typography, high-contrast badges, and tap targets exceeding 44×44px.
  - **Filter Bar:** Renders as a single horizontal scroll carousel with momentum scrolling (`overflow-x: auto`, `scrollbar-width: none`).
  - **Forms & Modals:** Open as **Slide-Up Bottom Sheets** (`height: 90vh` max) with sticky submit/cancel footers that stay visible above the on-screen virtual keyboard.
  - **Camera Integration:** Payment proof and expense receipt file upload inputs trigger native mobile device camera capture (`accept="image/*;capture=camera"`).
- **Tablet (768px – 1023px):**
  - Compact collapsible sidebar (icon-only with tooltips).
  - Adaptive 2-column card grid or horizontal-scroll data tables with frozen lead columns.
- **Desktop (>= 1024px):**
  - Full-width expanded sidebar, rich multi-column tables, inline metrics, and centered dialog modals.

---

## 10. Security & Multi-Tenant Data Isolation

1. **Row-Level Security (RLS):**
   - Enabled on every table in Supabase.
   - Enforces `company_id = auth.jwt() ->> 'company_id'`.
   - Super Admins bypass via service-role context when executing authorized platform functions.
2. **Actor Attribution:**
   - PostgreSQL triggers automatically populate `created_by = auth.uid()` on `INSERT` and `updated_by = auth.uid()` on `UPDATE`.
3. **Universal Activity Log Isolation:**
   - `activity_logs` inherits RLS enforcing `company_id = auth.jwt() ->> 'company_id'`.
   - Company staff can only review activity within their authorized company and properties.
4. **Property-Level Cross-Validation:**
   - On inserting units, leases, charges, expenses, or payments, the database validates that `property_id` belongs to the same `company_id`.
5. **Proof Storage Security:**
   - Attached payment proofs and expense receipts are stored in private Supabase buckets keyed by `companies/{company_id}/properties/{property_id}/proofs/...`.
   - Accessible strictly through authenticated short-lived signed URLs.

---

## 11. Delivery Plan & Phases

| Phase | Milestone | Scope |
| :--- | :--- | :--- |
| **Phase 1: Supabase Database & Environment Setup** | Week 1 | Configure Supabase PostgreSQL (Project Macreme), establish connection pooler, define `.env` configurations, and deploy schema migrations (`supabase/migrations`). |
| **Phase 2: Static Data Elimination & API Integration** | Week 1–2 | Deprecate and remove `clientDemoStore.ts` and `rentora-store.json`. Connect Next.js directly to NestJS with JWT Bearer authentication and end-to-end `@rental-saas/contracts`. |
| **Phase 3: Super Admin & Tenant Core** | Week 2–3 | Super Admin portal, company onboarding, POC credentials, universal `company_id` / `property_id` / `created_by` / `updated_by` enforcement. |
| **Phase 4: Universal Activity Logging Plugin** | Week 3–4 | Implement `activity_logs` collection, PostgreSQL trigger plugin, NestJS `ActivityLogsService`, and real-time audit feed UI. |
| **Phase 5: Property & Tenancy Migration** | Week 4–5 | Units, commercial/residential unit types, multi-unit tenant leases, editable cheque schedule. |
| **Phase 6: Invoicing & Payments** | Week 5–6 | Multi-installment proforma invoices ($N$ cheques = $N$ invoices), payment proof uploads, official PAID seal tax invoices. |
| **Phase 7: Mobile-First Responsive Redesign** | Week 6–7 | Bottom navigation bar, slide-out drawer, card-based table transformation, bottom-sheet modals, camera proof capture. |
| **Phase 8: Reports, Security Audit & Launch** | Week 7–8 | Tabbed Reports (Financial Performance & Rent Arrears), RLS penetration tests, UAE production launch. |

---

*End of Document · Version 2.0 (Multi-Tenant Architecture Specification)*
