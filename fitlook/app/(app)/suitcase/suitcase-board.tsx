"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Empty } from "@/components/empty";
import { CATEGORIES, CATEGORY_LABEL, cn } from "@/lib/utils";
import { setPacked } from "@/app/actions";
import type { GarmentView } from "@/app/(app)/wardrobe/wardrobe";

type Item = { id: string; packed: boolean; garment: GarmentView };

export function SuitcaseBoard({ tripId, items: initial, essentials }: { tripId: string; items: Item[]; essentials: string[] }) {
  const [items, setItems] = useState(initial);
  const [extra, setExtra] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const key = `fl-ess-${tripId}`;

  useEffect(() => {
    setItems(initial);
    try {
      setExtra(JSON.parse(localStorage.getItem(key) || "{}"));
    } catch {
      setExtra({});
    }
  }, [initial, key]);

  const packedCount = items.filter((i) => i.packed).length + essentials.filter((e) => extra[e]).length;
  const total = items.length + essentials.length;

  const toggle = (it: Item) => {
    const packed = !it.packed;
    setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, packed } : x)));
    start(async () => {
      const r = await setPacked(it.id, packed);
      if (r.error) {
        setError(r.error);
        setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, packed: !packed } : x)));
      }
    });
  };
  const toggleExtra = (e: string) => {
    const next = { ...extra, [e]: !extra[e] };
    setExtra(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  };

  if (!items.length) {
    return <Empty text="Nothing in this suitcase yet. Pick pieces on the trip page." cta="Open the trip" href={`/trips/${tripId}`} />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-foreground p-5 text-background">
        <div className="flex items-baseline justify-between">
          <div className="text-xl font-black">{packedCount === total ? "All packed. Bon voyage!" : `${packedCount} of ${total} packed`}</div>
          <Link href={`/trips/${tripId}`} className="text-sm font-bold text-primary underline-offset-4 hover:underline">Edit list</Link>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-white/15">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round((packedCount / Math.max(1, total)) * 100)}%` }} />
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {CATEGORIES.map((c) => {
        const list = items.filter((i) => i.garment.category === c);
        if (!list.length) return null;
        return (
          <section key={c}>
            <h2 className="mb-2 font-black">{CATEGORY_LABEL[c]} <span className="text-muted-foreground">({list.length})</span></h2>
            <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
              {list.map((it) => (
                <button
                  key={it.id}
                  onClick={() => toggle(it)}
                  aria-pressed={it.packed}
                  className={cn("lift relative w-36 shrink-0 snap-start overflow-hidden rounded-2xl border-2 text-left", it.packed ? "border-foreground" : "border-border")}
                >
                  <div className={cn("checker grid aspect-square place-items-center p-3", it.packed && "opacity-50")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.garment.image_url} alt={it.garment.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                  </div>
                  <div className="truncate px-2 py-2 text-xs font-semibold">{it.garment.name}</div>
                  <span className={cn("absolute right-2 top-2 grid size-7 place-items-center rounded-full border-2", it.packed ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-background")}>
                    {it.packed && <Check className="size-4" />}
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}

      <section>
        <h2 className="mb-2 font-black">Essentials</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {essentials.map((e) => (
            <button key={e} onClick={() => toggleExtra(e)} className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3 text-left text-sm font-semibold">
              <span className={cn("grid size-6 place-items-center rounded-full border-2", extra[e] ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-background")}>
                {extra[e] && <Check className="size-3.5" />}
              </span>
              <span className={extra[e] ? "line-through opacity-60" : ""}>{e}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
