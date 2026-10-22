-- ==============================================================================
-- RENTORA MULTI-TENANT SAAS SUPABASE SCHEMA (V2.0)
-- Market: UAE | Currency: AED | Timezone: Asia/Dubai
-- Architecture: Super Admin Governance + Company Tenant Isolation + Universal Activity Logging Plugin
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. COMPANIES (Tenant Legal Entity Table)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    trade_license_no VARCHAR(100),
    trn VARCHAR(50), -- UAE Tax Registration Number (15 digits)
    poc_name VARCHAR(255) NOT NULL,
    poc_email VARCHAR(255) NOT NULL,
    poc_phone VARCHAR(50) NOT NULL,
    address TEXT,
    emirate VARCHAR(50) DEFAULT 'Dubai',
    currency VARCHAR(10) DEFAULT 'AED',
    time_zone VARCHAR(50) DEFAULT 'Asia/Dubai',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_poc_email ON public.companies(poc_email);

-- ==============================================================================
-- 2. COMPANY USERS & ROLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID,
    user_id UUID, -- References auth.users(id) in Supabase Auth
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'manager' CHECK (role IN ('super_admin', 'owner', 'admin', 'manager', 'accountant')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_email ON public.company_users(user_email);

-- ==============================================================================
-- 3. PROPERTIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'apartment_building',
    address TEXT NOT NULL,
    emirate VARCHAR(50) NOT NULL DEFAULT 'Dubai',
    community_area VARCHAR(100),
    building_reference VARCHAR(100),
    total_units INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_properties_company_id ON public.properties(company_id);
CREATE INDEX IF NOT EXISTS idx_properties_emirate ON public.properties(emirate);

-- ==============================================================================
-- 4. UNITS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_number VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'residential' CHECK (type IN ('residential', 'commercial')),
    floor VARCHAR(20),
    bedrooms INTEGER NOT NULL DEFAULT 1,
    bathrooms NUMERIC(3,1) NOT NULL DEFAULT 1.0,
    square_feet NUMERIC(10,2),
    market_rent NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'under_maintenance')),
    current_lease_id UUID,
    notes TEXT,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(property_id, unit_number)
);

CREATE INDEX IF NOT EXISTS idx_units_company_id ON public.units(company_id);
CREATE INDEX IF NOT EXISTS idx_units_property_id ON public.units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(status);

-- ==============================================================================
-- 5. TENANTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    emirates_id VARCHAR(50),
    passport_number VARCHAR(50),
    preferred_contact VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact IN ('email', 'phone', 'whatsapp')),
    emergency_contact VARCHAR(100),
    notes TEXT,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tenants_company_id ON public.tenants(company_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON public.tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON public.tenants(email);

-- ==============================================================================
-- 6. LEASES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    unit_ids UUID[] DEFAULT ARRAY[]::UUID[],
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    annual_rent NUMERIC(12,2) NOT NULL,
    payment_frequency VARCHAR(50) NOT NULL DEFAULT 'quarterly',
    number_of_cheques INTEGER NOT NULL DEFAULT 4,
    security_deposit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expiring', 'ended', 'terminated')),
    terms_notes TEXT,
    contract_url TEXT,
    cheques JSONB DEFAULT '[]'::JSONB,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_leases_company_id ON public.leases(company_id);
CREATE INDEX IF NOT EXISTS idx_leases_property_id ON public.leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON public.leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_status ON public.leases(status);

-- ==============================================================================
-- 7. RENT CHARGES (Installment Obligations)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rent_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    outstanding_amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'paid', 'overdue', 'voided')),
    notes TEXT,
    invoice_number VARCHAR(100),
    installment_index INTEGER DEFAULT 1,
    installment_total INTEGER DEFAULT 1,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rent_charges_company_id ON public.rent_charges(company_id);
