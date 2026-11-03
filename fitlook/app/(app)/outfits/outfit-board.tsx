"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePaywall } from "@/components/paywall";
import { Empty } from "@/components/empty";
import { deleteOutfit, generateOutfits, updateOutfitSlot } from "@/app/actions";
import type { GarmentView } from "@/app/(app)/wardrobe/wardrobe";
import type { Category } from "@/lib/utils";

export type OutfitRow = {
  id: string;
  day_index: number;
  top_id: string | null;
  bottom_id: string | null;
  dress_id: string | null;
  outer_id: string | null;
  shoes_id: string | null;
  accessory_id: string | null;
  note: string | null;
};

const SLOTS: { key: keyof OutfitRow; label: string; cat: Category }[] = [
  { key: "outer_id", label: "Layer", cat: "outerwear" },
  { key: "top_id", label: "Top", cat: "top" },
  { key: "dress_id", label: "Dress", cat: "dress" },
  { key: "bottom_id", label: "Bottom", cat: "bottom" },
  { key: "shoes_id", label: "Shoes", cat: "shoes" },
  { key: "accessory_id", label: "Accessory", cat: "accessory" },
];

export function OutfitBoard({ tripId, days, outfits, garments }: { tripId: string; days: number; outfits: OutfitRow[]; garments: GarmentView[] }) {
  const router = useRouter();
  const { open } = usePaywall();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const byId = useMemo(() => new Map(garments.map((g) => [g.id, g])), [garments]);

  const generate = () =>
    start(async () => {
      setError(null);
      const r = await generateOutfits(tripId);
      if (r.paywall) return open({ reason: r.paywall });
      if (r.error) return setError(r.error);
      router.refresh();
    });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Button onClick={generate} disabled={pending} size="lg">
          {pending ? <Loader2 className="animate-spin" /> : <Sparkles />} {outfits.length ? "Restyle all days" : `Style all ${days} days`}
        </Button>
        {outfits.length > 0 && <span className="text-sm text-muted-foreground">Each restyle uses 1 outfit plan.</span>}
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm font-medium text-red-600">{error}</p>}
      {outfits.length === 0 ? (
        <Empty text={`No looks yet for this trip. One tap and every day is styled.`}>
          <Button onClick={generate} disabled={pending}>
            <Sparkles /> Get my looks
          </Button>
        </Empty>
      ) : (
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {outfits.map((o) => (
            <DayCard key={o.id} o={o} byId={byId} garments={garments} />
          ))}
        </div>
      )}
    </div>
  );
}

function DayCard({ o, byId, garments }: { o: OutfitRow; byId: Map<string, GarmentView>; garments: GarmentView[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [pending, start] = useTransition();
  const filled = SLOTS.filter((s) => o[s.key]);
  return (
    <div className={`reveal w-[78vw] shrink-0 snap-center rounded-3xl border border-border bg-card p-4 sm:w-auto ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="text-lg font-black">Day {o.day_index + 1}</div>
        <div className="flex gap-1">
          <button onClick={() => setEdit(!edit)} className="rounded-full px-3 py-1 text-xs font-bold hover:bg-muted">{edit ? "Done" : "Edit"}</button>
          <button
            aria-label={`Delete day ${o.day_index + 1}`}
            className="rounded-full p-1.5 hover:bg-muted"
            onClick={() => confirm("Delete this look?") && start(async () => { await deleteOutfit(o.id); router.refresh(); })}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      {!edit ? (
        <>
          <div className="checker mt-3 grid grid-cols-2 gap-2 rounded-2xl p-3">
            {filled.length ? (
              filled.map((s) => {
                const g = byId.get(o[s.key] as string);
                return g ? (
                  <div key={s.key} className="grid aspect-square place-items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.image_url} alt={g.name} className="max-h-full max-w-full object-contain drop-shadow-md" loading="lazy" />
                  </div>
                ) : null;
              })
            ) : (
              <p className="col-span-2 py-6 text-center text-sm text-muted-foreground">Empty look. Tap Edit to add pieces.</p>
            )}
          </div>
          {o.note && <p className="mt-3 text-sm text-muted-foreground">{o.note}</p>}
        </>
      ) : (
        <div className="mt-3 space-y-2">
          {SLOTS.map((s) => (
            <label key={s.key} className="flex items-center gap-2 text-sm">
              <span className="w-20 font-semibold">{s.label}</span>
              <select
                className="h-9 flex-1 rounded-lg border border-border bg-background px-2"
                defaultValue={(o[s.key] as string) || ""}
                onChange={(e) => start(async () => { await updateOutfitSlot(o.id, s.key, e.target.value || null); router.refresh(); })}
              >
                <option value="">None</option>
                {garments.filter((g) => g.category === s.cat).map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
