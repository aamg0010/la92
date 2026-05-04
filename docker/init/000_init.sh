#!/bin/bash
# ==============================================================================
# Clinident Postgres init — role setup
# ==============================================================================
# Se ejecuta UNA sola vez, en el primer arranque del contenedor postgres
# (solo si /var/lib/postgresql/data esta vacio).
#
# Crea los roles que PostgREST necesita:
#   - clinident_api          : rol con LOGIN usado por PostgREST para conectarse.
#                              Tiene NOINHERIT y puede hacer SET ROLE a los roles
#                              anon/authenticated segun el JWT de la request.
#   - clinident_anon         : rol sin privilegios para requests sin JWT.
#   - clinident_authenticated: rol para usuarios logueados (mapeo via claim).
#   - la92_api               : ALIAS (membresia) de clinident_api, necesario
#                              porque schema.sql y varias migrations hacen
#                              GRANT ... TO la92_api. Manteniendolo evita
#                              tener que tocar las migrations originales.
#
# Los passwords vienen de env vars inyectadas por docker-compose.
# ==============================================================================
set -e

: "${API_ROLE_PASSWORD:?API_ROLE_PASSWORD env var is required}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
-- Rol LOGIN usado por PostgREST. NOINHERIT para forzar SET ROLE explicito.
CREATE ROLE clinident_api WITH LOGIN PASSWORD '${API_ROLE_PASSWORD}' NOINHERIT;

-- Roles sin login (anonimo y autenticado) — a los que PostgREST hace SET ROLE.
CREATE ROLE clinident_anon NOLOGIN;
CREATE ROLE clinident_authenticated NOLOGIN;

-- Permite a clinident_api cambiar a cualquiera de los dos roles segun el JWT.
GRANT clinident_anon TO clinident_api;
GRANT clinident_authenticated TO clinident_api;

-- Alias historico: schema.sql y varias migrations usan GRANT ... TO la92_api.
-- En vez de reescribirlas, creamos la92_api como rol sin login al que
-- clinident_api pertenece (via membership). Asi cualquier GRANT a la92_api
-- queda disponible para clinident_api.
CREATE ROLE la92_api NOLOGIN;
GRANT la92_api TO clinident_api;

-- Permisos base (refinados por 03_grants.sql despues de aplicar migrations)
GRANT USAGE ON SCHEMA public TO clinident_anon, clinident_authenticated, la92_api;
EOSQL
