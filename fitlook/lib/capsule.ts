// Try-first capsule: the visitor's own piece + FitLook's starter capsule for the trip type, planned for 14 days by the
// real outfit engine (lib/matcher.ts). Pure, runs on the server.
import { planOutfits, type G, type TripInput } from "@/lib/matcher";
import type { Category } from "@/lib/utils";

export const CAPSULE_DAYS = 14;
export type TripKind = "city" | "beach" | "cold" | "work";

type Starter = Omit<G, "id"> & { img: string };
const P = (name: string, category: Category, color: string, warmth: G["warmth"], formality: G["formality"], img: string): Starter =>
  ({ name, category: category as G["category"], color, warmth, formality, img });

const STARTERS: Record<TripKind, Starter[]> = {
  city: [
    P("White tee", "top", "white", "light", "casual", "tee"), P("Knit sweater", "top", "brown", "warm", "casual", "sweater"),
    P("Straight-leg jeans", "bottom", "denim blue", "medium", "casual", "jeans"), P("Slim chinos", "bottom", "khaki", "medium", "smart", "chinos"),
    P("Red slip dress", "dress", "red", "light", "smart", "dress"), P("Navy blazer", "outerwear", "navy", "medium", "smart", "blazer"),
    P("White sneakers", "shoes", "white", "medium", "casual", "sneakers"), P("Suede loafers", "shoes", "brown", "medium", "smart", "loafers"),
    P("Sunglasses", "accessory", "black", "light", "casual", "sunglasses"),
  ],
  beach: [
    P("Linen button-up", "top", "cream", "light", "smart", "linen-shirt"), P("White tee", "top", "white", "light", "casual", "tee"),
    P("Chino shorts", "bottom", "khaki", "light", "casual", "shorts"), P("Slim chinos", "bottom", "khaki", "medium", "smart", "chinos"),
    P("Red slip dress", "dress", "red", "light", "smart", "dress"), P("Leather sandals", "shoes", "tan", "light", "casual", "sandals"),
    P("White sneakers", "shoes", "white", "medium", "casual", "sneakers"), P("Sunglasses", "accessory", "black", "light", "casual", "sunglasses"),
  ],
  cold: [
    P("Knit sweater", "top", "brown", "warm", "casual", "sweater"), P("White tee", "top", "white", "light", "casual", "tee"),
    P("Straight-leg jeans", "bottom", "denim blue", "medium", "casual", "jeans"), P("Slim chinos", "bottom", "khaki", "medium", "smart", "chinos"),
    P("Wool coat", "outerwear", "olive", "warm", "smart", "coat"), P("Leather boots", "shoes", "brown", "warm", "casual", "boots"),
    P("White sneakers", "shoes", "white", "medium", "casual", "sneakers"), P("Navy blazer", "outerwear", "navy", "medium", "smart", "blazer"),
  ],
  work: [
    P("Linen button-up", "top", "cream", "light", "smart", "linen-shirt"), P("White tee", "top", "white", "light", "casual", "tee"),
    P("Slim chinos", "bottom", "khaki", "medium", "smart", "chinos"), P("Straight-leg jeans", "bottom", "denim blue", "medium", "casual", "jeans"),
    P("Navy blazer", "outerwear", "navy", "medium", "formal", "blazer"), P("Suede loafers", "shoes", "brown", "medium", "smart", "loafers"),
    P("White sneakers", "shoes", "white", "medium", "casual", "sneakers"), P("Red slip dress", "dress", "red", "light", "smart", "dress"),
  ],
};

export const TRIP_WEATHER: Record<TripKind, { low: number; high: number; rain: boolean; label: string; noun: string }> = {
  city: { low: 55, high: 70, rain: true, label: "City break", noun: "city-break" },
  beach: { low: 75, high: 88, rain: false, label: "Beach & sun", noun: "beach" },
  cold: { low: 25, high: 42, rain: false, label: "Cold & snowy", noun: "cold-weather" },
  work: { low: 50, high: 66, rain: false, label: "Work trip", noun: "work-trip" },
};

export type Piece = { name: string; category: G["category"]; color: string | null; warmth: G["warmth"]; formality: G["formality"] };
export type CapsuleItem = { id: string; name: string; category: G["category"]; img: string | null; yours?: boolean };
export type CapsuleResult = {
  days: number;
  pieces: CapsuleItem[]; // what goes in the carry-on (only pieces actually used)
  looks: { day: number; ids: string[]; note: string }[];
  yourLooks: number; // looks that use their piece
  insight: string;
};

export function buildTryCapsule(kind: TripKind, piece: Piece): CapsuleResult {
  const w = TRIP_WEATHER[kind];
  const trip: TripInput = { days: CAPSULE_DAYS, temp_low: w.low, temp_high: w.high, rain: w.rain, trip_type: kind };
  const yours: G = { id: "yours", ...piece, color: piece.color || null };
  // their piece first in its category, so the engine starts the rotation with it
  const starters: (G & { img: string })[] = STARTERS[kind]
    .filter((s) => !(s.category === piece.category && s.name.toLowerCase() === piece.name.toLowerCase()))
    .map((s, i) => ({ ...s, id: `s${i}` }));
  const pool: G[] = [yours, ...starters];
  const looks = planOutfits(pool, trip, true);
  const used = new Set<string>();
  const out = looks.map((l) => {
    const ids = [l.outer_id, l.top_id, l.dress_id, l.bottom_id, l.shoes_id, l.accessory_id].filter(Boolean) as string[];
    ids.forEach((id) => used.add(id));
    return { day: l.day_index + 1, ids, note: l.note };
  });
  const yourLooks = out.filter((l) => l.ids.includes("yours")).length;
  const pieces: CapsuleItem[] = [
    { id: "yours", name: piece.name, category: piece.category, img: null, yours: true },
    ...starters.filter((s) => used.has(s.id)).map((s) => ({ id: s.id, name: s.name, category: s.category, img: `/examples/${s.img}.svg` })),
  ];
  const where = yourLooks >= 7 ? "your hardest-working piece" : yourLooks >= 4 ? "a strong mixer" : "a statement piece";
  const insight = `Shows up in ${yourLooks} of your ${CAPSULE_DAYS} looks — ${where}.`;
  return { days: CAPSULE_DAYS, pieces, looks: out, yourLooks, insight };
}
