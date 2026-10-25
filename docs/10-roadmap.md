# 10 — Roadmap

Phases are ordered by what the pilot tenant needs to stop using paper, then what's needed to sell to other shops. Each phase ends with an **acceptance gate**. Don't start the next phase's features until the gate passes (bug fixes excepted). Milestones within a phase are listed in build order.

## Phase 0 — Foundation

| # | Milestone | Done when |
|---|-----------|-----------|
| 0.1 | Tooling | Prisma 7 + Postgres (Docker), Zod, shadcn/ui, Vitest, Playwright, Sentry wired; `npm run lint`, `typecheck`, `test`, `build` green in CI |
| 0.2 | Schema v1 | `schema.draft.prisma` → `prisma/schema.prisma`, first migration incl. SQL constraints ([04](04-data-model.md#constraints-added-in-sql-migrations)), idempotent seed |
| 0.3 | i18n + shell | `app/[lang]` root, dictionaries, `lib/format.ts`, app shell with sidebar, branch switcher placeholder, design tokens |
| 0.4 | Auth + tenancy core | Better Auth login (phone/email), `server/dal.ts`, `dbFor(ctx)` extension, permission keys, cross-tenant E2E test harness |

**Gate:** a seeded owner logs in at `/bn/dashboard`, sees an empty shell, and the tenant-isolation test suite passes.

## Phase 1 — Pilot MVP (Zobayer Smart Zone goes live)

| # | Milestone | PRD |
|---|-----------|-----|
| 1.1 | Settings, members, roles (system roles only), branch (single) | M14, M10 |
| 1.2 | Catalog + CSV import + barcode labels | M3 |
| 1.3 | Inventory: opening stock (qty + IMEIs), unit lookup/history, adjustments | M4 |
| 1.4 | Suppliers + purchases with IMEI scanning + supplier payments/ledger | M5 |
| 1.5 | Customers + due ledger + collections + statement | M7 |
| 1.6 | Cash sessions, expenses, cash book, daily closing | M11 |
| 1.7 | POS: scan, discounts + PIN overrides, split payments, due, hold, print 80mm/A4, void | M6 |
| 1.8 | Dashboard + basic reports (sales, profit, stock, low stock, dues, payables, daily closing, expenses) | M2, M12 |
| 1.9 | Manual subscription record for the pilot (admin sets plan/period by DB/admin stub) | M15 (stub) |
| 1.10 | Production deploy, backups, monitoring, shop hardware setup guide (scanner, thermal printer, kiosk printing) | [12](12-dev-guide.md#deployment) |

**Gate (pilot go-live):** all pilot stock entered with IMEIs. Staff complete the end-to-end test script (purchase → sell with due → collect due → close cash → reports reconcile). After that, **30 consecutive days** of daily use with cash closing matching physical cash, and no P1 bugs open.

## Phase 2 — Complete shop features

| # | Milestone | PRD |
|---|-----------|-----|
| 2.1 | Sales returns + exchange | M9 |
| 2.2 | Trade-in / used-phone buy-back (standalone + in POS) with photo uploads | M9 |
| 2.3 | Warranty claims with status SMS | M9 |
| 2.4 | Installments (EMI): plans, schedule, collections, late fees, reminders | M8 |
| 2.5 | SMS module: gateway adapter, outbox job, templates, credits, logs | M13 |
| 2.6 | Multi-branch: more branches, member branch assignment, transfers, branch prices | M10, M4 |
| 2.7 | Stock counts, purchase orders, quotations, purchase returns | M4, M5, M6 |
| 2.8 | Custom roles, audit log viewer, money accounts + transfers | M14, M11 |
| 2.9 | Full report set + CSV export + invoice QR verification | M12 |

**Gate:** the pilot tenant uses EMI, returns, trade-in and SMS in production for 2 weeks, and all reports reconcile on a scripted dataset (automated test).

## Phase 3 — SaaS launch

| # | Milestone | PRD / doc |
|---|-----------|-----------|
| 3.1 | Marketing site (bn/en): landing, features, pricing, contact | — |
| 3.2 | Self-signup with OTP + first-run wizard + trial | M1 |
| 3.3 | Plans, limits, feature flags, subscription lifecycle job | [06](06-saas-billing.md) |
| 3.4 | Billing: manual bKash/Nagad approval → SSLCommerz checkout + IPN | [06](06-saas-billing.md), [08](08-integrations.md) |
| 3.5 | Platform admin: tenants, plans, payments, suspension, impersonation, announcements, usage | M15 |
| 3.6 | Hardening: RLS (optional), rate limits, security headers/CSP, load test (design target in [02](02-feature-spec.md#non-functional-requirements)), restore drill | [03](03-architecture.md#security) |
| 3.7 | Help center: bn/en user guide, video walkthroughs, data import templates | — |

**Gate:** 3 non-pilot shops onboarded through self-signup and paying through the online gateway, with zero cross-tenant data incidents in a security review.

## Phase 4 — Growth (prioritize by customer demand)

- Custom subdomains / custom domains per tenant
- Offline-tolerant POS (queue sales locally, sync on reconnect; review `node_modules/next/dist/docs/01-app/02-guides/offline-support.md` and `progressive-web-apps.md`)
- Native/mobile owner app via a public API
- QZ Tray raw printing + cash drawer control
- bKash Tokenized Checkout direct, recurring auto-renew
- Online invoice/statement links shared via SMS/WhatsApp
- Repair/servicing job-card module (paid repairs, parts, technician)
- Wholesale features: customer price tiers, delivery challans
- Advanced analytics: sell-through by model, supplier performance, demand forecasting

## Definition of done (every milestone)

1. Meets the PRD acceptance criteria for the stories in scope
2. Permission-checked and tenant-scoped (covered by the isolation test suite)
3. bn and en strings complete, with print views checked in both
4. Unit tests for domain logic (stock, money, dues, EMI math), plus an E2E test for the main flow
5. `npm run lint`, `typecheck`, `test`, `build` green
6. Docs in `docs/` updated if behavior changed
