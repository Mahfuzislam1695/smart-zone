import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, getLocale, type Dictionary } from "@/lib/i18n";

export type ModuleKey = keyof Dictionary["app"]["modules"];

/** Shown for modules that aren't built yet. Names the module and its roadmap phase (docs/10-roadmap.md). */
export async function ModulePlaceholder({ module }: { module: ModuleKey }) {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const m = dict.app.modules[module];
  const p = dict.app.placeholder;
  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-h4 font-semibold">{m.title}</h1>
      <div className="khata-ruled khata-margin mt-6 rounded-lg border border-rule bg-surface px-6 py-14 pl-16 [--margin-x:2.5rem] sm:pl-20 sm:[--margin-x:3.5rem]">
        <LogoMark className="size-12" />
        <p className="mt-6 max-w-[48ch] text-body">{m.body}</p>
        <p className="mt-2 text-ui text-muted">{p.body}</p>
        <p className="mt-4 flex flex-wrap items-center gap-2 text-2xs text-muted">
          {p.phase}: <Badge tone="ink">{m.phase}</Badge>
          <span>{p.spec}</span>
        </p>
        <Link href={`/${locale}/dashboard`} className={buttonVariants({ variant: "secondary", className: "mt-8" })}>
          {p.back}
        </Link>
      </div>
    </div>
  );
}
