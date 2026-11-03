import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrialButton } from "@/components/trial-button";

export type PlanCard = {
  key: string; name: string; price: number; tagline: string; benefits: string[]; href: string; current?: boolean;
  /** signed-in user who can still start the 7-day trial: show "Start 7 Days Free" + a small "subscribe now" link */
  trial?: boolean;
  /** visitor link that starts the trial at signup */
  trialHref?: string;
};

export function PlanCards({ plans, highlight = "pro", cta = "Get" }: { plans: PlanCard[]; highlight?: string; cta?: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((p) => {
        const hot = p.key === highlight;
        return (
          <div
            key={p.key}
            className={cn(
              "lift reveal relative flex flex-col rounded-3xl border-2 p-6",
              hot ? "border-foreground bg-foreground text-background md:-translate-y-2 shadow-xl" : "border-border bg-card"
            )}
          >
            {hot && (
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-foreground">
                Most popular
              </span>
            )}
            <div className="text-lg font-black">{p.name}</div>
            <div className={cn("text-sm", hot ? "opacity-70" : "text-muted-foreground")}>{p.tagline}</div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-black tracking-tight">${p.price}</span>
              <span className={cn("text-sm", hot ? "opacity-70" : "text-muted-foreground")}>/month</span>
            </div>
            <ul className="mt-5 mb-6 flex-1 space-y-2.5 text-sm">
              {p.benefits.slice(0, 4).map((b) => (
                <li key={b} className="flex gap-2">
                  <Check className={cn("mt-0.5 size-4 shrink-0", hot ? "text-primary" : "")} />
                  {b}
                </li>
              ))}
            </ul>
            {p.current ? (
              <div className="rounded-full border-2 border-current py-3 text-center text-sm font-bold opacity-70">Your plan</div>
            ) : p.trial ? (
              <div>
                <TrialButton planKey={p.key} planName={p.name} benefits={p.benefits} hot={hot} />
                <a href={p.href} className={cn("mt-1 block text-center text-xs font-semibold underline-offset-4 hover:underline", hot ? "opacity-80" : "text-muted-foreground")}>
                  or subscribe now
                </a>
              </div>
            ) : p.trialHref ? (
              <div>
                <a
                  href={p.trialHref}
                  className={cn(
                    "tap block rounded-full py-3 text-center text-sm font-black shadow-sm hover:shadow-md",
                    hot ? "bg-primary text-primary-foreground" : "bg-foreground text-background"
                  )}
                >
                  Start 7 Days Free
                </a>
                <p className={cn("mt-2 text-center text-xs", hot ? "opacity-70" : "text-muted-foreground")}>No charge today, cancel anytime</p>
              </div>
            ) : (
              <a
                href={p.href}
                className={cn(
                  "tap block rounded-full py-3 text-center text-sm font-bold",
                  hot ? "bg-primary text-primary-foreground hover:brightness-95" : "bg-foreground text-background hover:opacity-90"
                )}
              >
                {cta} {p.name}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
