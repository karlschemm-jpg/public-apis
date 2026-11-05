import "server-only";
import { getKwopPlans } from "@/lib/kwop";
import { planKeyFrom, type PlanKey } from "@/lib/plans";

export type PaywallPlan = {
  id: number;
  key: Exclude<PlanKey, "free">;
  name: string;
  tag: string;
  month: { cents: number; perDay: string };
  year: { cents: number; perDay: string } | null;
  unlock: string[];
  adds: string[]; // what it adds over the plan below (upgrade sheet)
  recommended: boolean;
};

const COPY: Record<Exclude<PlanKey, "free">, { tag: string; unlock: string[]; adds: string[] }> = {
  starter: {
    tag: "For weekend getaways",
    unlock: ["Your full 14-day lookbook and packing list", "2 carry-on capsules a month", "Up to 50 pieces in your closet", "10 daily look plans a month", "Every trip saved in your history"],
    adds: ["Your full lookbook and packing list", "2 capsules and 10 look plans a month", "Up to 50 pieces in your closet"],
  },
  pro: {
    tag: "For regular travelers",
    unlock: ["Your full 14-day lookbook and packing list", "10 carry-on capsules a month", "Up to 200 pieces in your closet", "50 daily look plans, tuned to the weather", "AI stylist notes for every look"],
    adds: ["10 capsules a month instead of 2", "200 pieces and 50 look plans a month", "Weather-tuned looks + AI stylist notes"],
  },
  global: {
    tag: "For frequent flyers & creators",
    unlock: ["30 carry-on capsules a month", "Up to 500 pieces in your closet", "150 daily look plans a month", "Priority AI styling", "Packing lists as PDF to print or share"],
    adds: ["30 capsules a month instead of 10", "500 pieces and 150 look plans a month", "Priority AI + packing lists as PDF"],
  },
};

/** The paywall's plans: prices and per-day prices exactly as Kwop sells them, words in FitLook's units. */
export async function paywallPlans(): Promise<PaywallPlan[]> {
  const plans = await getKwopPlans();
  return plans
    .map((p) => {
      const key = planKeyFrom(p.id, p.name);
      if (key === "free") return null;
      const c = COPY[key];
      return {
        id: p.id,
        key,
        name: p.name.replace(/^fitlook\s+/i, ""),
        tag: c.tag,
        month: { cents: p.price_cents, perDay: p.per_day },
        year: p.yearly ? { cents: p.yearly.price_cents, perDay: p.yearly.per_day } : null,
        unlock: c.unlock,
        adds: c.adds,
        recommended: key === "pro",
      } satisfies PaywallPlan;
    })
    .filter(Boolean) as PaywallPlan[];
}
