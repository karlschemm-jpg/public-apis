import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { CAPSULE_DAYS, TRIP_WEATHER, type CapsuleResult, type Piece, type TripKind } from "@/lib/capsule";

export type TryRow = {
  id: string;
  user_id: string | null;
  device_id: string;
  trip_type: TripKind;
  piece: Piece;
  image_path: string;
  result: CapsuleResult;
  trip_id: string | null;
  created_at: string;
};

export async function getTry(id: string): Promise<TryRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await createAdminClient().from("tries").select("*").eq("id", id).maybeSingle<TryRow>();
  return data ?? null;
}

export async function tryImageUrl(path: string) {
  const { data } = await createAdminClient().storage.from("garments").createSignedUrl(path, 60 * 60 * 24);
  return data?.signedUrl || "";
}

export async function latestTry(userId: string): Promise<TryRow | null> {
  const { data } = await createAdminClient().from("tries").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle<TryRow>();
  return data ?? null;
}

/**
 * Give an anonymous try to the account that just signed up / logged in, and turn it into real app data:
 * their piece in the wardrobe, the starter pieces as Examples, a 14-day trip with its suitcase and 14 looks.
 */
export async function attachTry(tryId: string, userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const t = await getTry(tryId);
  if (!t || (t.user_id && t.user_id !== userId)) return null;
  if (t.trip_id && t.user_id === userId) return t.id;
  const w = TRIP_WEATHER[t.trip_type];
  const { data: mine } = await admin
    .from("garments")
    .insert({ user_id: userId, name: t.piece.name, category: t.piece.category, color: t.piece.color, warmth: t.piece.warmth, formality: t.piece.formality, image_path: t.image_path })
    .select("id")
    .single();
  const idMap = new Map<string, string>();
  if (mine) idMap.set("yours", mine.id);
  const starters = t.result.pieces.filter((p) => !p.yours);
  if (starters.length) {
    const { data: rows } = await admin
      .from("garments")
      .insert(starters.map((p) => ({ user_id: userId, name: p.name, category: p.category, image_path: p.img || "/examples/tee.svg", is_example: true })))
      .select("id,name");
    rows?.forEach((r, i) => idMap.set(starters[i].id, r.id));
  }
  const { data: trip } = await admin
    .from("trips")
    .insert({ user_id: userId, destination: `My ${CAPSULE_DAYS}-day ${w.label.toLowerCase()}`, days: CAPSULE_DAYS, temp_low: w.low, temp_high: w.high, rain: w.rain, trip_type: t.trip_type, notes: "Built from your first FitLook capsule." })
    .select("id")
    .single();
  if (trip) {
    const ids = [...idMap.values()];
    if (ids.length) await admin.from("trip_items").insert(ids.map((gid) => ({ user_id: userId, trip_id: trip.id, garment_id: gid })));
    const slot = (cat: string) => ({ top: "top_id", bottom: "bottom_id", dress: "dress_id", outerwear: "outer_id", shoes: "shoes_id", accessory: "accessory_id" })[cat];
    const catOf = new Map(t.result.pieces.map((p) => [p.id, p.category]));
    const looks = t.result.looks.map((l) => {
      const row: Record<string, string | number | null> = { user_id: userId, trip_id: trip.id, day_index: l.day - 1, note: l.note.slice(0, 300) };
      l.ids.forEach((pid) => { const s = slot(catOf.get(pid) || ""); const gid = idMap.get(pid); if (s && gid) row[s] = gid; });
      return row;
    });
    if (looks.length) await admin.from("outfits").insert(looks);
  }
  await admin.from("tries").update({ user_id: userId, trip_id: trip?.id ?? null }).eq("id", t.id);
  await admin.from("profiles").update({ onboarding_done: true, trip_style: t.trip_type, aha_at: new Date().toISOString() }).eq("id", userId);
  return t.id;
}
