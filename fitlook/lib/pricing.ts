import "server-only";
import { PAID_PLANS, type PlanKey } from "@/lib/plans";
import { payLink } from "@/lib/kwop";
import type { PlanCard } from "@/components/plan-cards";

/** Plan cards for the paywall and /pricing. Signed in → Kwop pay links; visitors → signup with ?plan=. */
export function planCards(email: string | null, current: PlanKey = "free", opts: { trial?: boolean; visitorTrial?: boolean } = {}): PlanCard[] {
  return PAID_PLANS.map((p) => ({
    key: p.key,
    name: p.name,
    price: p.price,
    tagline: p.tagline,
    benefits: p.benefits,
    href: email ? payLink(p.kwopId!, email) : `/signup?plan=${encodeURIComponent(p.name)}`,
    current: current === p.key,
    trial: Boolean(email && opts.trial && current === "free"),
    trialHref: !email && opts.visitorTrial ? `/signup?plan=${encodeURIComponent(p.name)}&trial=1` : undefined,
  }));
}
