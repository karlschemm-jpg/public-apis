"use client";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CapsuleResult, Piece } from "@/lib/capsule";

const CAT: Record<string, string> = { top: "Top", bottom: "Bottom", dress: "Dress", outerwear: "Layer", shoes: "Shoes", accessory: "Accessory" };

export function pieceTags(p: Piece) {
  return [p.color, p.warmth === "light" ? "light" : p.warmth === "warm" ? "warm" : "mid-weight", p.formality].filter(Boolean).join(" · ");
}

function LookTile({ day, ids, result, imageUrl, small }: { day: number; ids: string[]; result: CapsuleResult; imageUrl: string; small?: boolean }) {
  const byId = new Map(result.pieces.map((p) => [p.id, p]));
  const items = ids.map((id) => byId.get(id)).filter(Boolean) as CapsuleResult["pieces"];
  return (
    <figure className="flex h-full flex-col rounded-[16px] border border-border bg-card p-3">
      <figcaption className="flex items-baseline justify-between">
        <span className="font-display text-[22px] font-semibold leading-none tabular-nums">{String(day).padStart(2, "0")}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Day</span>
      </figcaption>
      <div className={cn("mt-2 grid flex-1 grid-cols-2 place-items-center gap-1.5", small ? "min-h-24" : "min-h-32")}>
        {items.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.id} src={p.yours ? imageUrl : p.img || ""} alt={p.name} className={cn("max-h-16 w-full object-contain", p.yours && "drop-shadow-md")} loading="lazy" />
        ))}
      </div>
    </figure>
  );
}

/**
 * The capsule. Locked: their piece, its tags, one insight and Day 1 in clear; the big number, days 2–14 and the
 * packing list blurred behind a lock (tap anywhere locked → onUnlock). Unlocked: everything, unblurring in place.
 */
export function CapsuleView({
  piece,
  result,
  imageUrl,
  tripLabel,
  locked,
  justUnlocked,
  unlockLabel = "See my full capsule",
  onUnlock,
  footer,
}: {
  piece: Piece;
  result: CapsuleResult;
  imageUrl: string;
  tripLabel: string;
  locked: boolean;
  justUnlocked?: boolean;
  unlockLabel?: string;
  onUnlock?: () => void;
  footer?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const day1 = result.looks[0];
  const rest = result.looks.slice(1);
  const lockedProps = locked
    ? { onClick: onUnlock, role: "button" as const, tabIndex: 0, "aria-label": unlockLabel, onKeyDown: (e: React.KeyboardEvent) => (e.key === "Enter" || e.key === " ") && onUnlock?.() }
    : {};
  const unblur = justUnlocked && !reduce ? { initial: { filter: "blur(14px)", opacity: 0.6 }, animate: { filter: "blur(0px)", opacity: 1 }, transition: { duration: 1.1, ease: [0.2, 0.7, 0.2, 1] as const } } : {};

  return (
    <div className="space-y-4">
      {/* CLEAR: their piece + one insight */}
      <section className="grid gap-4 rounded-[20px] border border-border bg-card p-4 sm:grid-cols-[180px_1fr] sm:p-5">
        <div className="checker grid aspect-square place-items-center rounded-[14px] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={piece.name} className="max-h-full max-w-full object-contain drop-shadow-xl" />
        </div>
        <div className="flex flex-col justify-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{CAT[piece.category]} · {tripLabel}</div>
          <h3 className="mt-1 text-3xl font-semibold leading-tight">{piece.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground first-letter:uppercase">{pieceTags(piece)}</p>
          <p className="mt-3 flex gap-2 text-[15px] font-medium">
            <Check className="mt-0.5 size-4 shrink-0 rounded-full bg-primary p-0.5 text-primary-foreground" strokeWidth={3} aria-hidden />
            {result.insight}
          </p>
        </div>
      </section>

      {/* The big number: blurred until unlocked */}
      <section className="relative overflow-hidden rounded-[20px] bg-foreground px-5 py-6 text-background" {...lockedProps}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">Your carry-on</div>
        <motion.div {...unblur} className={cn("font-display mt-1 text-5xl font-semibold tabular-nums sm:text-6xl", locked && "select-none blur-[10px]")} aria-hidden={locked}>
          {result.pieces.length} pieces · {result.days} looks
        </motion.div>
        <div className="mt-2 text-sm opacity-70">Everything fits in one carry-on. Nothing you won’t wear.</div>
        {locked && <Lock className="absolute right-5 top-5 size-5 opacity-80" aria-hidden />}
      </section>

      {/* Lookbook: Day 1 clear, the rest blurred */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-2xl font-semibold">The lookbook</h3>
          <span className="text-xs text-muted-foreground">{result.days} days · {result.yourLooks} with your {piece.name.toLowerCase()}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
          {day1 && <LookTile day={1} ids={day1.ids} result={result} imageUrl={imageUrl} />}
          {rest.map((l) =>
            locked ? (
              <div key={l.day} className="relative cursor-pointer select-none" {...lockedProps} aria-label={`Day ${l.day} is locked. ${unlockLabel}`}>
                <div className="pointer-events-none blur-[7px]" aria-hidden>
                  <LookTile day={l.day} ids={l.ids} result={result} imageUrl={imageUrl} small />
                </div>
              </div>
            ) : (
              <motion.div key={l.day} {...unblur}>
                <LookTile day={l.day} ids={l.ids} result={result} imageUrl={imageUrl} small />
              </motion.div>
            )
          )}
        </div>
      </section>

      {/* Packing list */}
      <section className="relative rounded-[20px] border border-border bg-card p-5" {...(locked ? lockedProps : {})}>
        <h3 className="text-2xl font-semibold">Packing list</h3>
        <motion.ul {...unblur} className={cn("mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2", locked && "select-none blur-[6px]")} aria-hidden={locked}>
          {result.pieces.map((p) => (
            <li key={p.id} className="flex items-center gap-2 border-b border-dashed border-border pb-2">
              <span className="size-4 rounded-[4px] border border-foreground/40" aria-hidden />
              {p.name}
              {p.yours && <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">Yours</span>}
            </li>
          ))}
        </motion.ul>
      </section>

      {locked && onUnlock && (
        <div className="flex justify-center pt-1">
          <button onClick={onUnlock} className="tap inline-flex h-14 items-center gap-2 rounded-full bg-foreground px-7 text-[16px] font-semibold text-background shadow-sm hover:shadow-md">
            <Lock className="size-4" aria-hidden /> {unlockLabel} <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
      {footer}
    </div>
  );
}
