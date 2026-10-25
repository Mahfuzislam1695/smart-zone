import Link from "next/link";
import { cacheLife } from "next/cache";
import { Logo } from "@/components/brand/logo";
import { toLocaleDigits } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";
import { site } from "@/lib/site";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function MarketingFooter({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const year = await currentYear();
  const col = "space-y-2.5 text-ui";
  const heading = "mb-3 text-2xs font-medium text-fg";
  const link = "text-muted hover:text-fg";

  return (
    <footer className="border-t border-rule bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[2fr_1fr_1fr_1.3fr]">
        <div>
          <Logo className="text-[15px]" />
          <p className="mt-4 max-w-xs text-ui text-muted">{dict.footer.tagline}</p>
        </div>
        <div>
          <p className={heading}>{dict.footer.product}</p>
          <ul className={col}>
            <li><a href="#features" className={link}>{dict.nav.features}</a></li>
            <li><a href="#pricing" className={link}>{dict.nav.pricing}</a></li>
            <li><a href="#faq" className={link}>{dict.nav.faq}</a></li>
            <li><Link href={`/${locale}/login`} className={link}>{dict.nav.login}</Link></li>
          </ul>
        </div>
        <div>
          <p className={heading}>{dict.footer.company}</p>
          <ul className={col}>
            <li><span className="text-muted">{dict.footer.about}</span></li>
            <li><span className="text-muted">{dict.footer.privacy}</span></li>
            <li><span className="text-muted">{dict.footer.terms}</span></li>
          </ul>
        </div>
        <div>
          <p className={heading}>{dict.footer.contact}</p>
          <ul className={col}>
            <li><a href={`tel:${site.phone}`} className={`nums ${link}`}>{toLocaleDigits(site.phoneDisplay, locale)}</a></li>
            <li><a href={`mailto:${site.email}`} className={link}>{site.email}</a></li>
            <li><a href={site.whatsapp} className={link}>WhatsApp</a></li>
            <li><a href={site.facebook} className={link}>Facebook</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-rule">
        <p className="mx-auto max-w-6xl px-4 py-5 text-2xs text-muted sm:px-6">
          © {toLocaleDigits(year, locale)} {site.name}. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
