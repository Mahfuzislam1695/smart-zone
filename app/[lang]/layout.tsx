import type { Metadata, Viewport } from "next";
import { Anek_Bangla, Galada, JetBrains_Mono, Noto_Sans_Bengali } from "next/font/google";
import { getDictionary, getLocale } from "@/lib/i18n";
import { locales } from "@/lib/locales";
import { site } from "@/lib/site";
import "../globals.css";

const anek = Anek_Bangla({
  subsets: ["bengali", "latin"],
  axes: ["wdth"],
  variable: "--font-anek",
});

const noto = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  variable: "--font-body",
});

// Used only in the handwritten khata illustration and receipt mockups.
const galada = Galada({
  weight: "400",
  subsets: ["bengali", "latin"],
  variable: "--font-galada",
  preload: false,
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  preload: false,
});

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: { default: dict.meta.title, template: `%s | ${site.name}` },
    description: dict.meta.description,
    applicationName: site.name,
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1220" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${anek.variable} ${noto.variable} ${galada.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
