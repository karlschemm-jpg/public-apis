"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, FileDown, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePaywall } from "@/components/paywall";
import { Empty } from "@/components/empty";
import { CATEGORY_LABEL, cn } from "@/lib/utils";
import { deleteTrip, generateOutfits, setInSuitcase } from "@/app/actions";
import type { GarmentView } from "@/app/(app)/wardrobe/wardrobe";

export function TripActions({ tripId, hasOutfits, pdf }: { tripId: string; hasOutfits: boolean; pdf: boolean }) {
  const router = useRouter();
  const { open } = usePaywall();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await generateOutfits(tripId);
            if (r.paywall) return open({ reason: r.paywall });
            if (r.error) return setError(r.error);
            router.push(`/outfits?trip=${tripId}`);
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <Sparkles />} {hasOutfits ? "Restyle my looks" : "Get my looks"}
      </Button>
      <Button
        variant="outline"
        onClick={() => (pdf ? window.open(`/trips/${tripId}/print`, "_blank") : open({ reason: "Export packing lists to PDF is on Global." , highlight: "global"}))}
      >
        <FileDown /> PDF
      </Button>
      <Button
        variant="ghost"
        aria-label="Delete trip"
        onClick={() => {
          if (!confirm("Delete this trip and its looks?")) return;
          start(async () => {
            const r = await deleteTrip(tripId);
            if (r.error) return setError(r.error);
            router.push("/trips");
          });
        }}
      >
        <Trash2 />
      </Button>
      {error && <p role="alert" className="w-full text-sm font-medium text-red-600">{error}</p>}
    </>
  );
}

export function PackingPicker({ tripId, garments, inBag }: { tripId: string; garments: GarmentView[]; inBag: string[] }) {
  const [bag, setBag] = useState(new Set(inBag));
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  if (!garments.length) return <Empty text="Your wardrobe is empty. Snap a few pieces first." cta="Go to Wardrobe" href="/wardrobe" />;
  const toggle = (id: string) => {
    const inside = !bag.has(id);
    setBag((b) => {
      const n = new Set(b);
      if (inside) n.add(id);
      else n.delete(id);
      return n;
    });
    start(async () => {
      const r = await setInSuitcase(tripId, id, inside);
      if (r.error) {
        setError(r.error);
        setBag((b) => {
          const n = new Set(b);
          if (inside) n.delete(id);
          else n.add(id);
          return n;
        });
      }
    });
  };
  return (
    <>
      {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {garments.map((g) => {
          const on = bag.has(g.id);
          return (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              aria-pressed={on}
              className={cn("lift relative overflow-hidden rounded-2xl border-2 text-left", on ? "border-foreground" : "border-border opacity-60 hover:opacity-100")}
            >
              <div className="checker grid aspect-square place-items-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.image_url} alt={g.name} className="max-h-full max-w-full object-contain" loading="lazy" />
              </div>
              <div className="truncate px-2 py-1.5 text-xs font-semibold">{g.name}</div>
              <div className="px-2 pb-1.5 text-[10px] text-muted-foreground">{CATEGORY_LABEL[g.category]}</div>
              {on && <Check className="absolute right-2 top-2 size-6 rounded-full bg-primary p-1 text-primary-foreground" />}
            </button>
          );
        })}
      </div>
    </>
  );
}
