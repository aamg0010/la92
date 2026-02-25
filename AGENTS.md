# AGENTS.md

## Cursor Cloud specific instructions

This is a **Vite + React + TypeScript** dental clinic management SPA ("Consultorio Odontológico La 92") using Supabase as a hosted BaaS. There is no local backend or Docker dependency.

### Services

| Service | How to run | Port |
|---------|-----------|------|
| Frontend (Vite dev server) | `npm run dev` | 8080 |

The Supabase backend is hosted externally (URL/keys in `.env`). No local database setup needed.

### Key commands

See `package.json` scripts:
- **Dev server:** `npm run dev` (port 8080)
- **Lint:** `npm run lint` (pre-existing warnings/errors in shadcn/ui components — not blocking)
- **Tests:** `npm run test` (vitest)
- **Build:** `npm run build`

### Gotchas

- The Cloud VM may not have outbound HTTPS access to `ckbgjbxtzcistzcwpdqx.supabase.co`. Login/signup and any Supabase data queries will fail with "Failed to fetch" in that case. The frontend still renders and navigates correctly.
- ESLint exits with code 1 due to pre-existing errors in generated shadcn/ui components (`@typescript-eslint/no-empty-object-type`, `@typescript-eslint/no-require-imports`). These are not regressions.
- Both `package-lock.json` (npm) and `bun.lockb` (bun) exist; use `npm install` to stay consistent with the lockfile.
