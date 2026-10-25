import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingHeader } from "@/components/marketing/header";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function MarketingLayout({ children }: LayoutProps<"/[lang]">) {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return (
    <>
      <MarketingHeader dict={dict} locale={locale} />
      <main>{children}</main>
      <MarketingFooter dict={dict} locale={locale} />
    </>
  );
}
