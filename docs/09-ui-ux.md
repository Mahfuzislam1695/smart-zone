# 09 — UI / UX

## Design direction

Calm, dense and fast: a work tool used 10 hours a day at a counter. Light theme by default, with a dark theme available. Large tap targets on tablet/phone, compact tables on desktop. Bangla text needs about 10–15% more line height than Latin, so set `leading-relaxed` on Bangla body text.

## Component system

- shadcn-style primitives in `components/ui/` (built with `class-variance-authority`, `clsx`, `tailwind-merge`): Button (+ `buttonVariants` for links), Input/Label, Badge, Kbd, Dialog (native `<dialog>`). Add more (Select, Combobox, Sheet, DropdownMenu, Tabs, Toast, Tooltip, DatePicker) from shadcn/ui as modules need them, restyled with the tokens below.
- Icons: lucide-react.
- Tables: TanStack Table with server pagination/sorting via `searchParams`.
- Charts: the dashboard uses a server-rendered SVG chart (`components/app/sales-chart.tsx`). Add Recharts only when interactive charts are needed.

## Design tokens (Tailwind v4)

The theme is **"Khata ink"**. The full palette, type and logo rules are in [13-brand.md](13-brand.md). Tokens live in `app/globals.css` as CSS variables (light + `prefers-color-scheme: dark`), mapped through `@theme inline` to Tailwind classes:

| Class family | Tokens |
|---|---|
| Surfaces | `bg-paper` (page), `bg-surface` (panels), `bg-surface-2` (hover/wells) |
| Text | `text-fg`, `text-muted` |
| Lines | `border-rule`, `border-rule-strong` |
| Brand | `bg-ink`, `text-ink`, `bg-ink-deep`, `bg-ink-soft`, `text-on-ink` |
| Status | `text-due`/`bg-due-soft` (money owed **only**), `text-paid`/`bg-paid-soft`, `text-warn`/`bg-warn-soft` |
| Type scale | `text-2xs` 13, `text-ui` 15, `text-body` 17, `text-h5`…`text-h1`, `text-hero` 64 |
| Fonts | `font-sans` (Noto Sans Bengali), `font-display` (Anek Bangla), `font-hand` (Galada, illustration only), `font-mono` (receipts/IMEI) |
| Helpers | `.nums` (tabular figures), `.type-wide` / `.type-narrow` (Anek width axis), `.khata-ruled`, `.khata-margin`, `.receipt-edge`, `.print-area` |

Components never use raw hex values. Status colors are fixed across the app: unit `IN_STOCK` = paid, `SOLD` = ink/muted, `IN_WARRANTY_SERVICE` = warn, `DAMAGED/LOST` = due. Dues and overdue amounts are always `due`.

## App shell

```
┌──────────────────────────────────────────────────────────────────────┐
│ [≡] SmartZone POS   [Branch: Main ▾]   [Search IMEI/customer… ⌘K]  বাং/EN  👤 │
├────────────┬─────────────────────────────────────────────────────────┤
│ Dashboard  │                                                         │
│ POS        │                    page content                         │
│ Sales      │                                                         │
│ Customers  │                                                         │
│ Inventory  │                                                         │
│ Purchases  │                                                         │
│ Installments│                                                        │
│ After-sales│                                                         │
│ Cash & Exp.│                                                         │
│ Reports    │                                                         │
│ SMS        │                                                         │
│ Settings   │                                                         │
└────────────┴─────────────────────────────────────────────────────────┘
```

- The sidebar collapses to icons on < 1280px and becomes a bottom sheet/drawer on mobile. Menu items are filtered by permissions.
- **Global search (Ctrl/⌘+K):** IMEI/serial → unit page, phone number → customer, invoice number → sale, product name → variant stock.
- Banners at the top for subscription state (trial days left, past-due, read-only) and announcements.
- The static parts of the shell (sidebar structure, labels) render without session data. The user menu, branch switcher and banners stream in behind `<Suspense>` ([03](03-architecture.md#authentication)).

## POS screen (desktop, 1366×768+)

```
┌───────────────────────────────────────────────┬──────────────────────────────┐
│ [▮ Scan IMEI / barcode or search…        ]    │ Customer: [01XXXXXXXXX ▾] +  │
│                                               │ Rahim · Due ৳2,000           │
│ # Item                      IMEI      Qty Price  Disc  Total  │──────────────────────────────│
│ 1 Galaxy A15 8/128 Blue  3561…0123   1  22,500   500 22,000 ✕│ Subtotal          ৳23,350    │
│ 2 Anker 20W Charger          —       1     850     0    850 ✕│ Discount            −৳500    │
│                                               │ Total             ৳22,850    │
│                                               │──────────────────────────────│
│                                               │ [F2 Cash] [F3 bKash] [F4 …]  │
│                                               │ Paid  ৳20,000  Due ৳2,850    │
│                                               │                              │
│ [F6 Hold] [F7 Held carts] [F8 Trade-in]       │ [   F9  PAY & PRINT   ]      │
└───────────────────────────────────────────────┴──────────────────────────────┘
```

**Keyboard map:** `F1` focus scan · `F2–F5` payment methods · `F6` hold · `F7` held carts · `F8` trade-in · `F9` pay/complete · `F10` customer search · `Ctrl+D` discount · `Del` remove line · `Esc` close dialog / back to scan. Show the shortcuts as hints on buttons.

**Behaviour:**
- The scan input re-focuses after every action. Sounds on success/error scans are optional (setting).
- Optimistic line add with a server-validated lookup (< 300 ms target). The UI shows an inline error and plays the error tone on failure.
- Payment dialog: amount defaults to the remaining balance. Cash shows tendered → change. Non-cash shows a TrxID field (required if the method has `requiresTrxId`).
- After completion: print, show a success toast with the invoice number, and the cart resets with the scan box focused.
- Cart state persists in `sessionStorage` per tab, so an accidental refresh doesn't lose the cart.

## Tablet and phone

- **Owner on phone:** the dashboard, reports, due list, customer lookup, IMEI lookup and approvals are fully usable at 360px.
- **POS on tablet:** a single-column layout with the cart on top and a sticky pay bar. A Bluetooth scanner or the camera can be used for scanning (camera barcode scanning via the `BarcodeDetector` API where supported is Phase 2).
- Tables become stacked cards under 640px.

## Forms & feedback

- Zod-validated Server Actions with field errors shown inline in the active language.
- Destructive actions (void, write-off, delete) use a confirm dialog that states what will be reversed. Overrides use the PIN dialog.
- Empty states explain the next step ("No products yet — import CSV or add product").
- Loading uses skeletons matching the final layout (also used as `<Suspense>` fallbacks).

## Accessibility

Visible focus rings, all functions reachable by keyboard, color is never the only status signal (badges have text), AA contrast for text, and `lang` attribute set from the route.
