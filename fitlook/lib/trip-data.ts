import "server-only";
import { withImages } from "@/lib/images";
import type { createClient } from "@/lib/supabase/server";
import type { TripRow } from "@/components/trips/trip-form";
import type { GarmentView } from "@/app/(app)/wardrobe/wardrobe";

type SB = Awaited<ReturnType<typeof createClient>>;

export async function loadGarments(supabase: SB): Promise<GarmentView[]> {
  const { data, error } = await supabase.from("garments").select("*").order("category").order("created_at", { ascending: false });
  if (error) throw new Error("Could not load your wardrobe.");
  return (await withImages(data || [])) as GarmentView[];
}

export async function loadTrip(supabase: SB, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [{ data: trip }, { data: items }] = await Promise.all([
    supabase.from("trips").select("*").eq("id", id).maybeSingle(),
    supabase.from("trip_items").select("id,garment_id,packed").eq("trip_id", id),
  ]);
  if (!trip) return null;
  return { trip: trip as TripRow, items: (items || []) as { id: string; garment_id: string; packed: boolean }[] };
}

export async function listTrips(supabase: SB) {
  const { data } = await supabase.from("trips").select("id,destination,days,start_date").order("created_at", { ascending: false });
  return data || [];
}
