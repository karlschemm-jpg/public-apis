import type { Category } from "@/lib/utils";

type Ex = { name: string; category: Category; color: string; warmth: "light" | "medium" | "warm"; formality: "casual" | "smart" | "formal"; image_path: string };

const SETS: Record<string, Ex[]> = {
  beach: [
    { name: "Linen button-up", category: "top", color: "cream", warmth: "light", formality: "smart", image_path: "/examples/linen-shirt.svg" },
    { name: "Chino shorts", category: "bottom", color: "khaki", warmth: "light", formality: "casual", image_path: "/examples/shorts.svg" },
    { name: "Leather sandals", category: "shoes", color: "tan", warmth: "light", formality: "casual", image_path: "/examples/sandals.svg" },
  ],
  city: [
    { name: "White tee", category: "top", color: "white", warmth: "light", formality: "casual", image_path: "/examples/tee.svg" },
    { name: "Straight-leg jeans", category: "bottom", color: "denim blue", warmth: "medium", formality: "casual", image_path: "/examples/jeans.svg" },
    { name: "White sneakers", category: "shoes", color: "white", warmth: "medium", formality: "casual", image_path: "/examples/sneakers.svg" },
  ],
  cold: [
    { name: "Cozy knit sweater", category: "top", color: "brown", warmth: "warm", formality: "casual", image_path: "/examples/sweater.svg" },
    { name: "Wool coat", category: "outerwear", color: "olive", warmth: "warm", formality: "smart", image_path: "/examples/coat.svg" },
    { name: "Leather boots", category: "shoes", color: "brown", warmth: "warm", formality: "casual", image_path: "/examples/boots.svg" },
  ],
  work: [
    { name: "Navy blazer", category: "outerwear", color: "navy", warmth: "medium", formality: "formal", image_path: "/examples/blazer.svg" },
    { name: "Slim chinos", category: "bottom", color: "khaki", warmth: "medium", formality: "smart", image_path: "/examples/chinos.svg" },
    { name: "Suede loafers", category: "shoes", color: "brown", warmth: "medium", formality: "smart", image_path: "/examples/loafers.svg" },
  ],
};

const TRIPS: Record<string, { destination: string; temp_low: number; temp_high: number; rain: boolean }> = {
  beach: { destination: "Miami, FL", temp_low: 75, temp_high: 88, rain: false },
  city: { destination: "New York, NY", temp_low: 55, temp_high: 70, rain: true },
  cold: { destination: "Denver, CO", temp_low: 25, temp_high: 42, rain: false },
  work: { destination: "Chicago, IL", temp_low: 50, temp_high: 66, rain: false },
};

const DAYS: Record<string, number> = { weekend: 3, week: 7, two_weeks: 14 };

export function exampleGarments(style: string | null) {
  const set = SETS[style || "city"] || SETS.city;
  return set.map((g) => ({ ...g, is_example: true }));
}

export function exampleTrip(style: string | null, length: string | null) {
  const s = style && TRIPS[style] ? style : "city";
  return { ...TRIPS[s], trip_type: s, days: DAYS[length || "week"] || 7, is_example: true, notes: "Example trip — edit it or delete it anytime." };
}
