import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LangSwitch } from "@/components/lang-switch";
import { buttonVariants } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";

export function MarketingHeader({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const links = [
    { href: "#features", label: dict.nav.features },
    { href: "#pricing", label: dict.nav.pricing },
    { href: "#faq", label: dict.nav.faq },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href={`/${locale}`} className="text-[15px]" aria-label="SmartZone POS">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-md px-3 py-2 text-ui text-muted hover:text-fg">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <LangSwitch locale={locale} label={dict.lang.label} aria={dict.lang.aria} />
          <Link
            href={`/${locale}/login`}
            className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}
          >
            {dict.nav.login}
          </Link>
          <Link href={`/${locale}/signup`} className={buttonVariants({ size: "sm", className: "hidden sm:inline-flex" })}>
            {dict.nav.trial}
          </Link>

          {/* Mobile menu without client JS */}
          <details className="group relative md:hidden">
            <summary
              className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md hover:bg-surface-2 [&::-webkit-details-marker]:hidden"
              aria-label={dict.nav.menu}
            >
              <Menu className="size-5" />
            </summary>
            <div className="absolute right-0 top-11 w-60 rounded-lg border border-rule bg-surface p-2 shadow-lift">
              {links.map((l) => (
                <a key={l.href} href={l.href} className="block rounded-md px-3 py-2.5 text-ui hover:bg-surface-2">
                  {l.label}
                </a>
              ))}
              <div className="my-2 h-px bg-rule" />
              <Link href={`/${locale}/login`} className="block rounded-md px-3 py-2.5 text-ui hover:bg-surface-2">
                {dict.nav.login}
              </Link>
              <Link href={`/${locale}/signup`} className={buttonVariants({ className: "mt-1 w-full" })}>
                {dict.nav.trial}
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
