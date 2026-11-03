import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type PlanCard = { key: string; name: string; price: number; tagline: string; benefits: string[]; href: string; current?: boolean };

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
