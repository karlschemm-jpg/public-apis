"use client";
/* eslint-disable @next/next/no-img-element -- small decorative SVG/PNG assets drawn into the motion VSL */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Camera, Check, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// Motion-design VSL (HTML/CSS/JS, no video file). Voice-over script in VSL.md. public/vsl.mp4 replaces it when present.
const SCENES = [
  { s: 8, cap: "Day 3. Clothes everywhere. Nothing goes together." },
  { s: 9, cap: "You packed 23 pieces. You wore 9." },
  { s: 8, cap: "What if one photo was enough?" },
  { s: 10, cap: "FitLook reads your piece — and builds the trip around it." },
  { s: 9, cap: "A look for every single day." },
  { s: 8, cap: "11 pieces. 14 looks. One carry-on." },
  { s: 8, cap: "Pack once. Wear it all trip." },
];
const TOTAL = SCENES.reduce((a, b) => a + b.s, 0);
const LOOKS = [
  ["tee", "jeans", "sneakers"], ["linen-shirt", "chinos", "loafers"], ["dress", "sandals", "sunglasses"], ["sweater", "jeans", "boots"],
  ["tee", "chinos", "sneakers"], ["blazer", "jeans", "loafers"], ["linen-shirt", "shorts", "sandals"], ["tee", "jeans", "boots"],
  ["dress", "sneakers", "sunglasses"], ["sweater", "chinos", "loafers"], ["tee", "shorts", "sneakers"], ["blazer", "chinos", "loafers"],
  ["linen-shirt", "jeans", "sneakers"], ["dress", "loafers", "sunglasses"],
];
const img = (n: string) => `/examples/${n}.svg`;

function Scene({ i, reduce }: { i: number; reduce: boolean }) {
  const pop = (d = 0) => ({ initial: { opacity: 0, scale: reduce ? 1 : 0.8 }, animate: { opacity: 1, scale: 1 }, transition: { delay: reduce ? 0 : d, type: "spring" as const, stiffness: 260, damping: 18 } });
  if (i === 0)
    return (
      <div className="relative mx-auto h-56 w-72">
        <div className="absolute bottom-0 left-1/2 h-28 w-60 -translate-x-1/2 rounded-[18px] border-4 border-current" />
        {["tee", "jeans", "sweater", "dress", "sneakers", "coat", "shorts", "blazer"].map((n, k) => (
          <motion.img
            key={n}
            src={img(n)}
            alt=""
            className="absolute size-16"
            style={{ left: `${8 + (k % 4) * 22}%`, top: `${k < 4 ? 8 : 34}%` }}
            animate={reduce ? {} : { rotate: [0, k % 2 ? 14 : -14, 0], y: [0, -10, 0] }}
            transition={{ duration: 1.6 + k * 0.15, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    );
  if (i === 1)
    return (
      <div className="flex items-end justify-center gap-10">
        <motion.div {...pop(0.1)} className="text-center">
          <div className="font-display relative text-8xl font-semibold">
            23
            <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: reduce ? 0 : 1.6, duration: 0.5 }} className="absolute left-0 top-1/2 h-2 w-full origin-left bg-[#c8ff3d]" />
          </div>
          <div className="text-sm uppercase tracking-[0.2em] opacity-70">packed</div>
        </motion.div>
        <motion.div {...pop(2.4)} className="text-center">
          <div className="font-display text-8xl font-semibold text-[#c8ff3d]">9</div>
          <div className="text-sm uppercase tracking-[0.2em] opacity-70">worn</div>
        </motion.div>
      </div>
    );
  if (i === 2)
    return (
      <div className="relative mx-auto grid h-64 w-40 place-items-center rounded-[28px] border-[6px] border-current">
        <img src="/sample/striped-tee.jpg" alt="" className="size-full rounded-[20px] object-cover" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ delay: reduce ? 0 : 2.5, duration: 0.5 }} className="absolute inset-0 rounded-[20px] bg-white" />
        <motion.div {...pop(2.2)} className="absolute -bottom-6 grid size-14 place-items-center rounded-full bg-[#c8ff3d] text-[#0a0a0a]">
          <Camera className="size-6" />
        </motion.div>
      </div>
    );
  if (i === 3)
    return (
      <div className="grid items-center gap-6 sm:grid-cols-2">
        <div className="relative mx-auto aspect-square w-48 rounded-[18px] bg-white/10 p-4">
          <img src="/sample/striped-tee-cutout.png" alt="" className="size-full object-contain" />
          {!reduce && (
            <motion.div className="absolute inset-x-3 h-10 bg-gradient-to-b from-transparent via-[#c8ff3d]/60 to-transparent" animate={{ top: ["0%", "80%", "0%"] }} transition={{ duration: 2.2, repeat: Infinity }} />
          )}
          {["left-2 top-2 border-l-2 border-t-2", "right-2 top-2 border-r-2 border-t-2", "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"].map((k) => (
            <span key={k} className={cn("absolute size-5 border-current", k)} />
          ))}
        </div>
        <ul className="space-y-2 text-left text-sm">
          {["Background removed", "Navy & white · light · casual", "Matched to 10 pieces", "14 days styled"].map((t, k) => (
            <motion.li key={t} {...pop(0.6 + k * 1.3)} className="flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-full bg-[#c8ff3d] text-[#0a0a0a]"><Check className="size-3" strokeWidth={3} /></span>
              {t}
            </motion.li>
          ))}
        </ul>
      </div>
    );
  if (i === 4)
    return (
      <div className="mx-auto grid max-w-xl grid-cols-7 gap-1.5">
        {LOOKS.map((l, k) => (
          <motion.div key={k} {...pop(0.15 + k * 0.32)} className="rounded-lg bg-white p-1 text-[#0a0a0a]">
            <div className="font-display text-[11px] font-semibold">{String(k + 1).padStart(2, "0")}</div>
            {l.map((n) => <img key={n} src={img(n)} alt="" className="mx-auto h-5 w-full object-contain" />)}
          </motion.div>
        ))}
      </div>
    );
  if (i === 5)
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-36 w-56 rounded-[22px] border-4 border-current">
          <div className="absolute -top-5 left-1/2 h-5 w-20 -translate-x-1/2 rounded-t-xl border-4 border-b-0 border-current" />
          <motion.div initial={{ width: 0 }} animate={{ width: "88%" }} transition={{ delay: reduce ? 0 : 1, duration: reduce ? 0 : 2.4, ease: "easeInOut" }} className="absolute left-[6%] top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#c8ff3d]" />
        </div>
        <motion.div {...pop(3)} className="font-display text-4xl font-semibold">11 · 14 · 1</motion.div>
      </div>
    );
  return (
    <motion.div {...pop(0.4)} className="flex flex-col items-center gap-4">
      <a href="#try" className="tap rounded-full bg-[#c8ff3d] px-8 py-4 text-lg font-semibold text-[#0a0a0a]">Pack my carry-on</a>
      <div className="text-sm opacity-70">Free to try · No card · Ready in about 10 seconds</div>
    </motion.div>
  );
}

