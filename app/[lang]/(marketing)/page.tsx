import { ClosingCta, DayTimeline, Faq, Features, Hero, KhataVs, Pricing } from "@/components/marketing/sections";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function LandingPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const props = { dict, locale };
  return (
    <>
      <Hero {...props} />
      <KhataVs {...props} />
      <DayTimeline {...props} />
      <Features {...props} />
      <Pricing {...props} />
      <Faq {...props} />
      <ClosingCta {...props} />
    </>
  );
}
