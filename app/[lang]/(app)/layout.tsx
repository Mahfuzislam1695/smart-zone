import { AppShell } from "@/components/app/app-shell";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function AppLayout({ children }: LayoutProps<"/[lang]">) {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return (
    <AppShell locale={locale} app={dict.app} lang={dict.lang}>
      {children}
    </AppShell>
  );
}
