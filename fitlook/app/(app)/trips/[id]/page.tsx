import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CloudRain, Luggage, Thermometer } from "lucide-react";
import { requireUser } from "@/lib/session";
import { loadGarments, loadTrip } from "@/lib/trip-data";
import { essentials } from "@/lib/matcher";
import { formatDate, TRIP_LABEL } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { NewTripButton } from "../new-trip";
import { TripActions, PackingPicker } from "./trip-client";

export const metadata: Metadata = { title: "Trip" };

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, def } = await requireUser();
  const data = await loadTrip(supabase, id);
  if (!data) notFound();
  const { trip, items } = data;
  const garments = await loadGarments(supabase);
  const inBag = new Set(items.map((i) => i.garment_id));
  const { count: outfitCount } = await supabase.from("outfits").select("id", { count: "exact", head: true }).eq("trip_id", id);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/trips" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Trips
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{TRIP_LABEL[trip.trip_type]}</span>
              {trip.is_example && <Badge tone="ink">Example</Badge>}
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{trip.destination}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>{formatDate(trip.start_date)} · {trip.days} days</span>
              <span className="inline-flex items-center gap-1"><Thermometer className="size-4" />{trip.temp_low}–{trip.temp_high}°F</span>
              {trip.rain && <span className="inline-flex items-center gap-1"><CloudRain className="size-4" />Rain expected</span>}
            </div>
            {trip.notes && <p className="mt-2 max-w-xl text-sm">{trip.notes}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <NewTripButton trip={trip} />
            <TripActions tripId={trip.id} hasOutfits={(outfitCount ?? 0) > 0} pdf={def.pdf} />
          </div>
        </div>
      </div>

      <section className="rounded-[2rem] bg-foreground p-5 text-background sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Luggage className="size-7 text-primary" />
            <div>
              <div className="text-xl font-black">{inBag.size} pieces → {trip.days} looks</div>
              <div className="text-sm opacity-70">
                {def.weather ? "Tuned for the forecast." : "Weather-based adjustments are on Pro."}
              </div>
            </div>
          </div>
          <Link href={`/suitcase?trip=${trip.id}`} className="tap rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground">Open suitcase</Link>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black">Packing list</h2>
        <p className="mb-4 text-sm text-muted-foreground">Tap a piece to add it to or take it out of your suitcase.</p>
        <PackingPicker tripId={trip.id} garments={garments} inBag={[...inBag]} />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black">Don’t forget</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {essentials(trip, def.weather).map((e) => (
            <li key={e} className="rounded-2xl bg-muted px-4 py-3 text-sm font-semibold">{e}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
