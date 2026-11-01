import type { Metadata } from "next";
import Link from "next/link";
import { CloudRain, Thermometer } from "lucide-react";
import { requireUser } from "@/lib/session";
import { PageTitle, Empty } from "@/components/empty";
import { Badge } from "@/components/ui/badge";
import { formatDate, TRIP_LABEL } from "@/lib/utils";
import { NewTripButton } from "./new-trip";
import type { TripRow } from "@/components/trips/trip-form";

export const metadata: Metadata = { title: "Trips" };

export default async function TripsPage() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("trips").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Could not load your trips.");
  const trips = (data || []) as TripRow[];
  return (
    <div>
      <PageTitle title="Trips" sub="Add the details, get a packing list made for the weather.">
        <NewTripButton />
      </PageTitle>
      {trips.length === 0 ? (
        <Empty text="No trips yet. Tell us where you’re going and we’ll pack for it.">
          <NewTripButton />
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {trips.map((t) => (
            <Link key={t.id} href={`/trips/${t.id}`} className="rounded-3xl border border-border bg-card p-5 transition hover:border-foreground">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{TRIP_LABEL[t.trip_type]}</span>
                {t.is_example && <Badge tone="ink">Example</Badge>}
              </div>
              <div className="mt-1 text-xl font-black">{t.destination}</div>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>{formatDate(t.start_date)} · {t.days} days</span>
                <span className="inline-flex items-center gap-1"><Thermometer className="size-4" />{t.temp_low}–{t.temp_high}°F</span>
                {t.rain && <span className="inline-flex items-center gap-1"><CloudRain className="size-4" />Rain</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
