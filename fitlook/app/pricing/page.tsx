import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getPlan, track } from "@/lib/kwop";
import { paywallPlans } from "@/lib/paywall-data";
import { getTrial, trialEligible } from "@/lib/trial";
import { Logo } from "@/components/logo";
import { InlinePaywall, PaywallProvider } from "@/components/paywall";

export const metadata: Metadata = { title: "Choose your plan", robots: { index: false } };
export const dynamic = "force-dynamic";

// The paywall as a page, for signed-in users (Kwop's checkout sends people back here when they cancel).
// Never linked from the landing page; visitors go to the try-first hero instead.
export default async function PricingPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user?.email) redirect("/#try");
  const plan = await getPlan(user.email, { userId: user.id });
  track("paywall_view", user.email);
  const trial = await getTrial(user.id);
  const plans = await paywallPlans();
  return (
    <PaywallProvider plans={plans} current={{ key: plan.key, name: plan.name, paid: plan.paid, status: plan.status }} trialEligible={trialEligible(trial, plan)}>
      <header className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-6">
        <Logo href="/start" />
        <Link href="/start" className="text-sm font-semibold underline-offset-4 hover:underline">Back to my capsule</Link>
      </header>
      <InlinePaywall plans={plans} title="Pack every trip with FitLook." line={plan.paid ? `You’re on ${plan.name}. Pick a plan to change.` : "Unlock your full lookbook, packing lists and more capsules."} />
    </PaywallProvider>
  );
}
