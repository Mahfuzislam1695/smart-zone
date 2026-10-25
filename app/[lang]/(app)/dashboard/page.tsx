import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarClock, PackageMinus, Wrench } from "lucide-react";
import { SalesChart } from "@/components/app/sales-chart";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { dashboardAlerts, dashboardKpis, recentSales, salesSeries } from "@/lib/demo-data";
import { formatDate, formatImei, formatMoney, formatNumber } from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.meta.dashboard };
}

// Demo "today". Real data will come from the reports queries (docs/02 § M2).
const DEMO_TODAY = "2026-10-25T12:00:00+06:00";

export default async function DashboardPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const d = dict.app.dashboard;
  const money = (p: number) => formatMoney(p, locale);
  const num = (n: number) => formatNumber(n, locale);

  const kpis = [
    { label: d.kpi.sales, value: money(dashboardKpis.sales), note: `${num(dashboardKpis.invoices)} ${d.kpi.invoices}` },
    { label: d.kpi.profit, value: money(dashboardKpis.profit), note: d.kpi.profitNote, tone: "paid" as const },
    { label: d.kpi.cash, value: money(dashboardKpis.cash), note: d.kpi.cashNote },
    { label: d.kpi.dues, value: money(dashboardKpis.dues), note: `${num(dashboardKpis.dueCustomers)} ${d.kpi.duesNote}`, tone: "due" as const },
  ];

  const alerts = [
    { icon: CalendarClock, count: dashboardAlerts.installmentsToday, label: d.alerts.installments, href: "installments", tone: "text-ink" },
    { icon: AlertTriangle, count: dashboardAlerts.overdue, label: d.alerts.overdue, href: "installments", tone: "text-due" },
    { icon: PackageMinus, count: dashboardAlerts.lowStock, label: d.alerts.lowStock, href: "inventory", tone: "text-warn" },
    { icon: Wrench, count: dashboardAlerts.warranty, label: d.alerts.warranty, href: "after-sales", tone: "text-ink" },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-h4 font-semibold">{d.title}</h1>
        <p className="text-ui text-muted">{formatDate(DEMO_TODAY, locale, { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {/* KPI strip: one bordered band, not four floating cards */}
      <section className="mt-6 grid overflow-hidden rounded-lg border border-rule bg-surface sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className={cn(
              "border-rule p-5",
              i > 0 && "border-t sm:border-t-0",
              i % 2 === 1 && "sm:border-l",
              i === 2 && "sm:border-t xl:border-t-0",
              i === 3 && "sm:border-t xl:border-t-0",
              i > 0 && "xl:border-l",
            )}
          >
            <p className="text-2xs text-muted">{k.label}</p>
            <p
              className={cn(
                "nums mt-1.5 font-display text-h4 font-semibold tracking-tight",
                k.tone === "due" && "text-due",
                k.tone === "paid" && "text-paid",
              )}
            >
              {k.value}
            </p>
            <p className="mt-1 text-2xs text-muted">{k.note}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-lg border border-rule bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-sans text-body font-semibold">{d.chartTitle}</h2>
            <p className="text-2xs text-muted">{d.chartSub}</p>
          </div>
          <div className="mt-4">
            <SalesChart series={salesSeries} endDate={DEMO_TODAY} locale={locale} />
          </div>
        </section>

        <section className="rounded-lg border border-rule bg-surface p-5">
          <h2 className="font-sans text-body font-semibold">{d.alertsTitle}</h2>
          <ul className="mt-3 divide-y divide-rule">
            {alerts.map((a) => (
              <li key={a.label}>
                <Link
                  href={`/${locale}/${a.href}`}
                  className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 hover:bg-surface-2"
                >
                  <a.icon className={cn("size-5 shrink-0", a.tone)} strokeWidth={1.9} />
                  <span className="text-ui">
                    <span className={cn("nums font-semibold", a.tone)}>{num(a.count)}</span> {a.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-rule bg-surface">
        <div className="flex items-baseline justify-between px-5 py-4">
          <h2 className="font-sans text-body font-semibold">{d.recentTitle}</h2>
          <Link href={`/${locale}/sales`} className="text-ui text-ink hover:underline">
            {d.viewAll}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-ui">
            <thead>
              <tr className="border-y border-rule bg-paper text-left text-2xs text-muted">
                <th className="px-5 py-2.5 font-medium">{d.table.invoice}</th>
                <th className="px-3 py-2.5 font-medium">{d.table.customer}</th>
                <th className="px-3 py-2.5 font-medium">{d.table.item}</th>
                <th className="px-3 py-2.5 font-medium">{d.table.imei}</th>
                <th className="px-3 py-2.5 text-right font-medium">{d.table.total}</th>
                <th className="px-5 py-2.5 text-right font-medium">{d.table.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {recentSales.map((s) => (
                <tr key={s.invoice} className="hover:bg-paper">
                  <td className="px-5 py-3">
                    <span className="nums font-medium">{s.invoice}</span>
                    <span className="nums block text-2xs text-muted">
                      {formatDate(s.time, locale, { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </td>
                  <td className="px-3 py-3">{s.customer ? s.customer[locale] : <span className="text-muted">{d.walkIn}</span>}</td>
                  <td className="px-3 py-3">{s.item}</td>
                  <td className="nums px-3 py-3 font-mono text-2xs text-muted">{s.imei ? formatImei(s.imei) : "—"}</td>
                  <td className="nums px-3 py-3 text-right font-medium">{money(s.total)}</td>
                  <td className="px-5 py-3 text-right">
                    {s.due > 0 ? (
                      <Badge tone="due">
                        {d.status.due} {money(s.due)}
                      </Badge>
                    ) : (
                      <Badge tone="paid">{d.status.paid}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
