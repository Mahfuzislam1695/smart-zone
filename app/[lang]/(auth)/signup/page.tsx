import type { Metadata } from "next";
import Link from "next/link";
import { DemoAuthForm } from "@/components/auth/demo-auth-form";
import { Input, Label } from "@/components/ui/input";
import { getDictionary, getLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.meta.signup };
}

export default async function SignupPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const a = dict.auth;
  const fields = [
    { id: "shop", label: a.shopName, autoComplete: "organization" },
    { id: "name", label: a.yourName, autoComplete: "name" },
    { id: "mobile", label: a.mobile, autoComplete: "tel", type: "tel", placeholder: a.identifierHint },
    { id: "password", label: a.createPassword, autoComplete: "new-password", type: "password" },
  ];
  return (
    <>
      <h1 className="text-h3 font-semibold">{a.signupTitle}</h1>
      <p className="mt-2 text-ui text-muted">{a.signupSub}</p>

      <div className="mt-8">
        <DemoAuthForm redirectTo={`/${locale}/dashboard`} submitLabel={a.signupSubmit}>
          {fields.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input
                id={f.id}
                name={f.id}
                type={f.type ?? "text"}
                autoComplete={f.autoComplete}
                placeholder={f.placeholder}
                minLength={f.type === "password" ? 8 : undefined}
                required
              />
            </div>
          ))}
        </DemoAuthForm>
      </div>

      <p className="mt-6 text-ui text-muted">
        {a.haveAccount}{" "}
        <Link href={`/${locale}/login`} className="font-medium text-ink hover:underline">
          {a.loginLink}
        </Link>
      </p>
      <p className="mt-10 rounded-md bg-warn-soft px-3 py-2 text-2xs text-warn">{a.demoNote}</p>
    </>
  );
}
