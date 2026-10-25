import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function NotFound() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md">
        <LogoMark className="size-14" />
        <h1 className="mt-6 text-h3 font-semibold">{dict.notFound.title}</h1>
        <p className="mt-2 text-body text-muted">{dict.notFound.body}</p>
        <Link href={`/${locale}`} className={buttonVariants({ className: "mt-6" })}>
          {dict.notFound.home}
        </Link>
      </div>
    </main>
  );
}
