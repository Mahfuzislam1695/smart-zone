# 03 — Architecture

> **Next.js version note.** This repo runs Next.js **16.4** with `cacheComponents: true` and `partialPrefetching: true` (see `next.config.ts`). APIs differ from older Next.js. Before using any framework API, read the bundled guide in `node_modules/next/dist/docs/`. The sections below cite the specific files.

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 16.4 App Router, React 19.3, TypeScript strict | One full-stack codebase |
| UI | Tailwind CSS v4 (via `@tailwindcss/turbopack` loader), shadcn/ui (Radix), lucide icons | See [09](09-ui-ux.md) |
| Database | PostgreSQL 16+ | Managed (Neon / Supabase / RDS) or self-hosted |
| ORM | Prisma | Schema in `prisma/schema.prisma`, see [04](04-data-model.md) |
| Auth | **Better Auth** (email+password, phone-number plugin, Prisma adapter) | Auth.js is now maintained by the Better Auth team, which recommends Better Auth for new projects. Tenancy and roles are **our own tables**, not an auth plugin |
| Validation | Zod | Shared schemas for forms and Server Actions |
| Forms | React 19 `useActionState` + Server Actions | See `01-app/02-guides/forms.md` |
| Tables | TanStack Table (client) over server-paginated data | |
| Charts | Recharts | Dashboard and reports |
| Jobs / cron | Route Handlers under `/api/cron/*`, triggered by the host's cron (Vercel Cron or system cron) with a shared secret | SMS reminders, subscription renewals, held-cart expiry |
| File storage | S3-compatible (Cloudflare R2 / S3) | Logos, NID/device photos, receipts |
| Email | Resend / SMTP | Optional, SMS is primary |
| Testing | Vitest (domain logic), Playwright (E2E) | See [12](12-dev-guide.md#testing) |
| Monitoring | Sentry + structured logs | |

## Repository layout

```
app/
  [lang]/                    # root segment: "bn" | "en" (root param, see i18n)
    layout.tsx               # root layout: <html lang>, fonts, theme
    (marketing)/             # public site: landing, pricing, contact
    (auth)/                  # login, signup, forgot-password, invite/accept
    (app)/                   # tenant workspace (requires session + tenant)
      layout.tsx             # app shell: sidebar, top bar (branch switcher), session behind <Suspense>
      dashboard/
      pos/
      sales/  sales/[id]/
      customers/ customers/[id]/
      inventory/ inventory/units/[code]/
      purchases/ suppliers/
      installments/ returns/ warranty/ trade-ins/
      transfers/ expenses/ cash/
      reports/[report]/
      sms/
      settings/...
      print/invoice/[id]/    # print-optimized pages (80mm/A4)
    (admin)/admin/...        # platform admin (isPlatformAdmin only)
  api/
    auth/[...all]/route.ts   # Better Auth handler
    webhooks/payments/[provider]/route.ts
    webhooks/sms/[provider]/route.ts   # delivery reports
    cron/[job]/route.ts
    verify/invoice/[token]/route.ts    # public invoice verification (Phase 2); token = HMAC-signed sale id, no DB field
proxy.ts                     # locale redirect + optimistic auth redirect only
features/<module>/           # one folder per PRD module (catalog, inventory, sales, ...)
  actions.ts                 # 'use server' Server Actions (thin: auth → validate → service → updateTag)
  queries.ts                 # read functions (DAL-scoped, may use 'use cache' with tenant key)
  schemas.ts                 # Zod schemas
  components/                # module UI
server/
  services/                  # domain logic: postSale, postPurchase, receiveTransfer, ... (pure-ish, unit-tested)
  db.ts                      # Prisma client + tenant-scoping extension
  dal.ts                     # getSession(), requireMember(), requirePermission(), getTenantContext()
  sms/  payments/  storage/  # integration adapters (see 08)
lib/                         # framework-free helpers: money.ts, imei.ts, phone.ts, dates.ts, permissions.ts
dictionaries/                # bn.json, en.json
components/ui/               # shadcn/ui primitives
prisma/                      # schema.prisma, migrations/, seed.ts
docs/                        # this documentation
```

**Dependency rule:** `app/` → `features/` → `server/` → `lib/`. `lib/` imports nothing app-specific. `server/services` never imports from `next/*` (so it can be unit-tested and reused by cron jobs). Client components never import `server/*`. Enforce this with `import 'server-only'` at the top of every `server/*` file.

## Request flow

```
Browser ──► proxy.ts ──► Route (Server Component / Server Action / Route Handler)
              │                     │
              │ locale redirect     ├─► server/dal.ts  (verify session, load member + tenant + permissions)
              │ no-session redirect │         │
              │ (optimistic only)   │         ▼
              │                     ├─► features/*/queries.ts  ──► server/db.ts (tenant-scoped Prisma) ──► PostgreSQL
              │                     └─► features/*/actions.ts  ──► server/services/* (transaction) ──► updateTag()
```

- **Proxy** (`proxy.ts`, which replaced `middleware` in Next 16; see `01-app/01-getting-started/16-proxy.md`) only does: redirect `/` and paths without a locale to `/{locale}` (from the cookie, then Accept-Language, default `bn`), and redirect to login when **no session cookie exists** on `(app)`/`(admin)` paths. It never queries the database and is not the authorization layer.
- **Authorization happens in the DAL**, close to the data, on every Server Component read, Server Action and Route Handler. See `01-app/02-guides/authentication.md` § Data Access Layer.

## Authentication

- Better Auth handles credentials, sessions (DB-backed, httpOnly cookie), password reset, OTP (phone-number plugin with our SMS adapter), and rate limiting.
- Login identifier: mobile number (normalized E.164) or email.
- `server/dal.ts`:
  - `getSession()`: reads the session once per request (React `cache()`), returns `{ userId, sessionId }` or null.
  - `requireMember()`: loads the active **Membership** (tenant from the session's `activeTenantId`, branch from `activeBranchId`), checks the member is active, the tenant is not cancelled, and `membership.sessionVersion` matches. Otherwise it signs out. Returns a `TenantContext`.
  - `requirePermission(ctx, 'sale.create')`: throws a 403 error if missing.
- **Session reads are request-time.** With Cache Components, any component that reads the session must sit **inside `<Suspense>`**, so the app shell (sidebar, layout chrome, translations) is prerendered and the user-specific parts stream in. Follow `01-app/02-guides/authentication-with-cache-components.md`.
- Pages not yet adapted can temporarily export `instant = false` to opt out of instant-navigation validation (same guide, "Migrating an existing app").

```ts
// TenantContext — passed explicitly to every query/service
type TenantContext = {
  userId: string
  tenantId: string
  branchId: string            // active branch
  branchIds: string[]         // branches the member may access
  permissions: Set<PermissionKey>
  limits: { maxDiscountPct: number; canSeeCost: boolean }
  locale: 'bn' | 'en'
  tenantStatus: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED'
}
```

## Tenancy

**Model:** shared database, shared schema, a `tenantId` column on every tenant-owned table ([04](04-data-model.md)).

**Tenant resolution:** from the session (`activeTenantId`), not from the URL. Every tenant uses the same URLs (`/bn/pos`), which keeps routes static-shell friendly. Custom subdomains (`shop.smartzone.app`) are Phase 4. When added, proxy maps host → tenant slug and the DAL verifies the member belongs to it.

**Enforcement (defense in depth):**
1. **DAL:** every query and service takes a `TenantContext`. There is no exported function that reads tenant data without one.
2. **Prisma extension:** `server/db.ts` exports `dbForTenant(tenantId)` (and `dbFor(ctx)`, a shorthand for it), which returns a Prisma client extended to inject `where: { tenantId }` on reads/updates/deletes and `data: { tenantId }` on creates for all tenant-owned models. The raw client is only importable by `server/services/platform/*` (admin) and migrations.
3. **Composite uniques include `tenantId`** (`@@unique([tenantId, sku])`), so cross-tenant collisions are impossible.
4. **Optional hardening (Phase 3):** Postgres Row-Level Security with `SET LOCAL app.tenant_id` per transaction.
5. **Tests:** an E2E test logs in as tenant A and tries every list/detail route and action with tenant B ids, and expects 404/403.

**Branch scoping:** queries for branch-scoped entities (stock, sales, cash sessions, expenses) filter by `branchId IN ctx.branchIds` and default to `ctx.branchId`.

## Data access & mutations

- **Reads:** async Server Components call `features/*/queries.ts`. Lists are server-paginated via `searchParams`. Because `searchParams` is request-time data, list bodies render inside `<Suspense>`.
- **Mutations:** Server Actions in `features/*/actions.ts`. The pattern is always:
  1. `const ctx = await requireMember()` (re-verifies the session; never trust the client)
  2. `requirePermission(ctx, key)` and `requireWritable(ctx)` (blocks writes for suspended tenants)
  3. `schema.parse(input)` with Zod
  4. call a `server/services/*` function that runs in **one `prisma.$transaction`**
  5. `updateTag(...)` for affected cache tags, and return a typed result `{ ok: true, data } | { ok: false, code, fieldErrors? }`
- **Route Handlers** are used only for: the auth handler, payment/SMS webhooks, cron jobs, public invoice verification, and CSV export downloads.
- **Idempotency:** posting actions (sale, purchase, payment) accept a client-generated `idempotencyKey` (UUID created when the form mounts). A unique index on `(tenantId, idempotencyKey)` prevents double posting from double clicks or retries.

### Posting a sale (critical path)

`server/services/sales.ts → postSale(ctx, input)` inside one transaction (`Serializable` is not needed; conditional updates give the safety):

1. Allocate the invoice number: `UPDATE "DocumentCounter" SET value = value + 1 WHERE tenantId, branchId, docType, year RETURNING value` (row lock).
2. For each serialized line: `UPDATE "StockUnit" SET status='SOLD', saleLineId=… WHERE id=… AND tenantId=… AND status IN ('IN_STOCK','RESERVED') AND branchId=…`. If 0 rows are affected, throw `UNIT_NOT_AVAILABLE`.
3. For each quantity line: `UPDATE "BranchStock" SET qty = qty - n WHERE … AND qty >= n`. If 0 rows, throw `INSUFFICIENT_STOCK`.
4. Insert the Sale, SaleLines (with `unitCost` snapshot), StockMovements, Payments, CustomerLedgerEntry (if due), and CashSession entries.
5. Insert the AuditLog row.
6. After commit: enqueue the invoice SMS (outbox table, sent by cron/after()), and `updateTag` the stock, sales and customer tags.

Use `after()` from `next/server` for non-critical post-response work (SMS outbox flush), see `01-app/03-api-reference/04-functions/after.md`.

## Caching with Cache Components

`cacheComponents: true` means **nothing is cached unless marked with `"use cache"`**. Read `01-app/01-getting-started/08-caching.md` and `09-revalidating.md` before adding any cache.

**Rules for this project:**

1. **Static / shared data** (marketing pages, plan list, dictionaries, the app shell UI) may use `"use cache"` with `cacheLife('max')` or `('hours')`.
2. **Tenant data** may be cached only with this pattern from the auth guide: an exported function resolves `ctx` from the session, then calls an **unexported** `"use cache"` function that takes `tenantId` (and `branchId`) as arguments and tags itself:

   ```ts
   // features/catalog/queries.ts
   import 'server-only'
   import { cacheLife, cacheTag } from 'next/cache'
   import { requireMember } from '@/server/dal'

   export async function getCategories() {
     const ctx = await requireMember()
     return categoriesFor(ctx.tenantId)
   }

   async function categoriesFor(tenantId: string) {
     'use cache'
     cacheTag(`t:${tenantId}:categories`)
     cacheLife('hours')
     return dbForTenant(tenantId).category.findMany({ orderBy: { sortOrder: 'asc' } })
   }
   ```

   Keep the cached function unexported so no caller can pass another tenant's id. Cache keys and tags are stored **in plain text**, so key on ids only, never on phone numbers, names or tokens.
3. **Good candidates to cache:** categories, brands, product/variant catalog lists, settings, payment methods, permissions per role.
   **Never cache:** stock quantities, unit status, balances, dues, cash sessions, reports, or anything read during posting. Read these fresh and stream them behind `<Suspense>`.
4. **Invalidate** in Server Actions with `updateTag('t:{tenantId}:{entity}')` (read-your-own-writes). In webhooks/cron use `revalidateTag(tag, 'max')`.
5. **Tag naming:** `t:{tenantId}:{entity}` and optionally `t:{tenantId}:{entity}:{id}`. Entities: `categories, brands, catalog, settings, paymentMethods, roles, branches`.
6. **Prefetching:** with `partialPrefetching`, `<Link>` prefetches each route's App Shell. Detail pages that depend on `params` (e.g. `/sales/[id]`) keep URL data behind `<Suspense>`. Only add `<Link prefetch={true}>` where instant detail views are worth one server call per link. See `01-app/02-guides/adopting-partial-prefetching.md`.

## Internationalization

- The locale is the **root segment** `app/[lang]` (`bn` default, `en`). Server code reads it with `lang()` from `next/root-params` (see `01-app/02-guides/internationalization.md`), so every locale's static shell can be prerendered.
- Root params are **not** available in Server Actions or Route Handlers. Actions return error **codes**, and the client renders the translated message from the dictionary it already has.
- Dictionaries live in `dictionaries/{bn,en}.json`, loaded server-side via `getDictionary()`. Client components receive only the slice they need as props (or through a small `DictionaryProvider` per feature).
- Switching language rewrites the URL prefix and stores `locale` on the user profile and in a cookie, so proxy redirects correctly next time.
- Formatting rules (BDT, Bangla digits, dates): [07](07-i18n-printing.md).

## Security

| Concern | Measure |
|---------|---------|
| Tenant isolation | DAL + Prisma extension + composite uniques + cross-tenant E2E tests (see Tenancy) |
| AuthZ | Permission check in every action/handler; UI hiding is cosmetic only |
| Server Actions | Treated as public endpoints: auth + permission + Zod in every action. See `01-app/02-guides/data-security.md` |
| Passwords | Better Auth (scrypt), min 8 chars, breach-list check optional |
| Brute force | Login lockout, OTP rate limits (Better Auth rate limiter backed by DB/Redis) |
| PINs | Approval PINs stored hashed (argon2/scrypt); 5 failed attempts lock PIN for 10 min |
| Webhooks | Verify gateway signature / re-query transaction status server-to-server before trusting; idempotent on provider txn id |
| Cron | `Authorization: Bearer ${CRON_SECRET}` required |
| PII | NID numbers and photos visible only with `customer.pii.view`; photos in private bucket with signed URLs (5 min) |
| Audit | Append-only `AuditLog` for all mutations, logins, permission changes, impersonation |
| Headers | CSP, HSTS, X-Frame-Options DENY (except print pages same-origin), Referrer-Policy. See `01-app/02-guides/content-security-policy.md` |
| Secrets | Env vars only; gateway credentials per platform (not per tenant) encrypted at rest if stored in DB |
| Backups | Daily full + PITR; quarterly restore drill |

## Background jobs

| Job | Schedule (Asia/Dhaka) | Does |
|-----|----------------------|------|
| `sms-outbox` | every minute | Sends queued SMS, respects quiet hours, updates SmsLog |
| `reminders` | daily 10:00 | Queues due and installment reminders per tenant settings |
| `held-carts` | hourly | Releases expired held carts and their unit reservations |
| `subscriptions` | daily 01:00 | Renewal reminders, moves tenants trial → past-due → suspended ([06](06-saas-billing.md)) |
| `usage-snapshot` | daily 02:00 | Records per-tenant usage for admin dashboard |

Each job is idempotent (safe to re-run) and processes tenants in batches.

## Error handling & observability

- Domain errors are typed (`UNIT_NOT_AVAILABLE`, `INSUFFICIENT_STOCK`, `DISCOUNT_LIMIT`, `DUE_LIMIT`, `PERIOD_LOCKED`, `PLAN_LIMIT`, `TENANT_READ_ONLY`, …) and mapped to translated messages.
- Unexpected errors go to `error.tsx` boundaries per route group plus Sentry, with `tenantId` and `userId` tags (no PII).
- Use `instrumentation.ts` for Sentry/OpenTelemetry setup (`01-app/02-guides/instrumentation.md`).

## Deployment topology

- **Option A (simplest):** Vercel (app + cron) + Neon/Supabase Postgres (Singapore region `ap-southeast-1`, closest to BD) + R2 storage.
- **Option B (cost control):** a single VPS (Docker: Next.js standalone + Postgres + Caddy) in Singapore or BD, with system cron calling `/api/cron/*`. See `01-app/02-guides/self-hosting.md`.

Details are in [12-dev-guide.md](12-dev-guide.md#deployment).
