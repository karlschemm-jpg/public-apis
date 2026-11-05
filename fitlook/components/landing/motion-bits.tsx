"use client";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Reveal on scroll: opacity + 12 px rise, 450 ms, staggered by `i`. */
export function Reveal({ children, i = 0, className, as = "div" }: { children: React.ReactNode; i?: number; className?: string; as?: "div" | "li" | "section" }) {
  const reduce = useReducedMotion();
  const M = as === "li" ? motion.li : as === "section" ? motion.section : motion.div;
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: i * 0.08, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </M>
  );
}

/** A number that counts up when it scrolls into view. */
export function CountUp({ to, suffix = "", className }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(0, to, { duration: 1.2, ease: [0.2, 0.7, 0.2, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [inView, to, reduce]);
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {v}
      {suffix}
    </span>
  );
}

/** A realistic phone frame built in CSS. */
export function Phone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative mx-auto aspect-[9/18.5] w-[230px] rounded-[38px] border-[7px] border-[#0a0a0a] bg-[#0a0a0a] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]", className)}>
      <div className="absolute left-1/2 top-2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-[#0a0a0a]" aria-hidden />
      <div className="relative size-full overflow-hidden rounded-[31px] bg-white text-[#0a0a0a]">{children}</div>
    </div>
  );
}

/** Sticky main button on phones, once the hero is out of view. */
export function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById("try");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <motion.div
      initial={false}
      animate={{ y: show ? 0 : 100 }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden"
      aria-hidden={!show}
    >
      <a href="#try" tabIndex={show ? 0 : -1} className="tap flex h-12 w-full items-center justify-center rounded-full bg-foreground font-semibold text-background">
        Pack my carry-on
      </a>
    </motion.div>
  );
}
