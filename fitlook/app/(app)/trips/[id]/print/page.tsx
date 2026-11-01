import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { loadGarments, loadTrip } from "@/lib/trip-data";
import { essentials } from "@/lib/matcher";
import { track } from "@/lib/kwop";
import { CATEGORIES, CATEGORY_LABEL, formatDate } from "@/lib/utils";
import { AutoPrint } from "./auto-print";

export const metadata: Metadata = { title: "Packing list" };

// Export packing list to PDF (Global plan, checked on the server).
export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, def } = await requireUser();
  if (!def.pdf) redirect("/pricing");
  const data = await loadTrip(supabase, id);
  if (!data) notFound();
  const garments = await loadGarments(supabase);
  const ids = new Set(data.items.map((i) => i.garment_id));
  const packed = garments.filter((g) => ids.has(g.id));
  track("feature_used", user.email!, "Export PDF");
  return (
    <div className="mx-auto max-w-2xl bg-white p-6 text-black">
      <AutoPrint />
      <h1 className="text-3xl font-black">{data.trip.destination}</h1>
      <p className="text-sm">{formatDate(data.trip.start_date)} · {data.trip.days} days · {data.trip.temp_low}–{data.trip.temp_high}°F{data.trip.rain ? " · rain" : ""}</p>
      {CATEGORIES.map((c) => {
        const list = packed.filter((g) => g.category === c);
        if (!list.length) return null;
        return (
          <div key={c} className="mt-5">
            <h2 className="border-b border-black pb-1 font-black uppercase">{CATEGORY_LABEL[c]}</h2>
            <ul className="mt-2 space-y-1">
              {list.map((g) => <li key={g.id}>☐ {g.name}{g.color ? ` (${g.color})` : ""}</li>)}
            </ul>
          </div>
        );
      })}
      <div className="mt-5">
        <h2 className="border-b border-black pb-1 font-black uppercase">Essentials</h2>
        <ul className="mt-2 space-y-1">{essentials(data.trip, def.weather).map((e) => <li key={e}>☐ {e}</li>)}</ul>
      </div>
      <p className="mt-8 text-xs">Packed with FitLook</p>
    </div>
  );
}
