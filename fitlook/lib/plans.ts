// Plan catalog + quotas. Safe for client and server (no secrets here).

export type PlanKey = "free" | "starter" | "pro" | "global";

export type PlanDef = {
  key: PlanKey;
  name: string;
  kwopId: number | null;
  price: number; // USD per month
  tagline: string;
  items: number; // wardrobe items (non-example)
  digitize: number; // digitizer uses per month (free: total)
  trips: number; // trips per month
  generate: number; // outfit generations per month
  weather: boolean;
  aiNotes: boolean;
  pdf: boolean;
  priority: boolean;
  benefits: string[];
};

export const PLANS: Record<PlanKey, PlanDef> = {
  free: {
    key: "free",
    name: "Free",
    kwopId: null,
    price: 0,
    tagline: "Try it on your next bag.",
    items: 3,
    digitize: 3,
    trips: 1,
    generate: 1,
    weather: false,
    aiNotes: false,
    pdf: false,
    priority: false,
    benefits: ["3 Closet Digitizer uses", "1 trip", "1 outfit plan"],
  },
  starter: {
    key: "starter",
    name: "Starter",
    kwopId: 1064,
    price: 5,
    tagline: "For quick weekend getaways.",
    items: 50,
    digitize: 50,
    trips: 2,
    generate: 10,
    weather: false,
    aiNotes: false,
    pdf: false,
    priority: false,
    benefits: ["Up to 50 wardrobe items", "2 trips per month", "10 outfit plans per month", "Basic outfit generation"],
  },
  pro: {
    key: "pro",
    name: "Pro",
    kwopId: 1065,
    price: 9,
    tagline: "For regular travelers and fashion lovers.",
    items: 200,
    digitize: 200,
    trips: 10,
    generate: 50,
    weather: true,
    aiNotes: true,
    pdf: false,
    priority: false,
    benefits: ["Up to 200 wardrobe items", "10 trips per month", "50 outfit plans per month", "Advanced style matching", "Weather-based adjustments"],
  },
  global: {
    key: "global",
    name: "Global",
    kwopId: 1066,
    price: 19,
    tagline: "For frequent flyers and fashion creators.",
    items: 500,
    digitize: 500,
    trips: 30,
    generate: 150,
    weather: true,
    aiNotes: true,
    pdf: true,
    priority: true,
    benefits: ["Up to 500 wardrobe items", "30 trips per month", "150 outfit plans per month", "Priority AI generation", "Export packing lists to PDF"],
  },
};

export const PAID_PLANS: PlanDef[] = [PLANS.starter, PLANS.pro, PLANS.global];

export function nextPlan(key: PlanKey): PlanDef | null {
  if (key === "free") return PLANS.starter;
  if (key === "starter") return PLANS.pro;
  if (key === "pro") return PLANS.global;
  return null;
}

export function planKeyFrom(id: number | null | undefined, name?: string | null): PlanKey {
  if (id === 1064) return "starter";
  if (id === 1065) return "pro";
  if (id === 1066) return "global";
  const n = (name || "").toLowerCase();
  if (n.includes("global")) return "global";
  if (n.includes("pro")) return "pro";
  if (n.includes("starter")) return "starter";
  return "free";
}

export function currentPeriod(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
