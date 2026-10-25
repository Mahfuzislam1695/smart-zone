import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "./locales";

export type Dictionary = typeof import("@/dictionaries/bn.json");

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  bn: () => import("@/dictionaries/bn.json").then((m) => m.default),
  en: () => import("@/dictionaries/en.json").then((m) => m.default satisfies Dictionary),
};

export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  return locale;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()]();
}