CREATE INDEX IF NOT EXISTS idx_rent_charges_property_id ON public.rent_charges(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_charges_due_date ON public.rent_charges(due_date);
CREATE INDEX IF NOT EXISTS idx_rent_charges_status ON public.rent_charges(status);

-- ==============================================================================
-- 8. PAYMENTS (Rent Collections & Proof Receipts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cheque' CHECK (payment_method IN ('bank_transfer', 'cash', 'card', 'cheque')),
    reference VARCHAR(100),
    notes TEXT,
    subtotal_amount NUMERIC(12,2),
    vat_rate NUMERIC(5,2) DEFAULT 5.0,
    vat_amount NUMERIC(12,2),
    total_amount NUMERIC(12,2),
    proof_url TEXT,
    proof_name VARCHAR(255),
    invoice_number VARCHAR(100),
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_company_id ON public.payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_property_id ON public.payments(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);

-- ==============================================================================
-- 9. PAYMENT ALLOCATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    rent_charge_id UUID NOT NULL REFERENCES public.rent_charges(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_company_id ON public.payment_allocations(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_property_id ON public.payment_allocations(property_id);

-- ==============================================================================
-- 10. EXPENSE CATEGORIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#3b82f6',
    is_system_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_company_id ON public.expense_categories(company_id);

-- ==============================================================================
-- 11. VENDORS & SUPPLIERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    service_category VARCHAR(100),
    trn_or_tax_id VARCHAR(50),
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_vendors_company_id ON public.vendors(company_id);

-- ==============================================================================
-- 12. EXPENSES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    expense_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'voided')),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
    paid_at TIMESTAMPTZ,
    reference VARCHAR(100),
    notes TEXT,
    void_reason TEXT,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_expenses_company_id ON public.expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_property_id ON public.expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);

-- ==============================================================================
-- 13. EXPENSE ATTACHMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.expense_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_expense_attachments_expense_id ON public.expense_attachments(expense_id);

-- ==============================================================================
-- 14. NOTIFICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    user_id UUID,
    type VARCHAR(50) NOT NULL DEFAULT 'system',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link_url TEXT,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON public.notifications(company_id);

-- ==============================================================================
-- 15. UNIVERSAL ACTIVITY LOGS (Plugin Collection)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    collection_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'VOID')),
    old_data JSONB,
    new_data JSONB,
    diff JSONB,
    actor_id UUID,
    actor_name VARCHAR(255) DEFAULT 'System',
    actor_email VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_company_id ON public.activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_property_id ON public.activity_logs(property_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_collection ON public.activity_logs(collection_name);
CREATE INDEX IF NOT EXISTS idx_activity_logs_record ON public.activity_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- ==============================================================================
-- 16. UNIVERSAL ACTIVITY LOGGER TRIGGER FUNCTION (PLUGIN)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_capture_activity_log()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
    v_property_id UUID;
    v_record_id UUID;
    v_action VARCHAR(50);
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_diff JSONB := NULL;
    v_actor_id UUID;
BEGIN
    -- Determine Actor
    BEGIN
        v_actor_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_actor_id := NULL;
    END;

    IF (TG_OP = 'INSERT') THEN
        v_action := 'CREATE';
        v_new_data := to_jsonb(NEW);
        v_record_id := NEW.id;
        
        -- Safely extract company_id and property_id
        IF (v_new_data ? 'company_id') THEN
            v_company_id := (v_new_data->>'company_id')::uuid;
        ELSIF (TG_TABLE_NAME = 'companies') THEN
            v_company_id := NEW.id;
        END IF;

        IF (v_new_data ? 'property_id') THEN
            v_property_id := (v_new_data->>'property_id')::uuid;
        ELSIF (TG_TABLE_NAME = 'properties') THEN
            v_property_id := NEW.id;
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        v_action := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_record_id := NEW.id;

        IF (v_new_data ? 'company_id') THEN
            v_company_id := (v_new_data->>'company_id')::uuid;
        ELSIF (TG_TABLE_NAME = 'companies') THEN
            v_company_id := NEW.id;
        END IF;

        IF (v_new_data ? 'property_id') THEN
            v_property_id := (v_new_data->>'property_id')::uuid;
        ELSIF (TG_TABLE_NAME = 'properties') THEN
            v_property_id := NEW.id;
        END IF;

        -- Compute field differences
        SELECT jsonb_object_agg(key, json_build_object('from', v_old_data->key, 'to', v_new_data->key))
        INTO v_diff
        FROM jsonb_each(v_new_data)
        WHERE v_old_data->key IS DISTINCT FROM v_new_data->key;

    ELSIF (TG_OP = 'DELETE') THEN
        v_action := 'DELETE';
        v_old_data := to_jsonb(OLD);
        v_record_id := OLD.id;

        IF (v_old_data ? 'company_id') THEN
            v_company_id := (v_old_data->>'company_id')::uuid;
        ELSIF (TG_TABLE_NAME = 'companies') THEN
            v_company_id := OLD.id;
        END IF;

        IF (v_old_data ? 'property_id') THEN
            v_property_id := (v_old_data->>'property_id')::uuid;
        ELSIF (TG_TABLE_NAME = 'properties') THEN
            v_property_id := OLD.id;
        END IF;
    END IF;

    -- Avoid logging if no company_id can be resolved
    IF v_company_id IS NOT NULL THEN
        INSERT INTO public.activity_logs (
            company_id,
            property_id,
            collection_name,
            record_id,
            action,
            old_data,
            new_data,
            diff,
            actor_id,
            created_by,
            updated_by
        ) VALUES (
            v_company_id,
            v_property_id,
            TG_TABLE_NAME,
            v_record_id,
            v_action,
            v_old_data,
            v_new_data,
            v_diff,
            v_actor_id,
            COALESCE(v_actor_id, '00000000-0000-0000-0000-000000000000'::uuid),
            COALESCE(v_actor_id, '00000000-0000-0000-0000-000000000000'::uuid)
        );
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 17. ATTACH ACTIVITY LOGGING PLUGIN TRIGGERS TO ALL COLLECTIONS
-- ==============================================================================
DROP TRIGGER IF EXISTS trg_activity_companies ON public.companies;
CREATE TRIGGER trg_activity_companies AFTER INSERT OR UPDATE OR DELETE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.fn_capture_activity_log();

DROP TRIGGER IF EXISTS trg_activity_properties ON public.properties;
CREATE TRIGGER trg_activity_properties AFTER INSERT OR UPDATE OR DELETE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.fn_capture_activity_log();

DROP TRIGGER IF EXISTS trg_activity_units ON public.units;
CREATE TRIGGER trg_activity_units AFTER INSERT OR UPDATE OR DELETE ON public.units FOR EACH ROW EXECUTE FUNCTION public.fn_capture_activity_log();

DROP TRIGGER IF EXISTS trg_activity_tenants ON public.tenants;
CREATE TRIGGER trg_activity_tenants AFTER INSERT OR UPDATE OR DELETE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.fn_capture_activity_log();

DROP TRIGGER IF EXISTS trg_activity_leases ON public.leases;
CREATE TRIGGER trg_activity_leases AFTER INSERT OR UPDATE OR DELETE ON public.leases FOR EACH ROW EXECUTE FUNCTION public.fn_capture_activity_log();

DROP TRIGGER IF EXISTS trg_activity_rent_charges ON public.rent_charges;
CREATE TRIGGER trg_activity_rent_charges AFTER INSERT OR UPDATE OR DELETE ON public.rent_charges FOR EACH ROW EXECUTE FUNCTION public.fn_capture_activity_log();

DROP TRIGGER IF EXISTS trg_activity_payments ON public.payments;
CREATE TRIGGER trg_activity_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.fn_capture_activity_log();

DROP TRIGGER IF EXISTS trg_activity_expenses ON public.expenses;
CREATE TRIGGER trg_activity_expenses AFTER INSERT OR UPDATE OR DELETE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.fn_capture_activity_log();

DROP TRIGGER IF EXISTS trg_activity_vendors ON public.vendors;
CREATE TRIGGER trg_activity_vendors AFTER INSERT OR UPDATE OR DELETE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.fn_capture_activity_log();

DROP TRIGGER IF EXISTS trg_activity_expense_categories ON public.expense_categories;
CREATE TRIGGER trg_activity_expense_categories AFTER INSERT OR UPDATE OR DELETE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.fn_capture_activity_log();

-- ==============================================================================
-- 18. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Dynamic Helper: Get JWT Company ID
CREATE OR REPLACE FUNCTION public.get_session_company_id()
RETURNS UUID AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.company_id', true), '')::UUID;
$$ LANGUAGE sql STABLE;

-- Dynamic Helper: Is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.is_super_admin', true), '')::BOOLEAN, FALSE);
$$ LANGUAGE sql STABLE;

-- Company Isolation Policy on Properties
DROP POLICY IF EXISTS "company_tenant_isolation_properties" ON public.properties;
CREATE POLICY "company_tenant_isolation_properties" ON public.properties
    FOR ALL
    USING (company_id = public.get_session_company_id() OR public.is_super_admin() OR auth.role() = 'service_role')
    WITH CHECK (company_id = public.get_session_company_id() OR public.is_super_admin() OR auth.role() = 'service_role');

-- Company Isolation Policy on Units
DROP POLICY IF EXISTS "company_tenant_isolation_units" ON public.units;
CREATE POLICY "company_tenant_isolation_units" ON public.units
    FOR ALL
    USING (company_id = public.get_session_company_id() OR public.is_super_admin() OR auth.role() = 'service_role')
    WITH CHECK (company_id = public.get_session_company_id() OR public.is_super_admin() OR auth.role() = 'service_role');

-- Company Isolation Policy on Leases
DROP POLICY IF EXISTS "company_tenant_isolation_leases" ON public.leases;
CREATE POLICY "company_tenant_isolation_leases" ON public.leases
    FOR ALL
    USING (company_id = public.get_session_company_id() OR public.is_super_admin() OR auth.role() = 'service_role')
    WITH CHECK (company_id = public.get_session_company_id() OR public.is_super_admin() OR auth.role() = 'service_role');

-- Company Isolation Policy on Rent Charges
DROP POLICY IF EXISTS "company_tenant_isolation_rent_charges" ON public.rent_charges;
CREATE POLICY "company_tenant_isolation_rent_charges" ON public.rent_charges
    FOR ALL
    USING (company_id = public.get_session_company_id() OR public.is_super_admin() OR auth.role() = 'service_role')
    WITH CHECK (company_id = public.get_session_company_id() OR public.is_super_admin() OR auth.role() = 'service_role');

-- Company Isolation Policy on Payments
DROP POLICY IF EXISTS "company_tenant_isolation_payments" ON public.payments;
CREATE POLICY "company_tenant_isolation_payments" ON public.payments
    FOR ALL
    USING (company_id = public.get_session_company_id() OR public.is_super_admin() OR auth.role() = 'service_role')
    WITH CHECK (company_id = public.get_session_company_id() OR public.is_super_admin() OR auth.role() = 'service_role');

-- Company Isolation Policy on Expenses
DROP POLICY IF EXISTS "company_tenant_isolation_expenses" ON public.expenses;
CREATE POLICY "company_tenant_isolation_expenses" ON public.expenses
    FOR ALL
    USING (company_id = public.get_session_company_id() OR public.is_super_admin() OR auth.role() = 'service_role')
    WITH CHECK (company_id = public.get_session_company_id() OR public.is_super_admin() OR auth.role() = 'service_role');

-- Company Isolation Policy on Activity Logs
DROP POLICY IF EXISTS "company_tenant_isolation_activity_logs" ON public.activity_logs;
CREATE POLICY "company_tenant_isolation_activity_logs" ON public.activity_logs
    FOR ALL
    USING (company_id = public.get_session_company_id() OR public.is_super_admin() OR auth.role() = 'service_role');
