import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { withImages } from "@/lib/images";
import { CATEGORY_LABEL, TRIP_LABEL, type Category, type TripType } from "@/lib/utils";

// User Stats: computed on the server from the user's own rows (RLS-scoped client), in one round of parallel queries.
// No new table: every number derives from garments, trips, trip_items and outfits.

type SB = Awaited<ReturnType<typeof createClient>>;

export type Trend = { dir: "up" | "down" | "flat"; label: string };
export type Metric = { key: string; value: string; label: string; trend: Trend };
export type TopPiece = { id: string; name: string; image_url: string; count: number };
export type Stats = {
  empty: boolean;
  starter: boolean; // only onboarding examples so far
  metrics: Metric[];
  topPieces: TopPiece[];
  categories: { label: string; count: number; pct: number }[];
  colors: { label: string; count: number }[];
  travel: { label: string; value: string }[];
};

/** Pieces a traveler would pack without a plan: one top, one bottom and one pair of shoes per day. */
export const NAIVE_PIECES_PER_DAY = 3;
/** Average folded garment volume in liters (tee ≈ 1 L, jeans ≈ 2.5 L, shoes ≈ 4 L, mixed ≈ 1.8 L). */
export const LITERS_PER_PIECE = 1.8;

function monthStart(offset = 0) {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1)).toISOString();
}

function trendOf(thisMonth: number, lastMonth: number, unit: string): Trend {
  if (thisMonth === 0 && lastMonth === 0) return { dir: "flat", label: "No change this month" };
  if (thisMonth > lastMonth) return { dir: "up", label: `+${thisMonth} ${unit} this month` };
  if (thisMonth < lastMonth) return { dir: "down", label: `${thisMonth} this month vs ${lastMonth} last month` };
  return { dir: "flat", label: `${thisMonth} this month, same as last` };
}

