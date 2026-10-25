"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * DEMO ONLY: auth isn't wired yet (Better Auth, see docs/03-architecture.md).
 * Submitting goes straight to the dashboard so the flow can be clicked through.
 */
export function DemoAuthForm({
  redirectTo,
  submitLabel,
  children,
}: {
  redirectTo: string;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(redirectTo);
      }}
    >
      {children}
      <Button type="submit" size="lg" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