export function Vsl({ video }: { video?: boolean }) {
  const reduce = Boolean(useReducedMotion());
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [t, setT] = useState(0); // seconds
  const [playing, setPlaying] = useState(!reduce);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!inView || !playing || ended) return;
    const id = setInterval(() => setT((x) => {
      const n = x + 0.1;
      if (n >= TOTAL) {
        setEnded(true);
        return TOTAL;
      }
      return n;
    }), 100);
    return () => clearInterval(id);
  }, [inView, playing, ended]);

  if (video) {
    return (
      <div className="overflow-hidden rounded-[22px] bg-[#0a0a0a]">
        <video src="/vsl.mp4" className="aspect-video w-full" autoPlay muted playsInline loop controls />
      </div>
    );
  }

  let acc = 0;
  let scene = SCENES.length - 1;
  for (let k = 0; k < SCENES.length; k++) {
    if (t < acc + SCENES[k].s) { scene = k; break; }
    acc += SCENES[k].s;
  }
  const replay = () => { setT(0); setEnded(false); setPlaying(true); };

  return (
    <div ref={ref} className="relative overflow-hidden rounded-[22px] bg-[#0a0a0a] text-[#f5f5f2]" aria-label="FitLook in 60 seconds" role="region">
      <div className="flex gap-1 p-4" aria-hidden>
        {SCENES.map((s, k) => {
          const start = SCENES.slice(0, k).reduce((a, b) => a + b.s, 0);
          const p = Math.min(1, Math.max(0, (t - start) / s.s));
          return (
            <div key={k} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20">
              <div className="h-full bg-[#c8ff3d]" style={{ width: `${p * 100}%` }} />
            </div>
          );
        })}
      </div>
      <div className="flex min-h-[420px] flex-col items-center justify-center px-6 pb-8 sm:min-h-[460px]">
        <div className="flex min-h-[280px] w-full items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div key={scene} initial={{ opacity: 0, y: reduce ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -12 }} transition={{ duration: reduce ? 0 : 0.5 }} className="w-full">
              <Scene i={scene} reduce={reduce} />
            </motion.div>
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={`c${scene}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.3 }} className="font-display mt-6 max-w-2xl text-center text-2xl font-semibold leading-tight sm:text-4xl">
            {SCENES[scene].cap}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="absolute bottom-3 right-3 flex gap-2">
        {ended || (!playing && t === 0) ? (
          <button onClick={replay} className="tap grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={ended ? "Replay" : "Play"}>
            {ended ? <RotateCcw className="size-5" /> : <Play className="size-5" />}
          </button>
        ) : (
          <button onClick={() => setPlaying(!playing)} className="tap grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </button>
        )}
      </div>
    </div>
  );
}
