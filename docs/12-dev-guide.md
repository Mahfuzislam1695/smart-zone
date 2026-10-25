# 12 — Developer Guide

## Prerequisites

- Node.js 20.9+ (LTS 22 recommended)
- npm. The repo's committed lockfile is `package-lock.json`. Don't commit a second lockfile (an untracked `yarn.lock` currently exists. Delete it or switch deliberately).
- Docker (for local PostgreSQL), or a local PostgreSQL 16+
- Chrome (for testing printing and scanner flows)

## Dependencies to add when starting Phase 0

```bash
# runtime
npm i @prisma/client @prisma/adapter-pg pg better-auth zod \
      @tanstack/react-table recharts lucide-react sonner jsbarcode \
      @aws-sdk/client-s3 @aws-sdk/s3-request-presigner server-only
# dev
npm i -D prisma@7 tsx dotenv vitest @vitejs/plugin-react @playwright/test @types/pg
# UI primitives
npx shadcn@latest init        # then: npx shadcn@latest add button input dialog …
```

Pin Prisma to the **7.x stable** line (npm's `latest` tag currently points at an 8.0 release candidate). Before adding a library, check that it supports Next.js 16 / React 19.

## Local setup

```bash
cp .env.example .env.local          # fill DATABASE_URL etc. (see docs/08 § Environment variables)
docker compose up -d db             # Postgres 16 on :5432
npx prisma migrate dev              # apply migrations
npx prisma db seed                  # plans, admin, demo tenant (SEED_DEMO=true)
npm run dev                         # http://localhost:3000 → redirects to /bn
```

`docker-compose.yml` (to add):

```yaml
services:
  db:
    image: postgres:16
    environment: { POSTGRES_USER: smartzone, POSTGRES_PASSWORD: smartzone, POSTGRES_DB: smartzone }
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
volumes: { pgdata: {} }
```

## Scripts (to add to `package.json`)

| Script | Command |
|--------|---------|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint` |
| `typecheck` | `tsc --noEmit` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `test:e2e` | `playwright test` |
| `db:migrate` | `prisma migrate dev` |
| `db:deploy` | `prisma migrate deploy` |
| `db:seed` | `prisma db seed` |
| `db:studio` | `prisma studio` |

Run a single unit test: `npx vitest run server/services/sales.test.ts -t "rejects sold IMEI"`. Run a single E2E test: `npx playwright test e2e/pos.spec.ts -g "sale with due"`.

## Database

- Prisma 7 configuration lives in `prisma.config.ts` (`defineConfig` from `prisma/config`): `schema`, `migrations.path`, `migrations.seed: "tsx prisma/seed.ts"`, and `datasource.url: env("DIRECT_DATABASE_URL")` for CLI/migrations.
- The generated client goes to `generated/prisma` (gitignored). The runtime client is created in `server/db.ts` with the `@prisma/adapter-pg` driver adapter using the pooled `DATABASE_URL`.
- Schema changes: edit `prisma/schema.prisma`, run `npx prisma migrate dev --name <change>`, and commit the migration folder. Constraints Prisma can't express ([04](04-data-model.md#constraints-added-in-sql-migrations)) go into the migration SQL with `--create-only`.
- Never edit an applied migration. Production uses `prisma migrate deploy` only.
- Money columns: `Int` paisa. A review should reject any `Float` or `Decimal` added for money.

## Code conventions

- Follow the folder structure and dependency rule in [03](03-architecture.md#repository-layout).
- **Server Actions:** `requireMember` → `requirePermission` → `requireWritable` → Zod parse → service → `updateTag` → typed result. No business logic in actions or components.
- **Services** (`server/services/*`) take `(ctx, input, tx?)`, run in a transaction, throw typed `DomainError`s, and don't import `next/*`.
- **Queries** always take or resolve a `TenantContext`. Never export a function that accepts a bare `tenantId` from a `"use cache"` scope ([03](03-architecture.md#caching-with-cache-components)).
- **Money:** use `lib/money.ts` (`toPaisa`, `fromPaisa`, `sumPaisa`, `allocateProportionally`). Integer math only.
- **Dates:** use `lib/dates.ts` (`bizDateOf(instant)`, `dhakaDayRange(date)`). Never `new Date().toDateString()` for business days.
- **Strings:** no hard-coded UI text. Add a key to both `dictionaries/bn.json` and `en.json`.
- **Next.js APIs:** check `node_modules/next/dist/docs/` first. This version differs from older training data (e.g. `proxy.ts` instead of middleware, Cache Components, `updateTag`, root params).
- `next dev` maintains a block in `AGENTS.md` (`experimental.agentFeedback`). Commit it with your work.

## Testing

| Level | Tool | What |
|-------|------|------|
| Unit | Vitest | `lib/*` (money, IMEI Luhn, phone, format, amount-in-words, SMS segments), `server/services/*` against a test Postgres (transaction rolled back per test): posting sale/purchase/return, avg cost, landed cost, EMI schedule and allocation, ledger balances, document numbering, concurrency (two parallel sales of one IMEI) |
| E2E | Playwright | Login, POS sale with scanner simulation (fast keystrokes + Enter), due collection, cash close, purchase with IMEIs, return, permission denial for cashier, **cross-tenant isolation suite** |
| Reconciliation | Vitest | Scripted dataset of a month of activity, then assert that the dashboard = reports = ledgers = cash book |
| i18n | Vitest | Dictionary key parity bn/en |

Next.js testing guides: `node_modules/next/dist/docs/01-app/02-guides/testing/`.

## CI (GitHub Actions)

On every PR: install → `prisma generate` → lint → typecheck → unit tests (with a Postgres service container) → build → Playwright against `next start` with a seeded DB. `main` deploys to staging, and tags deploy to production.

## Deployment

**Environments:** `local` → `staging` (SSLCommerz/bKash sandbox, SMS to whitelisted numbers only) → `production`.

**Option A — Vercel + managed Postgres**
- Postgres: Neon or Supabase, region Singapore. Use the pooled URL for `DATABASE_URL` and the direct URL for migrations.
- Cron: Vercel Cron entries calling `/api/cron/<job>` with `CRON_SECRET`.
- Migrations: `prisma migrate deploy` in the build step or a release job.

**Option B — VPS (Docker)**
- `output: 'standalone'` in `next.config.ts`, Dockerfile multi-stage, Caddy for TLS, Postgres container with a volume, nightly `pg_dump` to object storage + WAL archiving (or a managed DB instead).
- System cron (or a small scheduler container) calls the cron routes.
- See `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md`.

**Production checklist:** env validated, `BETTER_AUTH_SECRET` rotated from dev, backups and a restore test done, Sentry receiving events, security headers checked, cron jobs firing, SMS sender approved, payment gateway live credentials and IPN URLs registered, `SEED_DEMO=false`.

## Shop hardware setup (for onboarding guide)

1. A barcode scanner in USB keyboard mode, with the Enter suffix enabled (the default on most models).
2. An 80mm thermal printer (e.g. Xprinter XP-80 series) with its driver installed, paper size 80mm × receipt, cash drawer kick enabled if a drawer is attached.
3. A Chrome shortcut with `--kiosk-printing` for silent printing, with the thermal printer as the system default.
4. Optional: a label printer (38×25mm) for accessory barcodes.
