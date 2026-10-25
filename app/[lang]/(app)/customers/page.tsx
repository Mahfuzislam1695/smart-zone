import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/app/module-placeholder";
import { getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.app.modules.customers.title };
}

export default function Page() {
  return <ModulePlaceholder module="customers" />;
}
