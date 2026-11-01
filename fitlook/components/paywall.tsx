"use client";
import * as React from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PlanCards, type PlanCard } from "@/components/plan-cards";
import { trackPaywallView } from "@/app/actions";

type OpenOpts = { reason?: string; highlight?: string };
const Ctx = React.createContext<{ open: (o?: OpenOpts) => void }>({ open: () => {} });
export const usePaywall = () => React.useContext(Ctx);

export function PaywallProvider({ plans, children }: { plans: PlanCard[]; children: React.ReactNode }) {
  const [state, setState] = React.useState<{ open: boolean } & OpenOpts>({ open: false });
  const open = React.useCallback((o: OpenOpts = {}) => {
    setState({ open: true, ...o });
    trackPaywallView().catch(() => {});
  }, []);
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <Dialog open={state.open} onOpenChange={(v) => setState((s) => ({ ...s, open: v }))}>
        <DialogContent full>
          <PaywallBody plans={plans} reason={state.reason} highlight={state.highlight} onClose={() => setState({ open: false })} />
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}

export function PaywallBody({ plans, reason, highlight, onClose }: { plans: PlanCard[]; reason?: string; highlight?: string; onClose?: () => void }) {
  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        {reason && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            <Lock className="size-3.5" /> {reason}
          </div>
        )}
        <DialogTitleSafe className="text-3xl font-black tracking-tight sm:text-5xl">
          Two weeks of outfits. <span className="bg-primary px-1 text-primary-foreground">One carry-on.</span>
        </DialogTitleSafe>
        <DialogDescriptionSafe className="mt-3 text-muted-foreground">
          Digitize your whole closet, plan every trip, and get a ready-to-wear look for each day.
        </DialogDescriptionSafe>
      </div>
      <PlanCards plans={plans} highlight={highlight || "pro"} />
      <div className="mt-8 flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <div className="inline-flex items-center gap-2">
          <ShieldCheck className="size-4" /> Cancel anytime · Secure payment
        </div>
        {onClose && (
          <button onClick={onClose} className="font-semibold text-foreground underline-offset-4 hover:underline">
            Not now
          </button>
        )}
      </div>
    </div>
  );
}

// Title/Description only exist inside a Radix Dialog; on /pricing render plain elements.
function DialogTitleSafe(props: React.HTMLAttributes<HTMLHeadingElement>) {
  const inDialog = React.useContext(InDialog);
  return inDialog ? <DialogTitle {...props} /> : <h1 {...props} />;
}
function DialogDescriptionSafe(props: React.HTMLAttributes<HTMLParagraphElement>) {
  const inDialog = React.useContext(InDialog);
  return inDialog ? <DialogDescription {...props} /> : <p {...props} />;
}
const InDialog = React.createContext(true);
export function OutsideDialog({ children }: { children: React.ReactNode }) {
  return <InDialog.Provider value={false}>{children}</InDialog.Provider>;
}

export function UpgradeButton({ className, label = "Upgrade", reason }: { className?: string; label?: string; reason?: string }) {
  const { open } = usePaywall();
  return (
    <button onClick={() => open({ reason })} className={className}>
      {label}
    </button>
  );
}

/** Opens the paywall once on mount (e.g. right after the aha moment when the user came with ?plan=). */
export function AutoPaywall({ reason, highlight }: { reason?: string; highlight?: string }) {
  const { open } = usePaywall();
  const done = React.useRef(false);
  React.useEffect(() => {
    if (done.current) return;
    done.current = true;
    open({ reason, highlight });
  }, [open, reason, highlight]);
  return null;
}
