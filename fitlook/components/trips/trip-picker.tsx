"use client";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";

export function TripPicker({ trips, current, base }: { trips: { id: string; destination: string; days: number }[]; current: string; base: string }) {
  const router = useRouter();
  return (
    <Select aria-label="Choose a trip" className="w-auto min-w-52" value={current} onChange={(e) => router.push(`${base}?trip=${e.target.value}`)}>
      {trips.map((t) => (
        <option key={t.id} value={t.id}>
          {t.destination} · {t.days}d
        </option>
      ))}
    </Select>
  );
}
