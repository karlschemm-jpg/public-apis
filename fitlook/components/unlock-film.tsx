"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Luggage, Sparkles, X } from "lucide-react";

const SCENE_MS = [1700, 1900, 1300];

/** The unlock moment after paying: 3 short scenes (~5 s), skippable, then onDone(). */
export function UnlockFilm({ plan, sub, onDone }: { plan: string; sub?: string; onDone: () => void }) {
  const [scene, setScene] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (scene >= SCENE_MS.length) {
      onDone();
      return;
    }
    const t = setTimeout(() => setScene((s) => s + 1), reduce ? 900 : SCENE_MS[scene]);
    return () => clearTimeout(t);
  }, [scene, onDone, reduce]);

  const fade = {
    initial: { opacity: 0, y: reduce ? 0 : 14, filter: reduce ? "none" : "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: reduce ? 0 : -10, filter: reduce ? "none" : "blur(4px)" },
    transition: { duration: reduce ? 0 : 0.45, ease: [0.2, 0.7, 0.2, 1] as const },
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`You're on ${plan}`} className="fixed inset-0 z-[80] grid place-items-center bg-[#0a0a0a] px-6 text-[#f5f5f2]">
      <button onClick={onDone} className="absolute right-4 top-4 grid size-11 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white" aria-label="Skip">
        <X className="size-5" />
      </button>
      <div className="absolute inset-x-0 top-0 flex gap-1.5 p-4 pr-16" aria-hidden>
        {SCENE_MS.map((ms, i) => (
          <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20">
            <motion.div
              className="h-full bg-[#c8ff3d]"
              initial={{ width: i < scene ? "100%" : "0%" }}
              animate={{ width: i < scene ? "100%" : i === scene ? "100%" : "0%" }}
              transition={{ duration: i === scene && !reduce ? ms / 1000 : 0, ease: "linear" }}
            />
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {scene === 0 && (
          <motion.div key="s0" {...fade} className="text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Welcome aboard</div>
            <div className="font-display mt-4 text-5xl font-semibold italic sm:text-7xl">You’re on {plan}</div>
            {sub && <div className="mt-4 text-white/70">{sub}</div>}
          </motion.div>
        )}
        {scene === 1 && (
          <motion.div key="s1" {...fade} className="w-full max-w-md">
            <div className="font-display text-center text-3xl font-semibold sm:text-4xl">Now unlocked</div>
            <ul className="mt-8 grid grid-cols-3 gap-3 text-center text-sm">
              {[
                [CalendarDays, "Every day’s look"],
                [Luggage, "Your packing list"],
                [Sparkles, "More capsules"],
              ].map(([Icon, label], i) => {
                const I = Icon as typeof CalendarDays;
                return (
                  <motion.li
                    key={label as string}
                    initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduce ? 0 : 0.15 + i * 0.18, duration: reduce ? 0 : 0.4 }}
                    className="rounded-2xl border border-white/15 p-4"
                  >
                    <I className="mx-auto size-7 text-[#c8ff3d]" aria-hidden />
                    <div className="mt-2 leading-tight">{label as string}</div>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
        {scene >= 2 && (
          <motion.div key="s2" {...fade} className="text-center">
            <div className="font-display text-6xl font-semibold sm:text-8xl">Let’s go.</div>
            <div className="mx-auto mt-6 h-1 w-24 rounded-full bg-[#c8ff3d]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
