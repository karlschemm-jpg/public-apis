"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, CreditCard, Lock, Loader2 } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { CheckoutSheet, type CheckoutChoice } from "@/components/checkout-sheet";
import { UnlockFilm } from "@/components/unlock-film";
import { cn } from "@/lib/utils";
import { startTrialAction, trackPaywallView } from "@/app/actions";
import type { PaywallPlan } from "@/lib/paywall-data";

export type CurrentPlan = { key: string; name: string; paid: boolean; status: string | null };
type OpenOpts = { reason?: string; highlight?: string; title?: string; line?: string };
type Ctx = { open: (o?: OpenOpts) => void; unlocked: number; checkout: (c: CheckoutChoice) => void; paymentsOff: boolean; trialEligible: boolean; onTrialStarted: (name: string) => void; confirm: (ref: string) => void };
const PaywallCtx = React.createContext<Ctx>({ open: () => {}, unlocked: 0, checkout: () => {}, paymentsOff: false, trialEligible: false, onTrialStarted: () => {}, confirm: () => {} });
export const usePaywall = () => React.useContext(PaywallCtx);

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const perDayNum = (s: string) => s.replace(/^\$/, "");

const QUESTIONS = [
  ["Will it work with my clothes?", "Yes. Snap any top, bottom, dress, layer, shoes or accessory. FitLook lifts it off the background, reads it, and builds every look around it. You can swap any piece anytime."],
  ["Can I cancel anytime?", "Yes, in Account → Billing, in 2 taps. You keep your plan until the end of the period you already paid for. Your closet and trips stay."],
  ["What happens right after I pay?", "Your capsule unblurs on the spot: all 14 looks, the packing list, and the trip ready in the app. No email to check."],
];

