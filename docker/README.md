# Clinident — Stack Docker Compose

Stack de PostgreSQL + PostgREST autocontenido para reemplazar Supabase.
Todo corre en el servidor (Plesk, 94.143.138.107) detras del proxy `api.php`
que esta en `clinident.trycompany.es/api`.

---

## Arquitectura

```
docker/
├── docker-compose.yml     # Servicios: postgres + postgrest
├── .env.example           # Plantilla (commiteable)
├── .env                   # Secretos reales (NO commitear)
├── init/                  # Scripts de inicializacion de postgres
│   ├── 000_init.sh        # Crea roles (clinident_api/anon/authenticated + la92_api)
│   ├── 01_schema.sql      # Copia de database/schema.sql
│   ├── 02_001..020_*.sql  # Copia de database/migrations/*.sql (orden numerico)
│   └── 03_grants.sql      # Grants finales a los roles PostgREST
├── pgdata/                # Volumen de datos (NO commitear)
└── backups/               # Backups locales (NO commitear)
```

Los scripts de `init/` los ejecuta postgres **solo la primera vez** que
arranca el contenedor (cuando `pgdata/` esta vacio). El orden es alfabetico:
shell scripts y SQL se procesan juntos, por eso los prefijos `000_`, `01_`,
`02_NNN_`, `03_` son importantes.

---

## Setup inicial

1. **Copiar `.env.example` a `.env`** y rellenar con secretos fuertes:
   ```bash
   cp .env.example .env
   nano .env
   ```

2. **Valor correcto de `JWT_SECRET`:**
   - Tiene que coincidir EXACTAMENTE con `VITE_JWT_SECRET` en
     `D:/la92/.env.production` (y el mismo que usa el server PHP).
   - Si no coinciden, el frontend recibira 401 en cada request
     porque PostgREST no podra verificar las firmas JWT.

3. **Levantar el stack:**
   ```bash
   docker compose up -d
   ```

4. **Ver que arranco bien:**
   ```bash
   docker compose ps
   docker compose logs -f postgres
   docker compose logs -f postgrest
   ```
   - postgres deberia reportar "database system is ready to accept connections"
   - postgrest deberia reportar "Connection successful" y "Listening on port 3000"

5. **Health check manual:**
   ```bash
   curl http://127.0.0.1:3001/
   # Deberia devolver OpenAPI JSON (swagger-ish) con las tablas expuestas.
   ```

---

## Puerto 3001 — posible colision

Si el PostgREST viejo (proveniente de Supabase o de una instalacion manual)
sigue escuchando en `127.0.0.1:3001`, este stack no va a poder bindearlo.

Para resolverlo:

**Opcion A (preferida):** matar el PostgREST viejo.
```bash
sudo systemctl stop postgrest  # o como corra en ese server
sudo systemctl disable postgrest
```

**Opcion B:** mover el nuevo a `3002`.
- Cambiar en `docker-compose.yml`:
  ```yaml
  ports:
    - "127.0.0.1:3002:3000"
  ```
- Actualizar `api.php` (el proxy que expone `clinident.trycompany.es/api`)
  para apuntar a `http://127.0.0.1:3002` en vez de `3001`.

---

## Operaciones comunes

### Ver logs
```bash
docker compose logs -f postgres
docker compose logs -f postgrest
```

### Backup manual (dump)
```bash
mkdir -p backups
docker exec clinident-postgres pg_dump -U clinident_owner clinident \
  > backups/clinident_$(date +%Y%m%d_%H%M%S).sql
```

### Restore desde dump
```bash
# PELIGRO: esto sobrescribe la DB actual.
docker exec -i clinident-postgres psql -U clinident_owner clinident \
  < backups/clinident_YYYYMMDD_HHMMSS.sql
```

### Reiniciar el stack
```bash
docker compose restart
```

### Reiniciar de cero (borra datos)
```bash
docker compose down
rm -rf pgdata/   # BORRA TODA LA DB
docker compose up -d
```

### Entrar a psql
```bash
docker exec -it clinident-postgres psql -U clinident_owner clinident
```

---

## Roles de base de datos

| Rol                       | Tipo       | Uso                                                       |
| ------------------------- | ---------- | --------------------------------------------------------- |
| `clinident_owner`         | superuser  | Propietario. Solo migrations/admin. No usar desde la app. |
| `clinident_api`           | LOGIN      | Conexion que usa PostgREST (`PGRST_DB_URI`).              |
| `clinident_anon`          | NOLOGIN    | Role efectivo para requests sin JWT.                      |
| `clinident_authenticated` | NOLOGIN    | Role efectivo para requests con JWT valido.               |
| `la92_api`                | NOLOGIN    | **Alias historico** — ver mas abajo.                      |

### Por que `la92_api`
`schema.sql` y varias migrations (p.ej. `020_create_budgets.sql`) ya hacian
`GRANT ... TO la92_api` cuando la DB vivia en Supabase. Para no tener que
tocar esas migrations (que son el fuente de verdad), creamos `la92_api`
como rol sin login, y le damos membership a `clinident_api`. De esta
forma cualquier privilegio otorgado a `la92_api` es heredado por el rol
LOGIN de PostgREST.

**Alternativa descartada:** reescribir todas las migrations para usar
`clinident_api`. Mas riesgoso (tocar SQL que ya funciona) y obligaria a
mantener una copia divergente.

---

## Seguridad — reglas

- **NO commitear `.env`** (tiene los passwords reales).
- **NO commitear `pgdata/`** (es la base de datos entera).
- **NO commitear `backups/`** (contiene datos de pacientes = datos de salud
  protegidos por RGPD).
- Todo eso esta cubierto por `../.gitignore`.
- Los puertos estan bindeados a `127.0.0.1` — **no** exponerlos al mundo.
  El unico acceso publico es via `api.php` proxy en el vhost de Plesk.

---

## Troubleshooting

**PostgREST devuelve 401 en todas las requests:**
- Verificar que `JWT_SECRET` en `.env` coincide con el del frontend
  (`VITE_JWT_SECRET` en `.env.production`).

**Postgres no arranca / errores en init scripts:**
- `docker compose logs postgres` te muestra que script fallo.
- Si fallan los init scripts, el container loopea. Solucion:
  `docker compose down && rm -rf pgdata/ && docker compose up -d`.
- OJO: eso borra la DB. Si ya hay datos, hace falta backup antes.

**Cambios en migrations no se aplican:**
- Los init scripts se corren SOLO si `pgdata/` esta vacio. Si la DB ya
  esta inicializada, nuevas migrations hay que aplicarlas manualmente:
  ```bash
  docker exec -i clinident-postgres psql -U clinident_owner clinident \
    < ../database/migrations/021_whatever.sql
  ```
