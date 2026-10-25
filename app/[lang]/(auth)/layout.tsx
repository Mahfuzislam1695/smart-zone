import Link from "next/link";
import { Logo, LogoMark } from "@/components/brand/logo";
import { LangSwitch } from "@/components/lang-switch";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function AuthLayout({ children }: LayoutProps<"/[lang]">) {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col bg-surface px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href={`/${locale}`} className="text-[15px]">
            <Logo />
          </Link>
          <LangSwitch locale={locale} label={dict.lang.label} aria={dict.lang.aria} />
        </div>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</main>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink-deep text-white lg:flex lg:flex-col lg:justify-end lg:p-14 dark:bg-[#132a80]">
        <div
          className="khata-ruled absolute inset-0 opacity-30 [--khata-line:rgb(255_255_255/0.18)]"
          aria-hidden
        />
        <LogoMark tone="white" className="absolute right-14 top-14 size-40 opacity-95" />
        <div className="relative max-w-md">
          <p className="type-wide font-display text-h2 font-bold leading-tight">{dict.auth.panelLine}</p>
          <p className="mt-4 text-body text-white/75">{dict.auth.panelSub}</p>
        </div>
      </aside>
    </div>
  );
}
