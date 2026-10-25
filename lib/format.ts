import type { Locale } from "./locales";

// All money is integer paisa (1 BDT = 100 paisa). See docs/07-i18n-printing.md.

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function toLocaleDigits(value: string | number, locale: Locale): string {
  const s = String(value);
  return locale === "bn" ? s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]) : s;
}

function numberFormat(locale: Locale, fractionDigits: number) {
  // Both locales use lakh/crore grouping (12,34,567), as is usual in Bangladesh.
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatMoney(paisa: number, locale: Locale): string {
  const fraction = paisa % 100 === 0 ? 0 : 2;
  const sign = paisa < 0 ? "−" : "";
  return `${sign}৳${numberFormat(locale, fraction).format(Math.abs(paisa) / 100)}`;
}

export function formatNumber(value: number, locale: Locale): string {
  return numberFormat(locale, 0).format(value);
}

export function formatDate(
  date: Date | string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
): string {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    timeZone: "Asia/Dhaka",
    ...options,
  }).format(typeof date === "string" ? new Date(date) : date);
}

/** Parses user-typed taka (Bangla or Latin digits, optional commas) into paisa. Returns 0 for invalid input. */
export function parseTaka(input: string): number {
  const latin = input.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d))).replace(/[,\s৳]/g, "");
  const value = Number.parseFloat(latin);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : 0;
}

/** Groups a 15-digit IMEI as 35 678912 345012 3 for readability. */
export function formatImei(imei: string): string {
  return imei.length === 15 ? `${imei.slice(0, 2)} ${imei.slice(2, 8)} ${imei.slice(8, 14)} ${imei.slice(14)}` : imei;
}
