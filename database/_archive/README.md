# Archive

Material de etapas anteriores del proyecto. **NO se aplica en la DB actual.**
Se conserva solo como referencia historica / auditoria.

## `supabase_legacy/`
Migraciones de la etapa en que Clinident corria sobre Supabase. Incluyen:
- Politicas de Row Level Security (RLS) basadas en `auth.uid()`
- Hooks al schema `auth` de Supabase
- Triggers especificos de GoTrue

Fueron reemplazadas por:
- El sistema de auth JWT custom (tabla `public.users` + funciones RPC
  `login`, `register_user`, etc.) implementado en
  `database/migrations/004_auth_functions_multi_tenant.sql`
- Checks explicitos dentro de funciones `SECURITY DEFINER`
  (p.ej. `_require_superadmin()`), en vez de RLS

El stack actual (PostgreSQL + PostgREST) vive en `/docker/`.
