-- Seed Data for Rental Property Management SaaS (UAE)
-- Workspace: Al Reem Properties LLC

-- 1. Profiles (Mock IDs for seed)
INSERT INTO public.profiles (id, email, full_name, phone_number)
VALUES 
  ('a1111111-1111-4111-8111-111111111111', 'sultan@alreem.ae', 'Sultan Al Nuaimi', '+971 50 123 4567'),
  ('a2222222-2222-4222-8222-222222222222', 'rami@alreem.ae', 'Rami Khoury', '+971 52 987 6543'),
  ('a3333333-3333-4333-8333-333333333333', 'fatima@alreem.ae', 'Fatima Zahra', '+971 55 456 7890')
ON CONFLICT (id) DO NOTHING;

-- 2. Workspaces
INSERT INTO public.workspaces (id, name, slug, default_currency, time_zone, owner_id)
VALUES 
  ('w1111111-1111-4111-8111-111111111111', 'Al Reem Properties LLC', 'al-reem-properties', 'AED', 'Asia/Dubai', 'a1111111-1111-4111-8111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- 3. Workspace Members
INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
VALUES 
  ('w1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'owner', 'active'),
  ('w1111111-1111-4111-8111-111111111111', 'a2222222-2222-4222-8222-222222222222', 'manager', 'active'),
  ('w1111111-1111-4111-8111-111111111111', 'a3333333-3333-4333-8333-333333333333', 'accountant', 'active')
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- 4. Expense Categories
INSERT INTO public.expense_categories (id, workspace_id, name, color, is_system_default)
VALUES 
  ('c1111111-1111-4111-8111-111111111111', 'w1111111-1111-4111-8111-111111111111', 'Maintenance & Repairs', '#10b981', true),
  ('c2222222-2222-4222-8222-222222222222', 'w1111111-1111-4111-8111-111111111111', 'Utilities (DEWA/ADDC)', '#0284c7', true),
  ('c3333333-3333-4333-8333-333333333333', 'w1111111-1111-4111-8111-111111111111', 'Cleaning & Sanitation', '#8b5cf6', true),
  ('c4444444-4444-4444-8444-444444444444', 'w1111111-1111-4111-8111-111111111111', 'Management Fees', '#f59e0b', true),
  ('c5555555-5555-4555-8555-555555555555', 'w1111111-1111-4111-8111-111111111111', 'Building Insurance', '#ef4444', true),
  ('c6666666-6666-4666-8666-666666666666', 'w1111111-1111-4111-8111-111111111111', 'Service Charges', '#06b6d4', true),
  ('c7777777-7777-4777-8777-777777777777', 'w1111111-1111-4111-8111-111111111111', 'Supplies & Tools', '#64748b', true)
ON CONFLICT (workspace_id, name) DO NOTHING;

-- 5. Properties
INSERT INTO public.properties (id, workspace_id, name, type, address, emirate, community_area, building_reference)
VALUES 
  ('p1111111-1111-4111-8111-111111111111', 'w1111111-1111-4111-8111-111111111111', 'Marina Crown Tower', 'apartment_building', 'Al Marsa Street, Dubai Marina', 'Dubai', 'Dubai Marina', 'BLDG-MCT-01'),
  ('p2222222-2222-4222-8222-222222222222', 'w1111111-1111-4111-8111-111111111111', 'Downtown Luxury Heights', 'residential', 'Sheikh Mohammed bin Rashid Blvd', 'Dubai', 'Downtown Dubai', 'BLDG-DLH-02'),
  ('p3333333-3333-4333-8333-333333333333', 'w1111111-1111-4111-8111-111111111111', 'Corniche Views', 'residential', 'Corniche Road', 'Abu Dhabi', 'Corniche', 'BLDG-CV-03')
ON CONFLICT (id) DO NOTHING;

-- 6. Units
INSERT INTO public.units (id, workspace_id, property_id, unit_number, floor, bedrooms, bathrooms, square_feet, market_rent, status)
VALUES 
  ('u1010101-1111-4111-8111-111111111111', 'w1111111-1111-4111-8111-111111111111', 'p1111111-1111-4111-8111-111111111111', '101', '1st Floor', 1, 2, 850.00, 85000.00, 'occupied'),
  ('u1020102-1111-4111-8111-111111111111', 'w1111111-1111-4111-8111-111111111111', 'p1111111-1111-4111-8111-111111111111', '102', '1st Floor', 2, 3, 1350.00, 130000.00, 'occupied'),
  ('u1030103-1111-4111-8111-111111111111', 'w1111111-1111-4111-8111-111111111111', 'p1111111-1111-4111-8111-111111111111', '103', '1st Floor', 1, 1, 720.00, 78000.00, 'vacant'),
  ('u2010201-2222-4222-8222-222222222222', 'w1111111-1111-4111-8111-111111111111', 'p2222222-2222-4222-8222-222222222222', '2001', '20th Floor', 2, 2, 1200.00, 145000.00, 'occupied'),
  ('u2020202-2222-4222-8222-222222222222', 'w1111111-1111-4111-8111-111111111111', 'p2222222-2222-4222-8222-222222222222', '2002', '20th Floor', 3, 4, 2100.00, 220000.00, 'vacant')
ON CONFLICT (id) DO NOTHING;

-- 7. Tenants
INSERT INTO public.tenants (id, workspace_id, full_name, email, phone_number, preferred_contact)
VALUES 
  ('t1111111-1111-4111-8111-111111111111', 'w1111111-1111-4111-8111-111111111111', 'Alexander Wright', 'alex.wright@example.com', '+971 50 443 2190', 'email'),
  ('t2222222-2222-4222-8222-222222222222', 'w1111111-1111-4111-8111-111111111111', 'Tariq Mansoor', 'tariq.m@example.com', '+971 52 331 8844', 'whatsapp'),
  ('t3333333-3333-4333-8333-333333333333', 'w1111111-1111-4111-8111-111111111111', 'Elena Rostova', 'elena.rostova@example.com', '+971 56 772 1993', 'phone')
ON CONFLICT (id) DO NOTHING;

-- 8. Leases
INSERT INTO public.leases (id, workspace_id, unit_id, tenant_id, start_date, end_date, annual_rent, payment_frequency, number_of_cheques, security_deposit, status)
VALUES 
  ('l1111111-1111-4111-8111-111111111111', 'w1111111-1111-4111-8111-111111111111', 'u1010101-1111-4111-8111-111111111111', 't1111111-1111-4111-8111-111111111111', '2026-01-01', '2026-12-31', 85000.00, 'quarterly', 4, 4250.00, 'active'),
  ('l2222222-2222-4222-8222-222222222222', 'w1111111-1111-4111-8111-111111111111', 'u1020102-1111-4111-8111-111111111111', 't2222222-2222-4222-8222-222222222222', '2026-03-01', '2027-02-28', 130000.00, 'quarterly', 4, 6500.00, 'active'),
  ('l3333333-3333-4333-8333-333333333333', 'w1111111-1111-4111-8111-111111111111', 'u2010201-2222-4222-8222-222222222222', 't3333333-3333-4333-8333-333333333333', '2025-11-01', '2026-10-31', 145000.00, 'monthly', 12, 7250.00, 'expiring')
ON CONFLICT (id) DO NOTHING;

-- 9. Vendors
INSERT INTO public.vendors (id, workspace_id, name, contact_person, email, phone, service_category)
VALUES 
  ('v1111111-1111-4111-8111-111111111111', 'w1111111-1111-4111-8111-111111111111', 'Gulf Cooling & HVAC Services', 'Rashid Al Baloushi', 'service@gulfcooling.ae', '+971 4 399 1234', 'HVAC / AC Maintenance'),
  ('v2222222-2222-4222-8222-222222222222', 'w1111111-1111-4111-8111-111111111111', 'Emirates Sparkle Cleaning Co', 'Nadeem Akhtar', 'contact@sparkledubai.com', '+971 4 355 9876', 'Deep Cleaning & Sanitization'),
  ('v3333333-3333-4333-8333-333333333333', 'w1111111-1111-4111-8111-111111111111', 'Dubai Electricity & Water Authority (DEWA)', 'Customer Support', 'customercare@dewa.gov.ae', '800 9090', 'Utilities')
ON CONFLICT (id) DO NOTHING;

-- 10. Expenses (October 2026)
INSERT INTO public.expenses (id, workspace_id, property_id, unit_id, category_id, vendor_id, description, amount, currency, expense_date, status, payment_method, paid_at, reference, notes)
VALUES 
  ('e1111111-1111-4111-8111-111111111111', 'w1111111-1111-4111-8111-111111111111', 'p1111111-1111-4111-8111-111111111111', 'u1010101-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111111', 'v1111111-1111-4111-8111-111111111111', 'AC compressor valve replacement & coil cleanup', 850.00, 'AED', '2026-10-04', 'paid', 'bank_transfer', '2026-10-04T11:20:00Z', 'INV-GC-8902', 'Resolved cooling issue for master bedroom'),
  ('e2222222-2222-4222-8222-222222222222', 'w1111111-1111-4111-8111-111111111111', 'p1111111-1111-4111-8111-111111111111', null, 'c2222222-2222-4222-8222-222222222222', 'v3333333-3333-4333-8333-333333333333', 'Common area power and water utility bill for September', 3240.50, 'AED', '2026-10-08', 'paid', 'bank_transfer', '2026-10-08T09:15:00Z', 'DEWA-2026-09-881', 'Paid via corporate banking portal'),
  ('e3333333-3333-4333-8333-333333333333', 'w1111111-1111-4111-8111-111111111111', 'p2222222-2222-4222-8222-222222222222', null, 'c3333333-3333-4333-8333-333333333333', 'v2222222-2222-4222-8222-222222222222', 'Bi-weekly lobby glass & marble polishing service', 1100.00, 'AED', '2026-10-12', 'paid', 'card', '2026-10-12T14:30:00Z', 'REC-ESC-4412', 'Full exterior and hallway sanitization'),
  ('e4444444-4444-4444-8444-444444444444', 'w1111111-1111-4111-8111-111111111111', 'p1111111-1111-4111-8111-111111111111', 'u1030103-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111111', null, 'Plumbing leak test and bathroom silicone re-grouting', 420.00, 'AED', '2026-10-14', 'pending', 'cash', null, 'WO-PL-09', 'Awaiting final inspection from property supervisor')
ON CONFLICT (id) DO NOTHING;

-- 11. Rent Charges (October 2026)
INSERT INTO public.rent_charges (id, workspace_id, lease_id, property_id, unit_id, tenant_id, period_start, period_end, due_date, amount, paid_amount, status)
VALUES 
  ('rc111111-1111-4111-8111-111111111111', 'w1111111-1111-4111-8111-111111111111', 'l1111111-1111-4111-8111-111111111111', 'p1111111-1111-4111-8111-111111111111', 'u1010101-1111-4111-8111-111111111111', 't1111111-1111-4111-8111-111111111111', '2026-10-01', '2026-12-31', '2026-10-01', 21250.00, 21250.00, 'paid'),
  ('rc222222-2222-4222-8222-222222222222', 'w1111111-1111-4111-8111-111111111111', 'l2222222-2222-4222-8222-222222222222', 'p1111111-1111-4111-8111-111111111111', 'u1020102-1111-4111-8111-111111111111', 't2222222-2222-4222-8222-222222222222', '2026-09-01', '2026-11-30', '2026-09-01', 32500.00, 32500.00, 'paid'),
  ('rc333333-3333-4333-8333-333333333333', 'w1111111-1111-4111-8111-111111111111', 'l3333333-3333-4333-8333-333333333333', 'p2222222-2222-4222-8222-222222222222', 'u2010201-2222-4222-8222-222222222222', 't3333333-3333-4333-8333-333333333333', '2026-10-01', '2026-10-31', '2026-10-01', 12083.33, 0.00, 'overdue')
ON CONFLICT (id) DO NOTHING;

-- 12. Payments & Allocations
INSERT INTO public.payments (id, workspace_id, tenant_id, property_id, unit_id, amount, currency, payment_date, payment_method, reference, notes)
VALUES 
  ('pay11111-1111-4111-8111-111111111111', 'w1111111-1111-4111-8111-111111111111', 't1111111-1111-4111-8111-111111111111', 'p1111111-1111-4111-8111-111111111111', 'u1010101-1111-4111-8111-111111111111', 21250.00, 'AED', '2026-10-02', 'cheque', 'CHQ-ENBD-88901', 'Q4 rent installment deposited to Emirates NBD')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payment_allocations (id, workspace_id, payment_id, rent_charge_id, amount)
VALUES 
  ('pa111111-1111-4111-8111-111111111111', 'w1111111-1111-4111-8111-111111111111', 'pay11111-1111-4111-8111-111111111111', 'rc111111-1111-4111-8111-111111111111', 21250.00)
ON CONFLICT (id) DO NOTHING;
