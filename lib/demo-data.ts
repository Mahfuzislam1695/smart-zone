// DEMO DATA ONLY. Everything the marketing page, dashboard and POS show until the database is wired up.
// Money is integer paisa. Names are fictional.

type L10n = { bn: string; en: string };

// ── Landing: IMEI scan demo ─────────────────────────────────────────────────

export type DemoUnitEvent = { date: string; kind: "purchase" | "sale" | "warranty"; text: L10n };

export type DemoUnit = {
  imei: string;
  model: string;
  variant: string;
  status: "sold" | "inStock";
  events: DemoUnitEvent[];
  cost: number;
  price?: number;
  paid?: number;
  invoice?: string;
  customer?: L10n;
};

export const demoUnits: DemoUnit[] = [
  {
    imei: "356789123450123",
    model: "Samsung Galaxy A15",
    variant: "8/128 Blue",
    status: "sold",
    cost: 1980000,
    price: 2200000,
    paid: 2000000,
    invoice: "MN-26-001842",
    customer: { bn: "রহিম মিয়া", en: "Rahim Mia" },
    events: [
      {
        date: "2026-10-12",
        kind: "purchase",
        text: { bn: "কেনা হয়েছে মোবাইল হাউস, ঢাকা থেকে। ক্রয়মূল্য ৳১৯,৮০০", en: "Bought from Mobile House, Dhaka for ৳19,800" },
      },
      {
        date: "2026-10-20",
        kind: "sale",
        text: { bn: "বিক্রি রহিম মিয়াকে, ৳২২,০০০। বাকি ৳২,০০০", en: "Sold to Rahim Mia for ৳22,000. ৳2,000 due" },
      },
      {
        date: "2027-10-20",
        kind: "warranty",
        text: { bn: "ওয়ারেন্টি এই তারিখ পর্যন্ত", en: "Under warranty until this date" },
      },
    ],
  },
  {
    imei: "862145098765437",
    model: "Xiaomi Redmi Note 14",
    variant: "8/256 Midnight Black",
    status: "inStock",
    cost: 2490000,
    price: 2799900,
    events: [
      {
        date: "2026-10-22",
        kind: "purchase",
        text: { bn: "কেনা হয়েছে টেক ডিস্ট্রিবিউশন থেকে। ক্রয়মূল্য ৳২৪,৯০০", en: "Bought from Tech Distribution for ৳24,900" },
      },
    ],
  },
];

// ── Landing: khata vs app ───────────────────────────────────────────────────

export const demoDues: { name: L10n; phone: string; amount: number; days: number; scrawl: L10n }[] = [
  { name: { bn: "সুমন", en: "Sumon" }, phone: "01819-224466", amount: 860000, days: 41, scrawl: { bn: "সুমন — ৮৬০০ কিস্তি ২য়", en: "Sumon — 8600 inst. 2nd" } },
  { name: { bn: "রহিম মিয়া", en: "Rahim Mia" }, phone: "01712-345678", amount: 200000, days: 5, scrawl: { bn: "রহিম A15 — ২০০০", en: "Rahim A15 — 2000" } },
  { name: { bn: "করিম ভাই", en: "Karim bhai" }, phone: "01911-556677", amount: 155000, days: 23, scrawl: { bn: "করিম ভাই ১৫৫০ ?", en: "Karim bhai 1550 ?" } },
  { name: { bn: "নাসরিন আপা", en: "Nasrin apa" }, phone: "01611-998877", amount: 45000, days: 12, scrawl: { bn: "নাসরিন কভার+চার্জার ৪৫০", en: "Nasrin cover+charger 450" } },
];

// ── Pricing (mirrors docs/06-saas-billing.md) ───────────────────────────────

export type PlanId = "starter" | "growth" | "pro";

export const plans: {
  id: PlanId;
  price: number;
  branches: number;
  users: number;
  products: number | null;
  sms: number;
  transfers: boolean;
  roles: boolean;
  reports: "basic" | "full";
  featured?: boolean;
}[] = [
  { id: "starter", price: 79900, branches: 1, users: 3, products: 1000, sms: 100, transfers: false, roles: false, reports: "basic" },
  { id: "growth", price: 149900, branches: 3, users: 10, products: 10000, sms: 500, transfers: true, roles: true, reports: "full", featured: true },
  { id: "pro", price: 299900, branches: 10, users: 30, products: null, sms: 1500, transfers: true, roles: true, reports: "full" },
];

// ── Dashboard ───────────────────────────────────────────────────────────────

