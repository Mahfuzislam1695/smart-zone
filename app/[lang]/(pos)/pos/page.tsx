import type { Metadata } from "next";
import { PosScreen } from "@/components/pos/pos-screen";
import { demoShop, posCatalog, posCustomers } from "@/lib/demo-data";
import { getDictionary, getLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.meta.pos };
}

// Full-screen POS without the dashboard sidebar. Demo catalog until stock queries exist (docs/02 § M6).
export default async function PosPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return (
    <PosScreen
      dict={dict.pos}
      lang={dict.lang}
      locale={locale}
      catalog={posCatalog}
      customers={posCustomers}
      shop={{ name: demoShop.name[locale], address: demoShop.address[locale], phone: demoShop.phone }}
      cashierName={dict.app.userName}
    />
  );
}
