# Rental Property Management SaaS (UAE Market)

A multi-tenant Rental Property Management SaaS platform designed specifically for the United Arab Emirates (UAE) market, built with **Next.js**, **NestJS REST API**, and **Supabase PostgreSQL / Storage**.

---

## 🏛️ Architecture & Monorepo Structure

```text
rental-saas/
├── apps/
│   ├── web/                     # Next.js 14 frontend (React, TypeScript, Vanilla CSS design system)
│   └── api/                     # NestJS REST API (/api/v1, Swagger at /api/docs)
├── packages/
│   └── contracts/               # Shared TypeScript domain contracts, DTO types, and enums
├── supabase/
│   ├── migrations/              # 20261014000000_init_rental_schema.sql (PostgreSQL schema & RLS)
│   └── seed.sql                 # UAE portfolio seed data (Properties, Units, Leases, Expenses)
├── PRD.md                       # Product Requirements Document
├── plan.md                      # Implementation Backlog & Delivery Plan
└── package.json                 # pnpm workspace root
```

---

## 🚀 Quick Start & Local Development

### 1. Prerequisites
- **Node.js**: v20+ (tested on Node v23)
- **pnpm**: v9+

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Build Contracts & Apps
```bash
pnpm --filter @rental-saas/contracts run build
pnpm --filter @rental-saas/api run build
pnpm --filter @rental-saas/web run build
```

### 4. Run Tests
Runs the financial calculation, payment allocation, and business logic unit tests:
```bash
pnpm --filter @rental-saas/api run test
```

### 5. Launch Development Servers
- **Backend API** (Port 4000):
  ```bash
  pnpm --filter @rental-saas/api run dev
  ```
  - Swagger Documentation: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
  - REST API Base: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)

- **Frontend Web** (Port 3000):
  ```bash
  pnpm --filter @rental-saas/web run dev
  ```
  - Web Application: [http://localhost:3000](http://localhost:3000)

---

## 💡 Implemented Modules & Features

1. **Expenses Management (Core Reference Screen)**:
   - Monthly and yearly period switcher (`< October 2026 >`).
   - KPI summary cards: Revenue Collected, Total Expenses, Net Operating Income, Total Entries.
   - Filter bar: Search by description/reference, filter by category, property, and show/hide voided records.
   - Real-time Category Breakdown progress bars side panel.
   - "+ Add Expense" modal with field-level validation and UAE payment channels (Bank Transfer, Cheque, Card, Cash).
   - Auditable Void workflow with mandatory reason.
   - CSV export generator.

2. **Portfolio Dashboard**:
   - Rent Collected, Expenses Paid, Net Cash Flow, and Unit Occupancy Rate.
   - Attention banner for overdue rent installments.
   - Recent activity feed (incoming rent payments, maintenance expenses).

3. **Properties & Units**:
   - Portfolio cards for residential buildings across Dubai and Abu Dhabi.
   - Unit management list showing bedrooms, bathrooms, area (sq ft), annual market rent, and occupancy status (`occupied`, `vacant`, `under_maintenance`).
   - Add Property and Add Unit modals.

4. **Tenants & Leases**:
   - Tenant directory with UAE Emirates ID and preferred contact channel.
   - Lease contract management tracking start/end dates, annual rent in AED, payment cadence, number of cheques (e.g. 4 cheques), and security deposits.
   - Overlapping active lease prevention policy.

5. **Rent & Payment Allocations**:
   - Rent obligations schedule with due dates and overdue calculation.
   - Record Rent Payment modal with atomic charge allocation and over-allocation protection.

6. **Financial Reports & Audit**:
   - Property-level financial performance table (Rental Income, Operating Expenses, Net Cash Flow).
   - Rent Arrears Aging Report detailing days overdue and outstanding balances.
   - Immutable audit trail recording actor, action, timestamp, and before/after changes.
