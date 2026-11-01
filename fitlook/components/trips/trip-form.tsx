"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { usePaywall } from "@/components/paywall";
import { TRIP_LABEL, TRIP_TYPES } from "@/lib/utils";
import { createTrip, updateTrip } from "@/app/actions";

export type TripRow = {
  id: string;
  destination: string;
  start_date: string | null;
  days: number;
  temp_low: number;
  temp_high: number;
  rain: boolean;
  trip_type: "beach" | "city" | "cold" | "work";
  notes: string | null;
  is_example: boolean;
};

export function TripForm({ trip, onDone }: { trip?: TripRow; onDone?: () => void }) {
  const router = useRouter();
  const { open } = usePaywall();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const r = trip ? await updateTrip(trip.id, fd) : await createTrip(fd);
          if (r.paywall) return open({ reason: r.paywall });
          if (r.error) return setError(r.error);
          onDone?.();
          if (!trip && r.id) router.push(`/trips/${r.id}`);
          else router.refresh();
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="destination">Where are you going?</Label>
        <Input id="destination" name="destination" defaultValue={trip?.destination} placeholder="Lisbon, Portugal" maxLength={80} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Leaving on</Label>
          <Input id="start_date" name="start_date" type="date" defaultValue={trip?.start_date || ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="days">Days</Label>
          <Input id="days" name="days" type="number" min={1} max={30} defaultValue={trip?.days ?? 7} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="temp_low">Low °F</Label>
          <Input id="temp_low" name="temp_low" type="number" min={-40} max={130} defaultValue={trip?.temp_low ?? 60} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="temp_high">High °F</Label>
          <Input id="temp_high" name="temp_high" type="number" min={-40} max={130} defaultValue={trip?.temp_high ?? 75} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="trip_type">Kind of trip</Label>
          <Select id="trip_type" name="trip_type" defaultValue={trip?.trip_type ?? "city"}>
            {TRIP_TYPES.map((t) => <option key={t} value={t}>{TRIP_LABEL[t]}</option>)}
          </Select>
        </div>
        <label className="mt-6 flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="rain" defaultChecked={trip?.rain} className="size-5 accent-[#c8ff3d]" /> Rain in the forecast
        </label>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={trip?.notes || ""} maxLength={500} placeholder="Wedding on Saturday, lots of walking…" />
      </div>
      {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} {trip ? "Save trip" : "Plan my packing list"}
      </Button>
    </form>
  );
}