/** Global paywall + checkout + unlock film. Paid users get the upgrade sheet (next plan only). */
export function PaywallProvider({
  plans,
  current,
  trialEligible,
  children,
}: {
  plans: PaywallPlan[];
  current: CurrentPlan;
  trialEligible: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [opts, setOpts] = React.useState<OpenOpts | null>(null);
  const [choice, setChoice] = React.useState<CheckoutChoice | null>(null);
  const [off, setOff] = React.useState(false);
  const [film, setFilm] = React.useState<{ plan: string; sub?: string } | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const [unlocked, setUnlocked] = React.useState(0);

  const open = React.useCallback((o: OpenOpts = {}) => {
    setOff(false);
    setOpts(o);
    trackPaywallView().catch(() => {});
  }, []);

  const onPaid = React.useCallback(async (ref: string) => {
    setConfirming(true);
    const r = await fetch("/api/checkout/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ref }) })
      .then((x) => x.json())
      .catch(() => null);
    setConfirming(false);
    setChoice(null);
    setOpts(null);
    setFilm({ plan: r?.plan?.name && r.plan.name !== "Free" ? r.plan.name : "your new plan" });
  }, []);

  const onPaymentsOff = React.useCallback(() => {
    setChoice(null);
    setOff(true);
  }, []);

  const finishFilm = React.useCallback(() => {
    setFilm(null);
    setUnlocked((n) => n + 1);
    router.refresh();
  }, [router]);

  const upgrade = current.paid && current.status !== "trialing";

  return (
    <PaywallCtx.Provider
      value={{ open, unlocked, confirm: onPaid, checkout: setChoice, paymentsOff: off, trialEligible, onTrialStarted: (name) => { setOpts(null); setFilm({ plan: name, sub: "Free for 7 days · no card on file" }); } }}
    >
      {children}
      <Sheet open={Boolean(opts)} onOpenChange={(v) => !v && setOpts(null)} title={upgrade ? "Upgrade your plan" : "Choose your plan"} variant={upgrade ? "bottom" : "page"}>
        {opts &&
          (upgrade ? (
            <UpgradePanel plans={plans} current={current} reason={opts.reason} onContinue={setChoice} paymentsOff={off} />
          ) : (
            <PaywallPanel
              plans={plans}
              title={opts.title}
              line={opts.line || opts.reason}
              highlight={opts.highlight}
              trialEligible={trialEligible}
              paymentsOff={off}
              onContinue={setChoice}
              onTrialStarted={(name) => {
                setOpts(null);
                setFilm({ plan: name, sub: "Free for 7 days · no card on file" });
              }}
              inSheet
            />
          ))}
      </Sheet>
      <CheckoutSheet choice={choice} onClose={() => setChoice(null)} onPaid={onPaid} onPaymentsOff={onPaymentsOff} />
      {confirming && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-background/80 backdrop-blur" role="status">
          <div className="flex items-center gap-3 font-semibold">
            <Loader2 className="size-5 animate-spin" /> Confirming your payment…
          </div>
        </div>
      )}
      {film && <UnlockFilm plan={film.plan} sub={film.sub} onDone={finishFilm} />}
    </PaywallCtx.Provider>
  );
}

/** The paywall content (sheet over the result, and /pricing). */
export function PaywallPanel({
  plans,
  title,
  line,
  highlight,
  trialEligible,
  paymentsOff,
  onContinue,
  onTrialStarted,
  inSheet,
}: {
  plans: PaywallPlan[];
  title?: string;
  line?: string;
  highlight?: string;
  trialEligible: boolean;
  paymentsOff?: boolean;
  onContinue: (c: CheckoutChoice) => void;
  onTrialStarted?: (planName: string) => void;
  inSheet?: boolean;
}) {
  const hasYearly = plans.some((p) => p.year);
  const [period, setPeriod] = React.useState<"month" | "year">("month");
  const [sel, setSel] = React.useState(() => plans.find((p) => p.key === highlight)?.id ?? plans.find((p) => p.recommended)?.id ?? plans[0]?.id);
  const plan = plans.find((p) => p.id === sel) ?? plans[0];
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [btnVisible, setBtnVisible] = React.useState(true);
  const [trialPending, startTrial] = React.useTransition();
  const [trialError, setTrialError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBtnVisible(e.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!plan) return null;
  const price = period === "year" && plan.year ? plan.year : plan.month;
  const due = `${money(price.cents)} due today, then every ${period === "year" ? "year" : "month"} · Cancel anytime`;
  const go = () =>
    onContinue({ planId: plan.id, planName: plan.name, period, priceLabel: `${money(price.cents)} / ${period === "year" ? "year" : "month"}` });

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", inSheet && "overflow-y-auto")}>
      <div className="mx-auto w-full max-w-[480px] px-5 pb-28 pt-16 sm:px-7 sm:pt-14">
        <h2 className="text-[34px] font-semibold leading-[1.05] sm:text-4xl">{title || "Your carry-on capsule is ready."}</h2>
        {line && <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{line}</p>}

        {paymentsOff && (
          <p role="status" className="mt-5 rounded-2xl border border-border bg-muted px-4 py-3 text-sm">
            Payments open in a moment. Your capsule is saved.
          </p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <div className="text-[15px] font-semibold">Choose your plan.</div>
          {hasYearly && (
            <div role="radiogroup" aria-label="Billing period" className="flex rounded-full border border-border p-0.5 text-xs font-semibold">
              {(["month", "year"] as const).map((p) => (
                <button
                  key={p}
                  role="radio"
                  aria-checked={period === p}
                  onClick={() => setPeriod(p)}
                  className={cn("rounded-full px-3 py-1.5 transition", period === p ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                >
                  {p === "month" ? "Monthly" : "Yearly −20%"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div role="radiogroup" aria-label="Plans" className="mt-3 space-y-2.5">
          {plans.map((p) => {
            const on = p.id === plan.id;
            const pr = period === "year" && p.year ? p.year : p.month;
            return (
              <button
                key={p.id}
                role="radio"
                aria-checked={on}
                onClick={() => setSel(p.id)}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-2xl border bg-card px-4 py-4 text-left transition-[border-color,box-shadow] duration-200",
                  on ? "border-foreground shadow-[0_0_0_1px_var(--foreground)]" : "border-border hover:border-foreground/40"
                )}
              >
                {p.recommended && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
                    Most popular
                  </span>
                )}
                <span aria-hidden className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", on ? "border-foreground" : "border-border")}>
                  {on && <span className="size-2.5 rounded-full bg-foreground" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-semibold">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {money(pr.cents)} / {period === "year" ? "year" : "month"} · {p.tag}
                  </span>
                </span>
                <span className="text-right">
                  <span className="font-display block text-[28px] font-semibold leading-none tabular-nums">${perDayNum(pr.perDay)}</span>
                  <span className="text-xs text-muted-foreground">/ day</span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          ref={btnRef}
          onClick={go}
          className="tap mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground text-[16px] font-semibold text-background shadow-sm hover:shadow-md"
        >
          Continue with {plan.name} <ArrowRight className="size-4" aria-hidden />
        </button>
        <p className="mt-2.5 text-center text-xs text-muted-foreground">{due}</p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3.5" aria-hidden /> Secure payment, processed by Whop
          <span className="rounded-md border border-border px-1.5 py-0.5 font-semibold text-foreground">Whop</span>
          <span className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 font-semibold text-foreground">
            <CreditCard className="size-3" aria-hidden /> Card
          </span>
        </div>

        {trialEligible && onTrialStarted && (
          <div className="mt-5 text-center text-sm">
            <button
              disabled={trialPending}
              onClick={() =>
                startTrial(async () => {
                  setTrialError(null);
                  const r = await startTrialAction(plan.key);
                  if (r.error) setTrialError(r.error);
                  else onTrialStarted(plan.name);
                })
              }
              className="font-semibold underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              {trialPending ? "Starting…" : `or try ${plan.name} free for 7 days, no card`}
            </button>
            {trialError && <p role="alert" className="mt-1 text-xs text-red-600">{trialError}</p>}
          </div>
        )}

        <div className="mt-9">
          <div className="text-[15px] font-semibold">What you unlock with {plan.name}</div>
          <ul className="mt-3 space-y-2.5">
            {plan.unlock.map((u) => (
              <li key={u} className="flex gap-2.5 text-[15px]">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
                {u}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-9 divide-y divide-border border-y border-border">
          {QUESTIONS.map(([q, a]) => (
            <details key={q} className="group py-3.5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium">
                {q}
                <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
          Subscriptions renew automatically until canceled. Prices in USD.
        </p>
      </div>

      <AnimatePresence>
        {!btnVisible && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={cn("z-10 border-t border-border bg-background/95 px-5 py-3 backdrop-blur", inSheet ? "sticky bottom-0" : "fixed inset-x-0 bottom-0")}
          >
            <button onClick={go} className="tap mx-auto flex h-12 w-full max-w-[440px] items-center justify-center gap-2 rounded-full bg-foreground font-semibold text-background">
              Continue with {plan.name} · ${perDayNum(price.perDay)} / day
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Paid users: the next plan only, what it adds, its price a day, one button. */
function UpgradePanel({
  plans,
  current,
  reason,
  onContinue,
  paymentsOff,
}: {
  plans: PaywallPlan[];
  current: CurrentPlan;
  reason?: string;
  onContinue: (c: CheckoutChoice) => void;
  paymentsOff: boolean;
}) {
  const order = ["starter", "pro", "global"];
  const next = plans.find((p) => order.indexOf(p.key) === order.indexOf(current.key) + 1);
  if (!next) {
    return (
      <div className="px-6 pb-8 pt-16 text-center">
        <h2 className="text-3xl font-semibold">You’re on our biggest plan.</h2>
        <p className="mt-2 text-sm text-muted-foreground">{reason || "Global already has the most capsules, pieces and look plans."}</p>
        <a href="/account" className="tap mt-6 inline-block rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Manage billing</a>
      </div>
    );
  }
  return (
    <div className="overflow-y-auto px-6 pb-8 pt-14 sm:pt-16">
      {reason && <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{reason}</div>}
      <h2 className="mt-2 text-[32px] font-semibold leading-tight">Get more with {next.name}</h2>
      <ul className="mt-5 space-y-2.5">
        {next.adds.map((a) => (
          <li key={a} className="flex gap-2.5 text-[15px]">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-3" strokeWidth={3} aria-hidden />
            </span>
            {a}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-baseline gap-2">
        <span className="font-display text-5xl font-semibold tabular-nums">${perDayNum(next.month.perDay)}</span>
        <span className="text-sm text-muted-foreground">/ day · {money(next.month.cents)} / month</span>
      </div>
      {paymentsOff && <p role="status" className="mt-4 rounded-2xl bg-muted px-4 py-3 text-sm">Payments open in a moment. Nothing changed on your plan.</p>}
      <button
        onClick={() => onContinue({ planId: next.id, planName: next.name, period: "month", priceLabel: `${money(next.month.cents)} / month` })}
        className="tap mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground font-semibold text-background"
      >
        Upgrade to {next.name} <ArrowRight className="size-4" aria-hidden />
      </button>
      <p className="mt-2.5 text-center text-xs text-muted-foreground">Your {current.name} plan stops at the end of its period — never two plans billed.</p>
    </div>
  );
}

export function UpgradeButton({ className, label = "Upgrade", reason }: { className?: string; label?: string; reason?: string }) {
  const { open } = usePaywall();
  return (
    <button onClick={() => open({ reason })} className={className}>
      {label}
    </button>
  );
}

/** Opens the paywall once on mount (e.g. right after sign-up over the result). */
export function AutoPaywall(o: OpenOpts) {
  const { open } = usePaywall();
  const done = React.useRef(false);
  React.useEffect(() => {
    if (done.current) return;
    done.current = true;
    open(o);
  }, [open, o]);
  return null;
}

/** /pricing for signed-in users: the same paywall, inline. */
export function InlinePaywall({ plans, title, line }: { plans: PaywallPlan[]; title?: string; line?: string }) {
  const { checkout, paymentsOff, trialEligible, onTrialStarted } = usePaywall();
  return <PaywallPanel plans={plans} title={title} line={line} trialEligible={trialEligible} paymentsOff={paymentsOff} onContinue={checkout} onTrialStarted={onTrialStarted} />;
}

/** Fallback buyers come back on /dashboard?paid=1&ref=…: confirm the same way and play the same unlock moment. */
export function ConfirmReturn({ refId }: { refId: string }) {
  const { confirm } = usePaywall();
  const done = React.useRef(false);
  React.useEffect(() => {
    if (done.current) return;
    done.current = true;
    confirm(refId);
    window.history.replaceState(null, "", "/dashboard");
  }, [confirm, refId]);
  return null;
}