export const dashboardKpis = {
  sales: 18450000,
  invoices: 12,
  profit: 2135000,
  cash: 6230000,
  dues: 34820000,
  dueCustomers: 37,
};

/** Daily sales for the last 30 days, oldest first (paisa). */
export const salesSeries: number[] = [
  9200000, 11800000, 8400000, 13100000, 15600000, 21400000, 7600000, 10200000, 12900000, 9800000, 14300000, 16700000,
  23800000, 8100000, 11500000, 13600000, 10900000, 15200000, 17400000, 25100000, 9400000, 12200000, 14800000, 11700000,
  16100000, 19300000, 26800000, 10800000, 13900000, 18450000,
];

export const dashboardAlerts = { installmentsToday: 6, overdue: 3, lowStock: 9, warranty: 2 };

export const recentSales: {
  invoice: string;
  time: string;
  customer: L10n | null;
  item: string;
  imei: string | null;
  total: number;
  due: number;
}[] = [
  { invoice: "MN-26-001853", time: "2026-10-25T10:42:00+06:00", customer: { bn: "শাহীন আলম", en: "Shahin Alam" }, item: "Redmi Note 14 8/256", imei: "862145098765411", total: 2799900, due: 0 },
  { invoice: "MN-26-001852", time: "2026-10-25T10:15:00+06:00", customer: null, item: "Anker 20W Charger", imei: null, total: 145000, due: 0 },
  { invoice: "MN-26-001851", time: "2026-10-25T09:58:00+06:00", customer: { bn: "রহিম মিয়া", en: "Rahim Mia" }, item: "Galaxy A15 8/128", imei: "356789123450123", total: 2200000, due: 200000 },
  { invoice: "MN-26-001850", time: "2026-10-25T09:31:00+06:00", customer: { bn: "মিতু রায়", en: "Mitu Roy" }, item: "realme C75 6/128", imei: "861234567890128", total: 1799900, due: 0 },
  { invoice: "MN-26-001849", time: "2026-10-25T09:12:00+06:00", customer: { bn: "সুমন", en: "Sumon" }, item: "iPhone 13 128GB (used)", imei: "353912110987654", total: 5800000, due: 1500000 },
];

// ── POS catalog ─────────────────────────────────────────────────────────────

export type PosProduct = {
  code: string; // IMEI for serialized units, barcode for quantity items
  kind: "unit" | "qty";
  name: string;
  variant: string;
  price: number;
  warrantyMonths: number;
};

export const posCatalog: PosProduct[] = [
  { code: "356789123450131", kind: "unit", name: "Samsung Galaxy A15", variant: "8/128 Blue", price: 2250000, warrantyMonths: 12 },
  { code: "862145098765437", kind: "unit", name: "Xiaomi Redmi Note 14", variant: "8/256 Black", price: 2799900, warrantyMonths: 12 },
  { code: "861234567890136", kind: "unit", name: "realme C75", variant: "6/128 Gold", price: 1799900, warrantyMonths: 12 },
  { code: "353912110987662", kind: "unit", name: "iPhone 13 (used, A)", variant: "128GB Midnight", price: 5800000, warrantyMonths: 3 },
  { code: "2000000000015", kind: "qty", name: "Anker 20W Charger", variant: "USB-C", price: 145000, warrantyMonths: 6 },
  { code: "2000000000022", kind: "qty", name: "Type-C Cable", variant: "1m", price: 35000, warrantyMonths: 0 },
  { code: "2000000000039", kind: "qty", name: "Silicone Cover", variant: "A15", price: 25000, warrantyMonths: 0 },
  { code: "2000000000046", kind: "qty", name: "Tempered Glass", variant: "A15", price: 20000, warrantyMonths: 0 },
];

export const posCustomers: { id: string; name: L10n; phone: string; previousDue: number }[] = [
  { id: "c1", name: { bn: "রহিম মিয়া", en: "Rahim Mia" }, phone: "01712-345678", previousDue: 200000 },
  { id: "c2", name: { bn: "মিতু রায়", en: "Mitu Roy" }, phone: "01556-123987", previousDue: 0 },
  { id: "c3", name: { bn: "সুমন", en: "Sumon" }, phone: "01819-224466", previousDue: 860000 },
];

export const demoShop = {
  name: { bn: "নিউ মডেল মোবাইল", en: "New Model Mobile" },
  address: { bn: "স্টেশন রোড, উলিপুর, কুড়িগ্রাম", en: "Station Road, Ulipur, Kurigram" },
  phone: "01XXX-XXXXXX",
};
