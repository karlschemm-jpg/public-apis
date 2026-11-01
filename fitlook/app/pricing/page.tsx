import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { getPlan, track } from "@/lib/kwop";
import { planCards } from "@/lib/pricing";
import { SiteFooter, SiteHeader } from "@/components/site";
import { OutsideDialog, PaywallBody } from "@/components/paywall";

export const metadata: Metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  let email: string | null = null;
  let userId: string | undefined;
  try {
    const user = await getSessionUser();
    email = user?.email ?? null;
    userId = user?.id;
  } catch {
    email = null;
  }
  const plan = email ? await getPlan(email, { userId }) : null;
  if (email) track("paywall_view", email);
  return (
    <>
      <SiteHeader />
      <main>
        <OutsideDialog>
          <PaywallBody plans={planCards(email, plan?.key)} />
        </OutsideDialog>
        <p className="pb-12 text-center text-sm text-muted-foreground">
          {email ? (
            <Link href="/dashboard" className="font-bold text-foreground underline-offset-4 hover:underline">Back to my closet</Link>
          ) : (
            <>Not ready? <Link href="/signup" className="font-bold text-foreground underline-offset-4 hover:underline">Start free</Link> with 3 Closet Digitizer scans.</>
          )}
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
