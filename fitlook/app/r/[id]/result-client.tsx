"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lock, Share2, Check } from "lucide-react";
import { CapsuleView } from "@/components/capsule/capsule-result";
import { AutoPaywall, usePaywall } from "@/components/paywall";
import { SignupSheet } from "@/components/signup-sheet";
import type { CapsuleResult, Piece } from "@/lib/capsule";

type Common = { id: string; piece: Piece; result: CapsuleResult; imageUrl: string; tripLabel: string; title: string; line: string };

export function ShareButton({ id, title }: { id: string; title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        const url = `${location.origin}/r/${id}`;
        if (navigator.share) {
          try {
            await navigator.share({ title, text: "My carry-on capsule, built by FitLook", url });
            return;
          } catch {}
        }
        await navigator.clipboard?.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="tap inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold"
    >
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />} {copied ? "Link copied" : "Share"}
    </button>
  );
}

/** Owner, signed in: locked until a plan is active; paywall over the result; sticky unlock bar. */
export function OwnerResult({ c, locked, autoOpen, perDay, tripId }: { c: Common; locked: boolean; autoOpen: boolean; perDay: string; tripId: string | null }) {
  const { open, unlocked } = usePaywall();
  const show = () => open({ title: c.title, line: c.line });
  return (
    <>
      {locked && autoOpen && <AutoPaywall title={c.title} line={c.line} />}
      <CapsuleView
        piece={c.piece}
        result={c.result}
        imageUrl={c.imageUrl}
        tripLabel={c.tripLabel}
        locked={locked}
        justUnlocked={unlocked > 0}
        onUnlock={show}
        footer={
          !locked && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {tripId && (
                <Link href={`/trips/${tripId}`} className="tap inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background">
                  Open my trip <ArrowRight className="size-4" />
                </Link>
              )}
              <ShareButton id={c.id} title={c.title} />
              <Link href="/wardrobe" className="text-sm font-semibold underline-offset-4 hover:underline">Swap in my own clothes</Link>
            </div>
          )
        }
      />
      <AnimatePresence>
        {locked && (
          <motion.div initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ type: "spring", stiffness: 380, damping: 34 }} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            <button onClick={show} className="tap mx-auto flex h-13 w-full max-w-[480px] items-center justify-center gap-2 rounded-full bg-foreground text-[15px] font-semibold text-background">
              <Lock className="size-4" aria-hidden /> See my full capsule · {perDay} / day
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Same browser that made the try, no account yet: unlock → "Save your capsule". */
export function AnonOwnerResult({ c }: { c: Common }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <CapsuleView piece={c.piece} result={c.result} imageUrl={c.imageUrl} tripLabel={c.tripLabel} locked onUnlock={() => setOpen(true)} />
      <SignupSheet open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Anyone else (a shared link): the teaser, and an invitation to make their own. */
export function PublicResult({ c }: { c: Common }) {
  return (
    <CapsuleView
      piece={c.piece}
      result={c.result}
      imageUrl={c.imageUrl}
      tripLabel={c.tripLabel}
      locked
      unlockLabel="Make my own capsule"
      onUnlock={() => (window.location.href = "/#try")}
    />
  );
}
