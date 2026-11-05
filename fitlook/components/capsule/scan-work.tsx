"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const WORK_STEPS = [
  "Lifting your piece off the background",
  "Reading fabric, color & warmth",
  "Matching it to a 14-day capsule",
  "Styling every day",
  "Packing the carry-on",
];

/** The work being done, over THEIR photo: crop marks, a sweeping scan line, measurement dots, a progress ring. */
export function ScanWork({ imageUrl, percent, done }: { imageUrl: string; percent: number; done: number }) {
  const reduce = useReducedMotion();
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative mx-auto aspect-[4/5] w-full max-w-[340px] overflow-hidden rounded-[18px] bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Your piece being analyzed" className="size-full object-contain p-6" />
        {/* crop marks */}
        {["left-3 top-3 border-l-2 border-t-2", "right-3 top-3 border-r-2 border-t-2", "bottom-3 left-3 border-b-2 border-l-2", "bottom-3 right-3 border-b-2 border-r-2"].map((k) => (
          <span key={k} aria-hidden className={cn("absolute size-6 border-foreground", k)} />
        ))}
        {/* sweeping scan line */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute inset-x-4 h-16 bg-gradient-to-b from-transparent via-[#c8ff3d]/45 to-transparent"
            initial={{ top: "-10%" }}
            animate={{ top: ["-10%", "90%", "-10%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {/* measurement dots */}
        {[
          [28, 30], [70, 26], [50, 48], [32, 70], [68, 72],
        ].map(([x, y], i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute size-2.5 rounded-full border-2 border-background bg-foreground"
            style={{ left: `${x}%`, top: `${y}%` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: done > i % 3 ? 1 : 0, opacity: done > i % 3 ? 1 : 0 }}
            transition={{ delay: reduce ? 0 : i * 0.12, type: "spring", stiffness: 400, damping: 20 }}
          />
        ))}
        {/* progress ring */}
        <div className="absolute bottom-3 right-3 grid size-16 place-items-center rounded-full bg-background/90 backdrop-blur" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Building your capsule">
          <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
            <circle cx="32" cy="32" r={r} fill="none" stroke="#c8ff3d" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} style={{ transition: "stroke-dashoffset 120ms linear" }} />
          </svg>
          <span className="relative text-sm font-bold tabular-nums">{percent}%</span>
        </div>
      </div>
      <ol className="space-y-3" aria-live="polite">
        {WORK_STEPS.map((s, i) => {
          const state = i < done ? "done" : i === done ? "doing" : "todo";
          return (
            <li key={s} className={cn("flex items-center gap-3 text-[15px] transition-opacity", state === "todo" && "opacity-40")}>
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border", state === "done" ? "border-transparent bg-foreground text-background" : "border-border")}>
                {state === "done" ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
                    <Check className="size-4" strokeWidth={3} />
                  </motion.span>
                ) : state === "doing" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <span className="text-xs text-muted-foreground">{i + 1}</span>
                )}
              </span>
              <span className={cn(state === "doing" && "font-semibold")}>{s}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
