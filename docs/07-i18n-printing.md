# 07 — Internationalization, Formatting & Printing

## Languages

- **bn (default)** and **en**. Every UI string, invoice, report, SMS template and error message exists in both.
- Routing: `app/[lang]/…` root segment, read via `next/root-params` ([03](03-architecture.md#internationalization)).
- Dictionaries: `dictionaries/bn.json` and `dictionaries/en.json`, nested by module (`pos.pay`, `inventory.unitStatus.SOLD`, `errors.UNIT_NOT_AVAILABLE`). Key parity is enforced by a unit test (every key exists in both files).
- User data stays as entered. Master data has optional `nameBn` fields (category, product, branch, payment method). The UI shows `nameBn ?? name` in bn and `name` in en.
- The **invoice language** is a tenant setting, independent of the cashier's UI language, and can be overridden per print.

## Number, currency & date formatting

All formatting goes through `lib/format.ts`. Components never call `toFixed` or `toLocaleString` directly.

| What | bn | en |
|------|----|----|
| Digits | Bangla (০১২৩৪৫৬৭৮৯) if `settings.digits = "bn"`, else Latin | Latin |
| Grouping | Lakh/crore: `১২,৩৪,৫৬৭` | Lakh/crore: `12,34,567` (common in BD) |
| Currency | `৳১২,৩৪৫` (no decimals when paisa = 0, else 2) | `৳12,345.50` |
| Date | `২৫ অক্টো ২০২৬` / short `২৫/১০/২০২৬` | `25 Oct 2026` / `25/10/2026` |
| Time | 12-hour `বিকাল ৩:৪০` | `3:40 PM` |

```ts
// lib/format.ts (sketch)
export const formatMoney = (paisa: number, locale: 'bn' | 'en', digits: 'bn' | 'en') =>
  '৳' + new Intl.NumberFormat(digits === 'bn' ? 'bn-BD' : 'en-IN', {
    minimumFractionDigits: paisa % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(paisa / 100)
```

- Dates are always formatted with `timeZone: 'Asia/Dhaka'`.
- **Input:** money and number inputs accept both Bangla and Latin digits and normalize to Latin before parsing (`lib/money.ts → parseTaka("১,২০০.৫০") → 120050`).
- **Amount in words** on invoices: "এক লক্ষ বিশ হাজার টাকা মাত্র" / "One Lakh Twenty Thousand Taka Only" (`lib/amount-in-words.ts`, unit-tested).

## Phone numbers

`lib/phone.ts`: normalizes `01XXXXXXXXX`, `8801…` and `+8801…` to E.164 `+8801XXXXXXXXX`. It validates the operator prefix (013–019) and displays the number as `01XXX-XXXXXX`.

## Fonts

- Bengali: **Noto Sans Bengali** (UI) via `next/font/google` with `subsets: ['bengali', 'latin']`, exposed as a CSS variable in the root layout. Hind Siliguri is an alternative for headings. Latin: Geist (already configured).
- Print pages use the same fonts, loaded before printing, and printing waits for `document.fonts.ready`.

## Printing

Printing is **browser-based**: dedicated print routes under `app/[lang]/(app)/print/…` render a print-only layout and call `window.print()` once loaded.

| Document | Formats |
|----------|---------|
| Sales invoice | 80mm thermal (default), 58mm, A4 |
| Due collection / installment receipt | 80mm, A4 |
| Return receipt, warranty claim slip, trade-in agreement (with seller NID, signature lines) | 80mm, A4 |
| Customer statement, supplier ledger, reports | A4 |
| Purchase, transfer note, quotation | A4 |
| Barcode labels | Label printer sizes (see below) |

**Thermal (80mm) rules:** `@page { size: 80mm auto; margin: 0 }`, 72mm printable width, monochrome, 12–13px base font, no backgrounds, logo converted to 1-bit-friendly PNG, and IMEIs printed in full (monospace).

**Silent printing at the counter:** recommend Chrome launched with `--kiosk-printing`, with the thermal printer set as the default printer. The print dialog is skipped and the invoice prints right after the sale. Document this in the shop setup guide. Raw ESC/POS printing (cash drawer kick, faster) via **QZ Tray** is a Phase 4 option.

**Cash drawer:** most drawers open via the thermal printer's kick-out port when a print job arrives (configure in the printer driver: "open drawer before printing").

## Barcode labels

- Generated client-side with **JsBarcode** (Code128) on a print page.
- Label sizes: 38×25mm and 50×25mm (common Xprinter/TSC rolls), with an A4 sheet option (e.g. 3×10).
- Label content:
  - Non-serialized variants: shop name, product + variant, price, barcode = variant barcode (or SKU).
  - Serialized units: product + variant, price, barcode = IMEI1.
- Products without a manufacturer barcode get an internal barcode `2` + 11 digits + EAN-13 check digit (in-store range), assigned on creation.

## Scanners

- USB/Bluetooth barcode scanners in **keyboard-wedge mode** (they type characters followed by Enter). No driver integration is needed.
- POS scan input: an always-focused input. A sequence of keystrokes arriving < 30 ms apart and ending with Enter is treated as a **scan** (vs. typing). The scan resolves in this order: exact IMEI/serial → barcode → SKU. If none match, it runs a text search.
- Scanning an IMEI that is already in the cart → "already added". Sold → "sold on INV-… to …". Unknown → offer "receive as trade-in / add via purchase" (with permission).
- Phones show the IMEI barcode on the box label and via `*#06#`. Box labels usually have both IMEI barcodes, so purchase entry captures IMEI1 and IMEI2 in sequence for dual-SIM variants (the UI expects two scans per unit when the variant is marked dual-SIM).
