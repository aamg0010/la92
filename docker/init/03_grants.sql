-- =====================================================
-- Clinident — Grants finales para PostgREST
-- =====================================================
-- Se aplica DESPUES de 01_schema.sql y 02_*_*.sql.
--
-- Objetivo: que los roles clinident_anon / clinident_authenticated
-- tengan los permisos esperados por PostgREST sobre todo lo que
-- hayan creado el schema y las migrations, independientemente de
-- si las migrations los mencionaron explicitamente.
--
-- Nota: la92_api ya tiene permisos (via GRANT ... TO la92_api en
-- las migrations) y clinident_api hereda por membership. Aqui solo
-- nos aseguramos de que anon/authenticated esten cubiertos.
-- =====================================================

-- --- Tablas ---
-- Anonimo: solo lectura.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO clinident_anon;

-- Autenticado: lectura/escritura.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO clinident_authenticated;

-- --- Secuencias ---
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO clinident_authenticated;

-- --- Funciones RPC ---
-- Todas las RPCs (login, create_clinic, etc.) son accesibles via PostgREST.
-- El control de acceso real lo hace SECURITY DEFINER + _require_superadmin()
-- u otros checks dentro de la funcion.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO clinident_api, clinident_anon, clinident_authenticated;

-- --- Defaults para futuras migrations / objetos creados en runtime ---
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO clinident_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO clinident_authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO clinident_authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO clinident_api, clinident_anon, clinident_authenticated;
