-- ==============================================================================
-- 1. RENAME COMPANY_USERS TABLE TO USERS & UPDATE ROLE CHECK
-- ==============================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_users') THEN
        ALTER TABLE public.company_users RENAME TO users;
    END IF;
END $$;

-- If users table didn't exist, create it
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    property_id UUID,
    user_id UUID,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'manager',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Make company_id nullable so super_admin can exist without being bound to a single company
ALTER TABLE public.users ALTER COLUMN company_id DROP NOT NULL;

-- Update role check constraint on users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS company_users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('super_admin', 'owner', 'admin', 'manager', 'accountant', 'hr', 'viewer'));

-- Update status check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS company_users_status_check;
ALTER TABLE public.users ADD CONSTRAINT users_status_check 
    CHECK (status IN ('active', 'invited', 'suspended'));

-- ==============================================================================
-- 2. ADD SOFT DELETE (is_deleted, deleted_at) TO ALL CORE TABLES
-- ==============================================================================

-- Companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Units
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Leases
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Rent Charges
ALTER TABLE public.rent_charges ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.rent_charges ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ==============================================================================
-- 3. CREATE INDEXES FOR FAST SOFT-DELETE FILTERING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_companies_is_deleted ON public.companies(is_deleted);
CREATE INDEX IF NOT EXISTS idx_properties_is_deleted ON public.properties(is_deleted);
CREATE INDEX IF NOT EXISTS idx_units_is_deleted ON public.units(is_deleted);
CREATE INDEX IF NOT EXISTS idx_tenants_is_deleted ON public.tenants(is_deleted);
CREATE INDEX IF NOT EXISTS idx_leases_is_deleted ON public.leases(is_deleted);
CREATE INDEX IF NOT EXISTS idx_expenses_is_deleted ON public.expenses(is_deleted);
CREATE INDEX IF NOT EXISTS idx_rent_charges_is_deleted ON public.rent_charges(is_deleted);
CREATE INDEX IF NOT EXISTS idx_payments_is_deleted ON public.payments(is_deleted);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON public.users(is_deleted);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(user_email);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);

-- ==============================================================================
-- 4. SEED SUPER ADMIN INTO USERS TABLE
-- ==============================================================================
INSERT INTO public.users (
    id,
    company_id,
    user_email,
    user_name,
    role,
    status,
    is_deleted
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'superadmin@rentora.ae',
    'Platform Super Admin',
    'super_admin',
    'active',
    FALSE
)
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    user_name = 'Platform Super Admin',
    is_deleted = FALSE;
