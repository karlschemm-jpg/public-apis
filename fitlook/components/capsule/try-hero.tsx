"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, ImageUp, Lock, Sparkles } from "lucide-react";
import { removeBackground } from "@/lib/bg-remove";
import { cn } from "@/lib/utils";
import { ScanWork } from "@/components/capsule/scan-work";
import { CapsuleView } from "@/components/capsule/capsule-result";
import { SignupSheet } from "@/components/signup-sheet";
import type { CapsuleResult, Piece, TripKind } from "@/lib/capsule";

const TRIPS: { key: TripKind; label: string }[] = [
  { key: "city", label: "City break" },
  { key: "beach", label: "Beach" },
  { key: "cold", label: "Cold & snowy" },
  { key: "work", label: "Work trip" },
];
const NOUN: Record<TripKind, string> = { city: "city-break", beach: "beach", cold: "cold-weather", work: "work-trip" };
const LABEL: Record<TripKind, string> = { city: "City break", beach: "Beach & sun", cold: "Cold & snowy", work: "Work trip" };

type Ready = { id: string; piece: Piece; result: CapsuleResult; image_url: string };
type Phase = { k: "idle" } | { k: "working"; preview: string } | { k: "ready"; data: Ready } | { k: "error"; msg: string; limit?: boolean };

/** Luggage-tag chip (signature element): a paper tag with a punched hole. */
export function TagChip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "tap relative flex h-10 shrink-0 items-center gap-2 rounded-[10px] rounded-l-[18px] border pl-6 pr-4 text-sm font-semibold",
        on ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-foreground/50"
      )}
    >
      <span aria-hidden className={cn("absolute left-2.5 size-2 rounded-full border", on ? "border-background/70" : "border-foreground/40")} />
      {children}
    </button>
  );
}

