"use client";
/* eslint-disable @next/next/no-img-element -- small product SVGs inside device frames */
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, CloudRain, Sun } from "lucide-react";
import { Phone } from "@/components/landing/motion-bits";
import { cn } from "@/lib/utils";

function useTick(ms: number, n: number) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), ms);
    return () => clearInterval(t);
  }, [ms, n, reduce]);
  return i;
}

/** How it works, step 1: a photo becomes a clean cut-out. */
export function SnapLoop() {
  const i = useTick(2600, 2);
  return (
    <Phone>
      <div className="p-4 pt-9">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Closet</div>
        <div className="font-display text-lg font-semibold">Snap a piece</div>
        <div className="relative mt-3 aspect-[4/5] overflow-hidden rounded-2xl">
          <AnimatePresence mode="wait">
            {i === 0 ? (
              <motion.img key="raw" src="/sample/striped-tee.jpg" alt="A striped tee on a bed" className="absolute inset-0 size-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            ) : (
              <motion.div key="cut" className="checker absolute inset-0 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <img src="/sample/striped-tee-cutout.png" alt="The tee, background removed" className="max-h-full drop-shadow-xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-3 rounded-full bg-[#0a0a0a] py-2 text-center text-xs font-semibold text-white">{i === 0 ? "Lifting it off…" : "Saved to your closet"}</div>
      </div>
    </Phone>
  );
}

/** Step 2: trip details. */
export function TripLoop() {
  const i = useTick(2200, 3);
  const trips = [
    ["Lisbon", "64–78°F", Sun],
    ["New York", "55–70°F", CloudRain],
    ["Miami", "75–88°F", Sun],
  ] as const;
  const [city, temp, Icon] = trips[i];
  return (
    <Phone>
      <div className="p-4 pt-9">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">New trip</div>
        <div className="font-display text-lg font-semibold">Where to?</div>
        <AnimatePresence mode="wait">
          <motion.div key={city} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-3 rounded-2xl border border-neutral-200 p-3">
            <div className="text-xs text-neutral-500">Destination</div>
            <div className="font-semibold">{city}</div>
            <div className="mt-3 flex items-center gap-2 text-sm"><Icon className="size-4" /> {temp}</div>
            <div className="mt-1 text-xs text-neutral-500">14 days</div>
          </motion.div>
        </AnimatePresence>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold">
          {["City break", "Beach", "Cold", "Work"].map((t, k) => (
            <div key={t} className={cn("rounded-lg border px-2 py-1.5", k === i % 4 ? "border-[#0a0a0a] bg-[#0a0a0a] text-white" : "border-neutral-200")}>{t}</div>
          ))}
        </div>
        <div className="mt-3 rounded-full bg-[#c8ff3d] py-2 text-center text-xs font-semibold">Plan my packing list</div>
      </div>
    </Phone>
  );
}

/** Step 3: looks for every day. */
export function LooksLoop() {
  const i = useTick(1600, 6);
  const looks = [["tee", "jeans", "sneakers"], ["linen-shirt", "chinos", "loafers"], ["dress", "sandals", "sunglasses"], ["sweater", "jeans", "boots"], ["blazer", "chinos", "loafers"], ["tee", "shorts", "sneakers"]];
  return (
    <Phone>
      <div className="p-4 pt-9">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Lookbook</div>
        <div className="font-display text-lg font-semibold">14 days, styled</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {looks.slice(0, 4).map((l, k) => {
            const look = looks[(k + i) % looks.length];
            return (
              <div key={k} className="rounded-xl border border-neutral-200 p-2">
                <div className="font-display text-sm font-semibold">{String(k + 1 + i).padStart(2, "0")}</div>
                <AnimatePresence mode="wait">
                  <motion.div key={look.join()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-3 gap-0.5">
                    {look.map((n) => <img key={n} src={`/examples/${n}.svg`} alt="" className="h-8 w-full object-contain" />)}
                  </motion.div>
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </Phone>
  );
}

/** Feature loop: suitcase checklist ticking. */
export function SuitcaseLoop() {
  const i = useTick(900, 7);
  const items = ["Striped tee", "Straight-leg jeans", "Linen button-up", "Slim chinos", "White sneakers", "Suede loafers"];
  return (
    <div className="rounded-[18px] border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <div className="font-display text-lg font-semibold">Suitcase</div>
        <div className="text-xs tabular-nums text-muted-foreground">{Math.min(i, 6)} of 6 packed</div>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {items.map((t, k) => (
          <li key={t} className="flex items-center gap-2">
            <span className={cn("grid size-5 place-items-center rounded-full border transition-colors", k < i ? "border-transparent bg-[#c8ff3d] text-[#0a0a0a]" : "border-border")}>
              {k < i && <Check className="size-3" strokeWidth={3} />}
            </span>
            <span className={cn(k < i && "text-muted-foreground line-through")}>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Feature loop: weather-tuned look. */
export function WeatherLoop() {
  const i = useTick(2000, 2);
  return (
    <div className="rounded-[18px] border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="font-display text-lg font-semibold">Weather-tuned</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">{i ? <CloudRain className="size-4" /> : <Sun className="size-4" />} {i ? "Rain, 58°F" : "Sun, 79°F"}</div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 grid grid-cols-4 gap-2">
          {(i ? ["blazer", "tee", "jeans", "boots"] : ["linen-shirt", "shorts", "sandals", "sunglasses"]).map((n) => (
            <img key={n} src={`/examples/${n}.svg`} alt="" className="h-14 w-full rounded-lg bg-muted object-contain p-1" />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
