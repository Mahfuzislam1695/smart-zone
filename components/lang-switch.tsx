"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { LOCALE_COOKIE, type Locale } from "@/lib/locales";

export function LangSwitch({
  locale,
  label,
  aria,
  className,
}: {
  locale: Locale;
  label: string;
  aria: string;
  className?: string;
}) {
  const pathname = usePathname();
  const target: Locale = locale === "bn" ? "en" : "bn";
  const href = pathname.replace(/^\/(bn|en)(?=\/|$)/, `/${target}`);

  return (
    <Link
      href={href}
      lang={target}
      aria-label={aria}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
      }}
      className={cn(
        "inline-flex h-9 items-center rounded-md px-2.5 text-2xs font-medium text-muted hover:bg-surface-2 hover:text-fg",
        className,
      )}
    >
      {label}
    </Link>
  );
}
