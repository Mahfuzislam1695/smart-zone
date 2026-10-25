import Link from "next/link";
import {
  ArrowLeftRight,
  BadgePercent,
  Building2,
  CalendarClock,
  Check,
  Minus,
  Phone,
  Plus,
  Printer,
  ScanLine,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { ImeiDemo } from "@/components/marketing/imei-demo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { demoDues, demoShop, demoUnits, plans } from "@/lib/demo-data";
import { formatMoney, formatNumber, toLocaleDigits } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";
import { site } from "@/lib/site";

type Props = { dict: Dictionary; locale: Locale };

// ── Hero: the khata page with a live IMEI scan ─────────────────────────────

export function Hero({ dict, locale }: Props) {
  return (
    <section
      id="demo"
      className="khata-ruled khata-margin relative overflow-hidden border-b border-rule bg-surface [--margin-x:1rem] sm:[--margin-x:2.5rem] lg:[--margin-x:max(2.5rem,calc((100vw-72rem)/2-1rem))]"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-52 lg:pt-24">
        <div className="pl-4 sm:pl-6 lg:pl-8">
          <h1 className="type-wide max-w-[13ch] text-[2.6rem] font-bold leading-[1.05] tracking-[-0.02em] text-fg sm:text-h1 lg:text-hero">
            {dict.hero.title}
          </h1>
          <p className="mt-6 max-w-[52ch] text-body text-muted">{dict.hero.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/${locale}/signup`} className={buttonVariants({ size: "lg" })}>
              {dict.hero.primary}
            </Link>
            <Link href={`/${locale}/dashboard`} className={buttonVariants({ size: "lg", variant: "secondary" })}>
              {dict.hero.secondary}
            </Link>
          </div>
          <p className="mt-4 text-2xs text-muted">{dict.hero.note}</p>
        </div>

        <div className="lg:pt-2">
          <ImeiDemo dict={dict.demo} locale={locale} units={demoUnits} shopName={demoShop.name[locale]} />
        </div>
      </div>
    </section>
  );
}

// ── Khata vs SmartZone ─────────────────────────────────────────────────────

export function KhataVs({ dict, locale }: Props) {
  const sorted = [...demoDues].sort((a, b) => b.amount - a.amount);
  const total = sorted.reduce((s, d) => s + d.amount, 0);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="max-w-2xl">
        <h2 className="text-h3 font-semibold sm:text-h2">{dict.khata.title}</h2>
        <p className="mt-4 text-body text-muted">{dict.khata.sub}</p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <figure>
          <div
            className="khata-ruled khata-margin relative h-[22rem] overflow-hidden rounded-sm border border-rule bg-[#fbfcff] pl-14 pt-[2.15rem] shadow-lift [--khata-line:#c9d6f2] [--margin-x:2.75rem] dark:bg-[#f3f5fb]"
            aria-hidden
          >
            {demoDues.map((d, i) => (
              <p
                key={i}
                className={cn(
                  "font-hand text-[1.45rem] leading-[40px] text-[#24399a]",
                  i === 2 && "line-through decoration-[#24399a]/60",
                )}
                style={{ transform: `rotate(${[-1.2, 0.8, -0.4, 1.4][i]}deg)` }}
              >
                {d.scrawl[locale]}
              </p>
            ))}
            <p className="font-hand text-[1.45rem] leading-[40px] text-[#24399a]/40">
              {locale === "bn" ? "মিজান — ??" : "Mizan — ??"}
            </p>
          </div>
          <figcaption className="mt-3 text-ui text-muted">{dict.khata.paperCaption}</figcaption>
        </figure>

        <figure>
          <div className="overflow-hidden rounded-lg border border-rule bg-surface shadow-lift">
            <div className="flex items-baseline justify-between border-b border-rule px-5 py-4">
              <p className="font-display text-h5 font-semibold">{dict.khata.appTitle}</p>
              <p className="text-2xs text-muted">
                {dict.khata.total} <span className="nums text-ui font-semibold text-due">{formatMoney(total, locale)}</span>
              </p>
            </div>
            <ul className="divide-y divide-rule">
              {sorted.map((d) => (
                <li key={d.phone} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ui font-medium">{d.name[locale]}</p>
                    <p className="nums text-2xs text-muted">
                      {toLocaleDigits(d.phone, locale)} · {formatNumber(d.days, locale)} {dict.khata.days}
                    </p>
                  </div>
                  <p className="nums text-ui font-semibold text-due">{formatMoney(d.amount, locale)}</p>
                  <span className="hidden rounded-md border border-rule-strong px-2.5 py-1 text-2xs text-fg sm:inline">
                    {dict.khata.remind}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <figcaption className="mt-3 text-ui text-muted">{dict.khata.appCaption}</figcaption>
        </figure>
      </div>
    </section>
  );
}

// ── A day at the counter (a real sequence: times are the markers) ──────────

export function DayTimeline({ dict }: Props) {
  return (
    <section className="border-y border-rule bg-surface">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:py-28">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-h3 font-semibold sm:text-h2">{dict.day.title}</h2>
          <p className="mt-4 max-w-md text-body text-muted">{dict.day.sub}</p>
        </div>
        <ol className="relative border-l-2 border-ink/25 pl-0">
          {dict.day.steps.map((s, i) => (
            <li key={i} className="relative grid gap-1 pb-10 pl-8 last:pb-0 sm:grid-cols-[8.5rem_1fr] sm:gap-6">
              <span className="absolute -left-[7px] top-2 size-3 rounded-full border-2 border-surface bg-ink" aria-hidden />
              <p className="type-narrow nums font-display text-h5 font-semibold text-ink">{s.time}</p>
              <div>
                <p className="text-body font-semibold">{s.title}</p>
                <p className="mt-1 max-w-[56ch] text-ui text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── Features ───────────────────────────────────────────────────────────────

const featureIcons = [ScanLine, CalendarClock, ArrowLeftRight, ShieldCheck, BadgePercent, Printer, Building2, UserCog];

export function Features({ dict }: Props) {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
      <div className="max-w-2xl">
        <h2 className="text-h3 font-semibold sm:text-h2">{dict.features.title}</h2>
        <p className="mt-4 text-body text-muted">{dict.features.sub}</p>
      </div>
      <dl className="mt-14 grid gap-x-16 gap-y-10 md:grid-cols-2">
        {dict.features.items.map((f, i) => {
          const Icon = featureIcons[i];
          return (
            <div key={i} className="flex gap-4">
              <Icon className="mt-1 size-6 shrink-0 text-ink" strokeWidth={1.75} aria-hidden />
              <div>
                <dt className="text-body font-semibold">{f.title}</dt>
                <dd className="mt-1 max-w-[48ch] text-ui text-muted">{f.body}</dd>
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────

export function Pricing({ dict, locale }: Props) {
  const p = dict.pricing;
  const n = (v: number) => formatNumber(v, locale);
  const yes = <Check className="size-4 text-paid" aria-label="✓" />;
  const no = <Minus className="size-4 text-muted/60" aria-label="—" />;

  const rows: { label: string; value: (plan: (typeof plans)[number]) => React.ReactNode }[] = [
    { label: p.rows.branches, value: (pl) => n(pl.branches) },
    { label: p.rows.users, value: (pl) => n(pl.users) },
    { label: p.rows.products, value: (pl) => (pl.products === null ? p.unlimited : n(pl.products)) },
    { label: p.rows.sms, value: (pl) => n(pl.sms) },
    { label: p.rows.imei, value: () => yes },
    { label: p.rows.transfers, value: (pl) => (pl.transfers ? yes : no) },
    { label: p.rows.roles, value: (pl) => (pl.roles ? yes : no) },
    { label: p.rows.reports, value: (pl) => (pl.reports === "full" ? p.full : p.basic) },
  ];

  return (
    <section id="pricing" className="scroll-mt-20 border-t border-rule bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <h2 className="text-h3 font-semibold sm:text-h2">{p.title}</h2>
          <p className="mt-4 text-body text-muted">{p.sub}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3 md:gap-0">
          {plans.map((pl) => (
            <div
              key={pl.id}
              className={cn(
                "flex flex-col rounded-lg border p-6 md:rounded-none md:border-y md:border-r-0 md:first:rounded-l-lg md:last:rounded-r-lg md:last:border-r",
                pl.featured
                  ? "relative z-10 border-2 border-ink md:-my-3 md:rounded-lg md:border-2 md:border-r-2 md:py-9"
                  : "border-rule",
              )}
            >
              <p className="font-display text-h5 font-semibold">{p.plans[pl.id].name}</p>
              <p className="text-2xs text-muted">{p.plans[pl.id].blurb}</p>
              {pl.featured && <p className="mt-2 text-2xs font-medium text-ink">{p.popular}</p>}
              <p className="mt-5 flex items-baseline gap-1">
                <span className="nums font-display text-h3 font-bold">{formatMoney(pl.price, locale)}</span>
                <span className="text-ui text-muted">{p.perMonth}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-ui">
                {rows.map((r) => (
                  <li key={r.label} className="flex items-center justify-between gap-4">
                    <span className="text-muted">{r.label}</span>
                    <span className="nums shrink-0 font-medium">{r.value(pl)}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/${locale}/signup?plan=${pl.id}`}
                className={buttonVariants({ variant: pl.featured ? "primary" : "secondary", className: "mt-8 w-full" })}
              >
                {p.choose}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-8 text-ui text-muted">{p.yearlyNote}</p>
      </div>
    </section>
  );
}

// ── FAQ ────────────────────────────────────────────────────────────────────

export function Faq({ dict }: Props) {
  return (
    <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-20 gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2fr] lg:py-28">
      <h2 className="text-h3 font-semibold sm:text-h2">{dict.faq.title}</h2>
      <div className="divide-y divide-rule border-y border-rule">
        {dict.faq.items.map((item, i) => (
          <details key={i} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-body font-medium [&::-webkit-details-marker]:hidden">
              {item.q}
              <Plus className="size-5 shrink-0 text-ink transition-transform group-open:rotate-45" aria-hidden />
            </summary>
            <p className="max-w-[62ch] pb-5 text-ui text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ── Closing call to action ─────────────────────────────────────────────────

export function ClosingCta({ dict, locale }: Props) {
  return (
    <section className="bg-ink-deep text-white dark:bg-[#132a80]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-20">
        <div className="max-w-xl">
          <h2 className="type-wide text-h3 font-bold sm:text-h2">{dict.cta.title}</h2>
          <p className="mt-3 text-body text-white/75">{dict.cta.sub}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/${locale}/signup`} className={buttonVariants({ variant: "onInk", size: "lg" })}>
            {dict.cta.primary}
          </Link>
          <a
            href={`tel:${site.phone}`}
            className={buttonVariants({
              size: "lg",
              className: "border border-white/40 bg-transparent text-white hover:bg-white/10",
            })}
          >
            <Phone aria-hidden />
            {dict.cta.call}
          </a>
        </div>
      </div>
    </section>
  );
}
