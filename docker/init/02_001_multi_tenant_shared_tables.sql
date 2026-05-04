-- =====================================================
-- MIGRATION 001: Multi-tenant shared tables
-- =====================================================

-- Clinicas registradas
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    schema_name VARCHAR(120) UNIQUE NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Licencias (suscripciones)
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    plan VARCHAR(50) DEFAULT 'basic',
    status VARCHAR(30) DEFAULT 'active',
    max_users INTEGER DEFAULT 5,
    starts_at DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_at DATE NOT NULL,
    grace_period_days INTEGER DEFAULT 7,
    amount DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'COP',
    payment_reference VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relacion usuario-clinica (reemplaza user_roles para scoped roles)
CREATE TABLE IF NOT EXISTS public.clinic_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role app_role DEFAULT 'doctor',
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, user_id)
);

-- Superadmin flag en usuarios
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Clinic ID en sesiones
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);

-- Indices
CREATE INDEX IF NOT EXISTS idx_clinic_users_user ON public.clinic_users(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_users_clinic ON public.clinic_users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_licenses_clinic ON public.licenses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sessions_clinic ON public.sessions(clinic_id);

-- Triggers updated_at
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON public.licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
