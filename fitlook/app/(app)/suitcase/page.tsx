import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { listTrips, loadGarments, loadTrip } from "@/lib/trip-data";
import { essentials } from "@/lib/matcher";
import { PageTitle, Empty } from "@/components/empty";
import { TripPicker } from "@/components/trips/trip-picker";
import { SuitcaseBoard } from "./suitcase-board";

export const metadata: Metadata = { title: "Suitcase" };

export default async function SuitcasePage({ searchParams }: { searchParams: Promise<{ trip?: string }> }) {
  const { trip: tripParam } = await searchParams;
  const { supabase, def } = await requireUser();
  const trips = await listTrips(supabase);
  if (!trips.length) {
    return (
      <div>
        <PageTitle title="Suitcase" sub="Everything you’re bringing, in one list." />
        <Empty text="No trip yet, so your suitcase is empty. Plan one to start packing." cta="Plan a trip" href="/trips" />
      </div>
    );
  }
  const current = trips.find((t) => t.id === tripParam) || trips[0];
  const [data, garments] = await Promise.all([loadTrip(supabase, current.id), loadGarments(supabase)]);
  if (!data) throw new Error("Could not load this suitcase.");
  const byId = new Map(garments.map((g) => [g.id, g]));
  const items = data.items.filter((i) => byId.has(i.garment_id)).map((i) => ({ ...i, garment: byId.get(i.garment_id)! }));
  return (
    <div>
      <PageTitle title="Suitcase" sub={`${data.trip.destination} · ${data.trip.days} days`}>
        <TripPicker trips={trips} current={current.id} base="/suitcase" />
      </PageTitle>
      <SuitcaseBoard tripId={current.id} items={items} essentials={essentials(data.trip, def.weather)} />
    </div>
  );
}
