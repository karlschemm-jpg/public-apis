"use client";
import { useState, useTransition } from "react";
import { Check, Loader2, PartyPopper } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { startTrialAction } from "@/app/actions";

const TRIAL_DAYS = 7;
const longDate = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

/** "Start 7 days free" → trial checkout modal (no card) → confirmation. */
export function TrialButton({ planKey, planName, benefits, hot }: { planKey: string; planName: string; benefits: string[]; hot?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ends, setEnds] = useState<string | null>(null);
  const preview = new Date(Date.now() + TRIAL_DAYS * 864e5);

  return (
    <>
      <button
        onClick={() => { setError(null); setOpen(true); }}
        className={cn(
          "tap block w-full rounded-full py-3 text-center text-sm font-black shadow-sm hover:shadow-md",
          hot ? "bg-primary text-primary-foreground" : "bg-foreground text-background"
        )}
      >
        Start 7 Days Free
      </button>
      <p className={cn("mt-2 text-center text-xs", hot ? "opacity-70" : "text-muted-foreground")}>No charge today, cancel anytime</p>

      <Dialog open={open} onOpenChange={(v) => { if (pending) return; if (!v && ends) window.location.reload(); else setOpen(v); }}>
        <DialogContent className="bg-warm text-slate">
          {ends ? (
            <div className="text-center">
              <PartyPopper aria-hidden className="animate-pop mx-auto size-10" />
              <DialogTitle className="mt-3 text-2xl font-black">You’re on {planName} — free for 7 days</DialogTitle>
              <DialogDescription className="mt-2 text-sm opacity-80">
                Everything in {planName} is unlocked until <b className="opacity-100">{longDate(new Date(ends))}</b>. No card on file, so nothing
                will ever be charged. Subscribe anytime from Account to keep it.
              </DialogDescription>
              <button
                onClick={() => window.location.assign("/wardrobe")}
                className="tap mt-6 w-full rounded-full bg-slate py-3.5 text-sm font-black text-warm shadow-sm hover:shadow-md"
              >
                Start packing
              </button>
            </div>
          ) : (
            <>
              <div className="text-xs font-bold uppercase tracking-wide opacity-70">{planName} plan</div>
              <DialogTitle className="mt-1 text-3xl font-black tracking-tight">Start 7 Days Free</DialogTitle>
              <DialogDescription className="mt-1 text-sm opacity-80">No charge today, cancel anytime. No card needed.</DialogDescription>
              <ul className="mt-5 space-y-2 text-sm">
                {benefits.slice(0, 4).map((b) => (
                  <li key={b} className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0" /> {b}</li>
                ))}
              </ul>
              <ol className="mt-5 space-y-1 rounded-2xl bg-card/70 p-4 text-sm">
                <li><b>Today:</b> full {planName} access, $0.</li>
                <li><b>{longDate(preview)}:</b> trial ends. Subscribe to keep {planName}, or stay on Free. Your closet stays either way.</li>
              </ol>
              {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>}
              <button
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await startTrialAction(planKey);
                    if (r.error) setError(r.error);
                    else setEnds(r.ends!);
                  })
                }
                className="tap mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-slate py-3.5 text-base font-black text-warm shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {pending && <Loader2 className="size-4 animate-spin" />} Start 7 Days Free
              </button>
              <p className="mt-2 text-center text-xs opacity-70">No charge today, cancel anytime</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
