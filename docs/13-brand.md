# 13 — Brand Guide

## Idea: "Khata ink"

SmartZone POS replaces the paper **khata** (ledger notebook) that Bangladeshi shops run on. The brand borrows from that page: ballpoint-blue ink, the red margin rule, and ruled paper. It adds one modern element, the **scanner viewfinder**, because every phone in the shop is known by its IMEI.

Rules that keep the idea sharp:
1. **Red means money owed.** `--due` is used only for dues, overdue items, destructive actions, and the khata margin motif. A sale total, a heading or a decoration is never red.
2. **Boldness in one place per screen.** On the landing page that's the hero khata page with the live IMEI scan. The app stays quiet and dense.
3. **Bangla first.** Every surface is designed in Bangla, then checked in English (English is usually shorter).

## Logo

| File | Use |
|------|-----|
| `components/brand/logo.tsx` → `<Logo />`, `<LogoMark />` | In the app and site (inline SVG, follows theme tokens) |
| `public/brand/logo-mark.svg` | Mark on light backgrounds (social avatar, documents) |
| `public/brand/logo-mark-white.svg` | Mark on ink or dark backgrounds |
| `public/brand/logo.svg` | Horizontal lockup. The wordmark is live text in Anek Bangla, so **outline the text before print** |
| `app/icon.svg` | Favicon, switches colors in dark mode |

**Construction (48×48 grid):** four rounded viewfinder corners (stroke 3.5, ink), a phone silhouette (17×28, r4, ink), and one horizontal line across it (stroke 2.6, due red). The line is both the scan laser and the khata margin rule. Keep the line red in color versions. In single-color versions everything is one color.

**Wordmark:** "SmartZone" in Anek Bangla SemiBold at width 108, plus "POS" in Regular in the muted color. The product name is always written as one word, `SmartZone`, never "Smart Zone".

**Do / don't**
- Clear space: at least the width of one viewfinder corner (≈ ¼ of the mark) on all sides.
- Minimum size: mark 16px (favicon), lockup 96px wide.
- Don't recolor the mark outside the palette, rotate it, add shadows or gradients, or put the color mark on a busy photo. Use the white mark on ink instead.

## Color

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `ink` | `#1D3FBF` | `#6F8BFF` | Brand, primary actions, links, focus ring, active nav |
| `ink-deep` | `#132A80` | `#93A8FF` | Hover, CTA band background |
| `ink-soft` | `#E8EDFC` | `#1D2650` | Selected rows, active nav background, badges |
| `due` | `#D93246` | `#FF6B7A` | **Money owed only** (dues, overdue, delete) |
| `paid` | `#11865A` | `#3CC48A` | Paid, in stock, profit, success |
| `warn` | `#B7791F` | `#E9B44C` | Pending, warranty, demo notices |
| `paper` | `#F6F7F9` | `#0E1220` | Page background |
| `surface` | `#FFFFFF` | `#161B2C` | Panels, tables, header |
| `fg` | `#161A23` | `#E8EAF0` | Text |
| `muted` | `#5B6272` | `#9AA3B5` | Secondary text |
| `rule` | `#DDE1E8` | `#2A3149` | Borders, dividers |

Tokens live in `app/globals.css` (CSS variables + `@theme inline`) and are used as Tailwind classes: `bg-ink`, `text-due`, `border-rule`, etc. Components never use raw hex values (the logo files and receipt mockups are the only exceptions). White-labelling a tenant later means overriding `--ink*` only.

## Typography

| Face | Role | Notes |
|------|------|-------|
| **Anek Bangla** (variable, `wdth` 75–125) | Headlines, KPI numbers, wordmark | Hero uses `.type-wide` (`wdth` 116), timeline times use `.type-narrow` (`wdth` 88) |
| **Noto Sans Bengali** | All UI and body text, Bangla + Latin | Use `.nums` (tabular figures) for money, IMEI and quantities |
| **Galada** | Only the handwritten-khata illustration | Never for UI text |
| **JetBrains Mono** | Only receipt mockups and IMEI fields | Thermal printers print monospace |

Scale (1.25 ratio), as Tailwind `text-*` utilities: `2xs` 13 · `ui` 15 (app base) · `body` 17 (marketing body) · `h5` 21 · `h4` 26 · `h3` 33 · `h2` 41 · `h1` 52 · `hero` 64. Bangla line height 1.7, Latin 1.55. Keep body text under about 70 characters per line.

## Voice and copy

- Plain, specific, shop-floor words: IMEI, বাকি, কিস্তি, এক্সচেঞ্জ, ক্যাশ মেলানো. Prefer these over accounting jargon ("ledger receivable").
- Name actions by what happens: "পেমেন্ট ও প্রিন্ট" / "Pay & print", not "Submit". The same action keeps the same name across button, toast and receipt.
- Errors say what happened and what to do ("বাকি রাখতে কাস্টমার বাছাই করুন" / "Pick a customer to leave a due"). They never apologize and are never vague.
- Empty states invite the next action ("বক্সের IMEI বারকোড স্ক্যান করুন…").
- Sentence case everywhere. No all-caps labels. Don't put exclamation marks in UI.
- Demo or placeholder content is always labelled as demo (amber `warn` notice).

## Motion

One orchestrated moment: the landing hero scans the demo IMEI on arrival (laser sweep → timeline rows → receipt prints). Everything else animates only in response to the user (menus, FAQ, dialogs). All animation is disabled under `prefers-reduced-motion`.

## Where it's applied

- Public site: `app/[lang]/(marketing)` + `components/marketing/*`
- Auth: `app/[lang]/(auth)` (split screen with the ink panel)
- App shell + dashboard: `app/[lang]/(app)` + `components/app/*`
- POS: `app/[lang]/(pos)/pos` + `components/pos/*` (full screen, receipt print styles in `globals.css`)
