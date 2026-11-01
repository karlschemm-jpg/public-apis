// FitLook outfit engine: builds a capsule wardrobe for a trip, then one outfit per day.
// Pure functions, no secrets — runs on the server.

export type G = {
  id: string;
  name: string;
  category: "top" | "bottom" | "dress" | "outerwear" | "shoes" | "accessory";
  warmth: "light" | "medium" | "warm";
  formality: "casual" | "smart" | "formal";
  color: string | null;
};

export type TripInput = { days: number; temp_low: number; temp_high: number; rain: boolean; trip_type: "beach" | "city" | "cold" | "work" };

export type DayOutfit = {
  day_index: number;
  top_id: string | null;
  bottom_id: string | null;
  dress_id: string | null;
  outer_id: string | null;
  shoes_id: string | null;
  accessory_id: string | null;
  note: string;
};

const NEUTRALS = ["black", "white", "gray", "grey", "navy", "beige", "cream", "denim", "blue", "khaki", "tan", "brown", "olive"];

function score(g: G, trip: TripInput, weather: boolean): number {
  let s = 1;
  const avg = (trip.temp_low + trip.temp_high) / 2;
  const wantWarmth = avg >= 75 ? "light" : avg >= 55 ? "medium" : "warm";
  if (weather) {
    if (g.warmth === wantWarmth) s += 3;
    else if (g.warmth === "medium") s += 1;
    else s -= 1;
  }
  const wantFormal = trip.trip_type === "work" ? ["smart", "formal"] : ["casual", "smart"];
  if (wantFormal.includes(g.formality)) s += 2;
  if (g.color && NEUTRALS.some((n) => g.color!.toLowerCase().includes(n))) s += 1; // neutrals mix more
  return s;
}

function pick(list: G[], n: number, trip: TripInput, weather: boolean) {
  return [...list].sort((a, b) => score(b, trip, weather) - score(a, trip, weather)).slice(0, Math.max(0, n));
}

/** Smallest set that still gives a different look every day. */
export function buildCapsule(garments: G[], trip: TripInput, weather: boolean): G[] {
  const by = (c: G["category"]) => garments.filter((g) => g.category === c);
  const d = trip.days;
  const needOuter = trip.temp_low < 60 || (weather && trip.rain);
  return [
    ...pick(by("top"), Math.min(5, Math.ceil(d / 2)), trip, weather),
    ...pick(by("bottom"), Math.min(3, Math.ceil(d / 3)), trip, weather),
    ...pick(by("dress"), Math.min(2, Math.ceil(d / 4)), trip, weather),
    ...(needOuter ? pick(by("outerwear"), d > 6 ? 2 : 1, trip, weather) : []),
    ...pick(by("shoes"), d > 3 ? 2 : 1, trip, weather),
    ...pick(by("accessory"), Math.min(3, Math.ceil(d / 3)), trip, weather),
  ];
}

export function essentials(trip: TripInput, weather: boolean): string[] {
  const list = ["Phone charger", "Toiletries bag", "Underwear & socks (1 per day + 1)", "Sleepwear"];
  if (trip.trip_type === "beach") list.push("Swimsuit", "Sunscreen", "Sunglasses");
  if (trip.trip_type === "cold") list.push("Thermal base layer", "Gloves & beanie");
  if (trip.trip_type === "work") list.push("Laptop & charger", "Lint roller");
  if (weather && trip.rain) list.push("Compact umbrella");
  if (weather && trip.temp_high >= 85) list.push("Refillable water bottle");
  return list;
}

/** One outfit per day from the capsule, rotating pieces so no day repeats the same look. */
export function planOutfits(capsule: G[], trip: TripInput, weather: boolean): DayOutfit[] {
  const by = (c: G["category"]) => capsule.filter((g) => g.category === c);
  const tops = by("top"), bottoms = by("bottom"), dresses = by("dress"), outers = by("outerwear"), shoes = by("shoes"), acc = by("accessory");
  const out: DayOutfit[] = [];
  const needOuter = trip.temp_low < 60 || (weather && trip.rain);
  let dressTurn = 0;
  for (let i = 0; i < trip.days; i++) {
    const useDress = dresses.length > 0 && (tops.length === 0 || bottoms.length === 0 || i % 3 === 2);
    const top = !useDress && tops.length ? tops[i % tops.length] : null;
    // offset bottoms so top/bottom pairs keep changing
    const bottom = !useDress && bottoms.length ? bottoms[(i + Math.floor(i / Math.max(1, tops.length))) % bottoms.length] : null;
    const dress = useDress ? dresses[dressTurn++ % dresses.length] : null;
    const outer = needOuter && outers.length ? outers[i % outers.length] : null;
    const shoe = shoes.length ? shoes[i % shoes.length] : null;
    const a = acc.length ? acc[i % acc.length] : null;
    const pieces = [top, bottom, dress, outer, shoe, a].filter(Boolean) as G[];
    let note = pieces.length ? `${pieces.map((p) => p.name).join(" + ")}.` : "Add more pieces to your suitcase to complete this look.";
    if (weather) {
      if (trip.rain) note += " Rain in the forecast: keep your layer handy.";
      else if (trip.temp_high >= 85) note += " Hot day: breathable fabrics win.";
      else if (trip.temp_low < 45) note += " Chilly: layer up before you head out.";
    }
    out.push({
      day_index: i,
      top_id: top?.id ?? null,
      bottom_id: bottom?.id ?? null,
      dress_id: dress?.id ?? null,
      outer_id: outer?.id ?? null,
      shoes_id: shoe?.id ?? null,
      accessory_id: a?.id ?? null,
      note: note.slice(0, 300),
    });
  }
  return out;
}