export async function getStats(supabase: SB): Promise<Stats> {
  const [g, t, i, o] = await Promise.all([
    supabase.from("garments").select("id,name,category,color,image_path,is_example,created_at"),
    supabase.from("trips").select("id,destination,days,temp_high,trip_type,is_example,created_at"),
    supabase.from("trip_items").select("trip_id,garment_id,packed"),
    supabase.from("outfits").select("id,top_id,bottom_id,dress_id,outer_id,shoes_id,accessory_id,created_at"),
  ]);
  if (g.error || t.error || i.error || o.error) throw new Error("Could not load your stats.");
  const garments = g.data || [];
  const trips = t.data || [];
  const items = i.data || [];
  const outfits = o.data || [];

  const thisM = monthStart(0);
  const lastM = monthStart(-1);
  const inThis = (d: string) => d >= thisM;
  const inLast = (d: string) => d >= lastM && d < thisM;

  const real = garments.filter((x) => !x.is_example);
  const realTrips = trips.filter((x) => !x.is_example);

  // luggage saved: naive packing vs the capsule actually in each suitcase
  const perTrip = new Map<string, number>();
  items.forEach((x) => perTrip.set(x.trip_id, (perTrip.get(x.trip_id) || 0) + 1));
  let naive = 0, packedPieces = 0;
  const savedFor = (list: typeof trips) =>
    list.reduce((sum, tr) => {
      const inBag = perTrip.get(tr.id) || 0;
      return inBag ? sum + Math.max(0, tr.days * NAIVE_PIECES_PER_DAY - inBag) : sum;
    }, 0);
  realTrips.forEach((tr) => {
    const inBag = perTrip.get(tr.id) || 0;
    if (!inBag) return;
    naive += tr.days * NAIVE_PIECES_PER_DAY;
    packedPieces += inBag;
  });
  const savedPieces = Math.max(0, naive - packedPieces);
  const savedLiters = Math.round(savedPieces * LITERS_PER_PIECE);
  const lighterPct = naive ? Math.round((savedPieces / naive) * 100) : 0;
  const savedThis = savedFor(realTrips.filter((x) => inThis(x.created_at)));
  const savedLast = savedFor(realTrips.filter((x) => inLast(x.created_at)));

  // most-styled pieces: how often each garment appears in planned outfits
  const uses = new Map<string, number>();
  outfits.forEach((x) =>
    [x.top_id, x.bottom_id, x.dress_id, x.outer_id, x.shoes_id, x.accessory_id].forEach((id) => id && uses.set(id, (uses.get(id) || 0) + 1))
  );
  const byId = new Map(garments.map((x) => [x.id, x]));
  const topRaw = [...uses.entries()].filter(([id]) => byId.has(id)).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topWithImg = await withImages(topRaw.map(([id, count]) => ({ ...byId.get(id)!, count })));
  const topPieces = topWithImg.map((x) => ({ id: x.id, name: x.name, image_url: x.image_url, count: x.count }));

  // style trends
  const catCount = new Map<Category, number>();
  garments.forEach((x) => catCount.set(x.category as Category, (catCount.get(x.category as Category) || 0) + 1));
  const total = garments.length || 1;
  const categories = [...catCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => ({ label: CATEGORY_LABEL[c], count: n, pct: Math.round((n / total) * 100) }));
  const colorCount = new Map<string, number>();
  garments.forEach((x) => {
    const c = (x.color || "").trim().toLowerCase();
    if (c) colorCount.set(c, (colorCount.get(c) || 0) + 1);
  });
  const colors = [...colorCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, count]) => ({ label, count }));

  // travel trends
  const typeCount = new Map<string, number>();
  trips.forEach((x) => typeCount.set(x.trip_type, (typeCount.get(x.trip_type) || 0) + 1));
  const favType = [...typeCount.entries()].sort((a, b) => b[1] - a[1])[0];
  const avgDays = trips.length ? Math.round((trips.reduce((s, x) => s + x.days, 0) / trips.length) * 10) / 10 : 0;
  const warmest = [...trips].sort((a, b) => b.temp_high - a.temp_high)[0];
  const packedCount = items.filter((x) => x.packed).length;
  const travel = trips.length
    ? [
        { label: "Favorite kind of trip", value: favType ? TRIP_LABEL[favType[0] as TripType] : "—" },
        { label: "Average trip length", value: `${avgDays} day${avgDays === 1 ? "" : "s"}` },
        { label: "Warmest destination", value: warmest ? `${warmest.destination} · ${warmest.temp_high}°F` : "—" },
        { label: "Suitcase items checked off", value: items.length ? `${packedCount} of ${items.length}` : "—" },
      ]
    : [];

  const metrics: Metric[] = [
    {
      key: "items",
      value: String(real.length),
      label: "Items digitized",
      trend: trendOf(real.filter((x) => inThis(x.created_at)).length, real.filter((x) => inLast(x.created_at)).length, "added"),
    },
    {
      key: "trips",
      value: String(realTrips.length),
      label: "Trips planned",
      trend: trendOf(realTrips.filter((x) => inThis(x.created_at)).length, realTrips.filter((x) => inLast(x.created_at)).length, "planned"),
    },
    {
      key: "looks",
      value: String(outfits.length),
      label: "Daily looks styled",
      trend: trendOf(outfits.filter((x) => inThis(x.created_at)).length, outfits.filter((x) => inLast(x.created_at)).length, "styled"),
    },
    {
      key: "saved",
      value: `${savedLiters} L`,
      label: "Luggage space saved",
      trend: savedPieces
        ? { dir: savedThis >= savedLast ? "up" : "down", label: `${savedPieces} pieces left home · ${lighterPct}% lighter` }
        : { dir: "flat", label: "Pack a trip to see your savings" },
    },
  ];

  return { empty: garments.length === 0 && trips.length === 0, starter: real.length === 0 && realTrips.length === 0, metrics, topPieces, categories, colors, travel };
}
