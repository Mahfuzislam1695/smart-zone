"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Boxes,
  CalendarClock,
  ChartColumn,
  ChevronDown,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  ReceiptText,
  RotateCcw,
  ScanBarcode,
  Search,
  Settings,
  Truck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { LangSwitch } from "@/components/lang-switch";
import { Kbd } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";

type NavKey = keyof Dictionary["app"]["nav"];
type GroupKey = keyof Dictionary["app"]["navGroups"];

const navGroups: { group: GroupKey | null; items: { key: NavKey; href: string; icon: LucideIcon }[] }[] = [
  {
    group: null,
    items: [
      { key: "dashboard", href: "dashboard", icon: LayoutDashboard },
      { key: "pos", href: "pos", icon: ScanBarcode },
    ],
  },
  {
    group: "sell",
    items: [
      { key: "sales", href: "sales", icon: ReceiptText },
      { key: "customers", href: "customers", icon: Users },
      { key: "installments", href: "installments", icon: CalendarClock },
      { key: "afterSales", href: "after-sales", icon: RotateCcw },
    ],
  },
  {
    group: "stock",
    items: [
      { key: "inventory", href: "inventory", icon: Boxes },
      { key: "purchases", href: "purchases", icon: Truck },
    ],
  },
  {
    group: "money",
    items: [
      { key: "cash", href: "cash", icon: Wallet },
      { key: "reports", href: "reports", icon: ChartColumn },
      { key: "sms", href: "sms", icon: MessageSquareText },
    ],
  },
  { group: "admin", items: [{ key: "settings", href: "settings", icon: Settings }] },
];

function SidebarNav({
  locale,
  app,
  compact,
  onNavigate,
}: {
  locale: Locale;
  app: Dictionary["app"];
  compact: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="App" className="flex-1 overflow-y-auto px-3 pb-6">
      {navGroups.map((g, gi) => (
        <div key={gi} className={cn(gi > 0 && "mt-5")}>
          {g.group && (
            <p className={cn("mb-1.5 px-3 text-[12px] text-muted", compact && "xl:block hidden")}>
              {app.navGroups[g.group]}
            </p>
          )}
          {g.group && compact && <div className="mx-3 mb-2 h-px bg-rule xl:hidden" />}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const href = `/${locale}/${item.href}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    title={compact ? app.nav[item.key] : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-10 items-center gap-3 rounded-md px-3 text-ui transition-colors",
                      active ? "bg-ink-soft font-medium text-ink" : "text-muted hover:bg-surface-2 hover:text-fg",
                      compact && "justify-center xl:justify-start",
                    )}
                  >
                    {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-ink" aria-hidden />}
                    <Icon className="size-[18px] shrink-0" strokeWidth={1.9} />
                    <span className={cn("truncate", compact && "hidden xl:inline")}>{app.nav[item.key]}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({
  locale,
  app,
  lang,
  children,
}: {
  locale: Locale;
  app: Dictionary["app"];
  lang: Dictionary["lang"];
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar: icons only from lg, full labels from xl */}
      <aside className="sticky top-0 hidden h-dvh w-[72px] shrink-0 flex-col border-r border-rule bg-surface lg:flex xl:w-[248px]">
        <Link href={`/${locale}/dashboard`} className="flex h-16 items-center px-5 text-[14px]">
          <LogoMark className="size-8 xl:hidden" title="SmartZone POS" />
          <Logo className="hidden xl:inline-flex" />
        </Link>
        <SidebarNav locale={locale} app={app} compact />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-[#0b1230]/50"
            aria-label={app.closeMenu}
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-surface shadow-lift">
            <div className="flex h-16 items-center justify-between px-5 text-[14px]">
              <Logo />
              <button
                className="flex size-9 items-center justify-center rounded-md hover:bg-surface-2"
                aria-label={app.closeMenu}
                onClick={() => setDrawerOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarNav locale={locale} app={app} compact={false} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-rule bg-surface/90 px-4 backdrop-blur-md sm:px-6">
          <button
            className="flex size-9 items-center justify-center rounded-md hover:bg-surface-2 lg:hidden"
            aria-label={app.openMenu}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-5" />
          </button>

          <button className="flex h-9 items-center gap-2 rounded-md border border-rule px-3 text-ui hover:border-rule-strong">
            <span className="hidden text-2xs text-muted sm:inline">{app.branchLabel}</span>
            <span className="font-medium">{app.branch}</span>
            <ChevronDown className="size-4 text-muted" />
          </button>

          <label className="relative hidden max-w-md flex-1 md:block">
            <span className="sr-only">{app.search}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder={app.search}
              className="h-9 w-full rounded-md border border-rule bg-paper pl-9 pr-12 text-ui placeholder:text-muted focus-visible:border-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ink/20"
            />
            <Kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">Ctrl K</Kbd>
          </label>

          <div className="ml-auto flex items-center gap-2">
            <LangSwitch locale={locale} label={lang.label} aria={lang.aria} />
            <Link href={`/${locale}/pos`} className={buttonVariants({ size: "sm" })}>
              <ScanBarcode aria-hidden />
              <span className="hidden sm:inline">{app.openPos}</span>
            </Link>
            <div className="ml-1 flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-ink-soft font-display text-ui font-semibold text-ink">
                {app.userName.slice(0, 1)}
              </span>
              <span className="hidden leading-tight xl:block">
                <span className="block text-ui font-medium">{app.userName}</span>
                <span className="block text-2xs text-muted">{app.userRole}</span>
              </span>
            </div>
          </div>
        </header>

        <p className="border-b border-warn/20 bg-warn-soft px-4 py-1.5 text-2xs text-warn sm:px-6">{app.demoBanner}</p>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
