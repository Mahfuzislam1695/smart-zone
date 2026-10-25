# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

SmartZone POS: a multi-tenant SaaS POS/ERP for mobile phone shops in Bangladesh (pilot tenant: Zobayer Smart Zone, Ulipur). Next.js 16.4, React 19.3, TypeScript strict, Tailwind CSS v4.

Built so far (UI only, no backend): brand, theme and logo; bilingual routing (`app/[lang]`, `proxy.ts` locale redirect); a landing page; auth screens (demo forms that just open the dashboard); the dashboard shell with placeholder module pages; and a working demo POS. All figures come from `lib/demo-data.ts`. There's no database, auth or tests yet. Follow `docs/13-brand.md` for any UI work.

## Product docs

**Read `docs/README.md` before building anything.** It indexes the PRD, architecture, data model (`docs/schema.draft.prisma`, validated with Prisma 7), permissions, billing, i18n/printing, integrations, UI, roadmap and dev guide. Build in the order in `docs/10-roadmap.md`. Update the docs when behavior changes.

Invariants (details in `docs/README.md` § Core invariants):
- Every tenant-owned query is scoped by `tenantId` through the DAL (`server/dal.ts`, `dbFor(ctx)`). Never query tenant data without a `TenantContext`.
- Money is `Int` paisa. Never use floats.
- IMEI/serial values are unique per tenant (`UnitIdentifier`).
- Stock changes only via `StockMovement` in the same transaction as the document. Posted documents are immutable (reverse, don't edit).
- Never cache tenant data in `"use cache"` unless `tenantId` is an argument of an unexported cached function and part of its `cacheTag`. Stock, balances and reports are never cached.
- Business days and reports use `Asia/Dhaka` (`bizDate`).
- The UI is bilingual (`app/[lang]`, `bn` default). Every string goes in both `dictionaries/bn.json` and `dictionaries/en.json`.

## Commands

- `npm run dev`: dev server at http://localhost:3000
- `npm run build`: production build (also runs type checking)
- `npm run start`: serve the production build
- `npm run lint`: ESLint 9 flat config (`eslint.config.mjs`, extends `eslint-config-next` core-web-vitals + typescript)

The committed lockfile is `package-lock.json` (npm); an untracked `yarn.lock` also exists. Ask before switching package managers or committing a second lockfile.

## Next.js version caveats

This Next.js is newer than most training data. Before using any Next.js API, read the matching guide in `node_modules/next/dist/docs/` (`01-app/` covers the App Router). Things in `next.config.ts` that change how code must be written:

- **`cacheComponents: true`**: uses the Cache Components caching model (`"use cache"` directive and related APIs), not the older `fetch`/`revalidate` segment-config model. See `01-app/01-getting-started/08-caching.md`. `GET` Route Handlers prerender like pages under this model.
- **`partialPrefetching: true`**: `<Link>` prefetches each route's static "App Shell". URL-dependent data (`params`, `searchParams`) should sit behind `<Suspense>`. The dev overlay reports instant-navigation insights for this. See `01-app/02-guides/adopting-partial-prefetching.md`.
- **`experimental.agentFeedback: true`**: `next dev` rewrites the marked block in `AGENTS.md`. Commit that change with your work; don't strip it out.
- **Tailwind via Turbopack loader**: there's no PostCSS config. `*.css` is processed by `@tailwindcss/turbopack` through `turbopack.rules`, so Tailwind only works under Turbopack (the default bundler). Theme tokens live in `app/globals.css` (`@theme inline`, CSS variables for background/foreground and Geist fonts).

## Conventions

- App Router only (`app/`). Route types are generated: layouts use the global `LayoutProps<"/route">` helper rather than hand-written props types.
- Import alias: `@/*` maps to the repo root (e.g. `@/app/...`).
- i18n: server code calls `getDictionary()` / `getLocale()` from `lib/i18n.ts`, which read the `[lang]` root param via `next/root-params`. Client components receive dictionary slices as props and import only `lib/locales.ts`. `en.json` must match `bn.json`'s shape (enforced by `satisfies Dictionary`).
- Use `buttonVariants()` from `components/ui/button.tsx` for links styled as buttons. It merges classes, so overrides like `hidden sm:inline-flex` work.
- Run `npx next typegen` after adding routes, before `tsc`, so the `next/root-params` and `LayoutProps` types exist.
- Under Cache Components, don't call `new Date()` in server render paths. Wrap it in a `"use cache"` function (see `currentYear()` in `components/marketing/footer.tsx`) or keep it in client event handlers.
- Planned layout and dependency rule (`app/` → `features/` → `server/` → `lib/`) and the Server Action pattern are in `docs/03-architecture.md` and `docs/12-dev-guide.md`.