export function TryHero() {
  const reduce = useReducedMotion();
  const [trip, setTrip] = useState<TripKind>("city");
  const [phase, setPhase] = useState<Phase>({ k: "idle" });
  const [percent, setPercent] = useState(0);
  const [done, setDone] = useState(0);
  const [signup, setSignup] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const capRef = useRef(0);
  const topRef = useRef<HTMLDivElement>(null);

  // percent glides toward the current cap; holds at 99 while the server works
  useEffect(() => {
    if (phase.k !== "working") return;
    const t = setInterval(() => setPercent((p) => (p >= capRef.current ? p : Math.min(capRef.current, p + Math.max(1, Math.round((capRef.current - p) * 0.08))))), 70);
    return () => clearInterval(t);
  }, [phase.k]);

  async function run(file: Blob, sample = false) {
    const preview = URL.createObjectURL(file);
    const t0 = Date.now();
    setPercent(0);
    setDone(0);
    capRef.current = 18;
    setPhase({ k: "working", preview });
    topRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    try {
      const cut = await removeBackground(file);
      await wait(Math.max(0, 700 - (Date.now() - t0)));
      setDone(1);
      setPhase({ k: "working", preview: cut.url });
      capRef.current = 60;
      setTimeout(() => (capRef.current = 99), 1200);
      const send = async () => {
        const fd = new FormData();
        fd.append("file", cut.blob, "piece.png");
        fd.append("trip", trip);
        if (sample) fd.append("sample", "1");
        return fetch("/api/try", { method: "POST", body: fd });
      };
      let res = await send().catch(() => null);
      if (!res || res.status >= 500) res = await send().catch(() => null); // retry once
      if (!res) throw new Error("No connection. Check your internet and try again.");
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) return setPhase({ k: "error", msg: data.error, limit: true });
      if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
      for (let s = 2; s <= 5; s++) {
        setDone(s);
        await wait(reduce ? 50 : 420);
      }
      await wait(Math.max(0, 3200 - (Date.now() - t0)));
      capRef.current = 100;
      setPercent(100);
      await wait(reduce ? 0 : 350);
      setPhase({ k: "ready", data });
    } catch (e) {
      setPhase({ k: "error", msg: (e as Error).message || "Something went wrong. Try again." });
    }
  }

  async function trySample() {
    const blob = await fetch("/sample/striped-tee.jpg").then((r) => r.blob());
    run(blob, true);
  }

  function pick(f?: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setPhase({ k: "error", msg: "That's not a photo. Try a JPG or PNG." });
    if (f.size > 15 * 1024 * 1024) return setPhase({ k: "error", msg: "That photo is too big. Try one under 15 MB." });
    run(f);
  }

  return (
    <div id="try" ref={topRef} className="scroll-mt-20">
      <AnimatePresence mode="wait" initial={false}>
        {(phase.k === "idle" || phase.k === "error") && (
          <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduce ? 0 : 0.35 }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
              className={cn(
                "relative rounded-[22px] border-2 border-dashed bg-card p-5 transition-colors sm:p-7",
                drag ? "border-foreground bg-muted" : "border-border"
              )}
            >
              {["left-3 top-3 border-l-2 border-t-2", "right-3 top-3 border-r-2 border-t-2", "bottom-3 left-3 border-b-2 border-l-2", "bottom-3 right-3 border-b-2 border-r-2"].map((k) => (
                <span key={k} aria-hidden className={cn("absolute size-5 border-foreground", k)} />
              ))}
              <div className="text-center">
                <div className="font-display text-2xl font-semibold sm:text-3xl">Drop a piece you’d pack</div>
                <p className="mt-1 text-sm text-muted-foreground">A top, jeans, a dress, shoes… lay it flat, snap it.</p>
              </div>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                <button type="button" onClick={() => camRef.current?.click()} className="tap flex h-14 items-center justify-center gap-2 rounded-full bg-foreground text-[16px] font-semibold text-background shadow-sm hover:shadow-md">
                  <Camera className="size-5" aria-hidden /> Pack my carry-on
                </button>
                <button type="button" onClick={() => fileRef.current?.click()} className="tap flex h-14 items-center justify-center gap-2 rounded-full border border-border bg-background text-[15px] font-semibold">
                  <ImageUp className="size-5" aria-hidden /> Upload a photo
                </button>
              </div>
              <button type="button" onClick={trySample} className="mx-auto mt-4 flex items-center gap-2 text-sm font-semibold underline decoration-border underline-offset-4 hover:decoration-foreground">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sample/striped-tee-cutout.png" alt="" className="size-7 rounded-md bg-muted object-contain p-0.5" /> or try it with our striped tee
              </button>
              <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
            <div className="mt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Where to?</div>
              <div role="radiogroup" aria-label="Kind of trip" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {TRIPS.map((t) => (
                  <TagChip key={t.key} on={trip === t.key} onClick={() => setTrip(t.key)}>{t.label}</TagChip>
                ))}
              </div>
            </div>
            {phase.k === "error" && (
              <div role="alert" className="mt-4 rounded-2xl border border-border bg-muted px-4 py-3 text-sm">
                {phase.msg}{" "}
                {phase.limit ? (
                  <button onClick={() => setSignup(true)} className="font-semibold underline">Create a free account</button>
                ) : (
                  <button onClick={() => setPhase({ k: "idle" })} className="font-semibold underline">Try again</button>
                )}
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Free to try · No card · Ready in about 10 seconds. Your photo stays private (stored encrypted in the US) and you can delete it anytime.
            </p>
          </motion.div>
        )}

        {phase.k === "working" && (
          <motion.div key="work" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.35 }} className="rounded-[22px] border border-border bg-card p-4 sm:p-6">
            <ScanWork imageUrl={phase.preview} percent={percent} done={done} />
          </motion.div>
        )}

        {phase.k === "ready" && (
          <motion.div key="ready" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.45 }}>
            <motion.div
              initial={{ scale: reduce ? 1 : 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="mb-4 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              role="status"
            >
              <Sparkles className="size-4" aria-hidden /> Your carry-on capsule is ready.
            </motion.div>
            <CapsuleView
              piece={phase.data.piece}
              result={phase.data.result}
              imageUrl={phase.data.image_url}
              tripLabel={LABEL[trip]}
              locked
              onUnlock={() => setSignup(true)}
              footer={
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Lock className="size-3" aria-hidden /> Your {NOUN[trip]} capsule is saved for you.</span>
                  <button
                    onClick={async () => {
                      await fetch(`/api/try/${phase.data.id}`, { method: "DELETE" });
                      setPhase({ k: "idle" });
                    }}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    Delete my photo
                  </button>
                </div>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
      <SignupSheet open={signup} onOpenChange={setSignup} />
    </div>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
