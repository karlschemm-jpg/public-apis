import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { listTrips, loadGarments } from "@/lib/trip-data";
import { PageTitle, Empty } from "@/components/empty";
import { TripPicker } from "@/components/trips/trip-picker";
import { OutfitBoard, type OutfitRow } from "./outfit-board";

export const metadata: Metadata = { title: "Outfits" };

export default async function OutfitsPage({ searchParams }: { searchParams: Promise<{ trip?: string }> }) {
  const { trip: tripParam } = await searchParams;
  const { supabase, def } = await requireUser();
  const trips = await listTrips(supabase);
  if (!trips.length) {
    return (
      <div>
        <PageTitle title="Outfits" sub="A ready-to-wear look for every day of your trip." />
        <Empty text="Plan a trip first — then we’ll style every day of it." cta="Plan a trip" href="/trips" />
      </div>
    );
  }
  const trip = trips.find((t) => t.id === tripParam) || trips[0];
  const [{ data: outfits, error }, garments] = await Promise.all([
    supabase.from("outfits").select("*").eq("trip_id", trip.id).order("day_index"),
    loadGarments(supabase),
  ]);
  if (error) throw new Error("Could not load your looks.");
  return (
    <div>
      <PageTitle title="Outfits" sub={def.aiNotes ? "Advanced style matching is on." : "Basic matching. Pro adds advanced styling + weather tweaks."}>
        <TripPicker trips={trips} current={trip.id} base="/outfits" />
      </PageTitle>
      <OutfitBoard tripId={trip.id} days={trip.days} outfits={(outfits || []) as OutfitRow[]} garments={garments} />
    </div>
  );
}
