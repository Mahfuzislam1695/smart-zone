import type { Metadata } from "next";
import Link from "next/link";
import { DemoAuthForm } from "@/components/auth/demo-auth-form";
import { Input, Label } from "@/components/ui/input";
import { getDictionary, getLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.meta.login };
}

export default async function LoginPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const a = dict.auth;
  return (
    <>
      <h1 className="text-h3 font-semibold">{a.loginTitle}</h1>
      <p className="mt-2 text-ui text-muted">{a.loginSub}</p>

      <div className="mt-8">
        <DemoAuthForm redirectTo={`/${locale}/dashboard`} submitLabel={a.submit}>
          <div className="space-y-1.5">
            <Label htmlFor="identifier">{a.identifier}</Label>
            <Input id="identifier" name="identifier" autoComplete="username" placeholder={a.identifierHint} required />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="password">{a.password}</Label>
              <span className="text-2xs text-ink">{a.forgot}</span>
            </div>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <label className="flex items-center gap-2 text-2xs text-muted">
            <input type="checkbox" name="remember" defaultChecked className="size-4 accent-[var(--ink)]" />
            {a.remember}
          </label>
        </DemoAuthForm>
      </div>

      <p className="mt-6 text-ui text-muted">
        {a.noAccount}{" "}
        <Link href={`/${locale}/signup`} className="font-medium text-ink hover:underline">
          {a.signupLink}
        </Link>
      </p>
      <p className="mt-10 rounded-md bg-warn-soft px-3 py-2 text-2xs text-warn">{a.demoNote}</p>
    </>
  );
}
