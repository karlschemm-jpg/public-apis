import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, PartyPopper, Shirt, Sparkles } from "lucide-react";
import { requireUser, getUsage } from "@/lib/session";
import { formatDate, TRIP_LABEL, type TripType } from "@/lib/utils";
import { ConfirmReturn, UpgradeButton } from "@/components/paywall";
import { RefreshSoon } from "./refresh-soon";

export const metadata: Metadata = { title: "Home" };

function Meter({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(1, max)) * 100));
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-black">
        {used}
        <span className="text-base font-semibold text-muted-foreground"> / {max}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ paid?: string; ref?: string }> }) {
  const { paid, ref } = await searchParams;
  const refId = ref && /^[\w-]{3,80}$/.test(ref) ? ref : null;
  const { user, profile, plan, def, supabase } = await requireUser({ fresh: paid === "1" });
  const [usage, { data: trips }, { count: outfitCount }] = await Promise.all([
    getUsage(user.id, profile, plan),
    supabase.from("trips").select("id,destination,start_date,days,trip_type,is_example").order("start_date", { ascending: true, nullsFirst: false }).limit(3),
    supabase.from("outfits").select("id", { count: "exact", head: true }),
  ]);
  const name = profile.display_name || (user.email!.split("@")[0].split("+")[0] || "there").replace(/^./, (c) => c.toUpperCase());
  const steps = [
    { done: usage.items > 0, label: "Snap your clothes", href: "/wardrobe", icon: Shirt },
    { done: (trips || []).some((t) => !t.is_example), label: "Add your trip", href: "/trips", icon: CalendarDays },
    { done: (outfitCount ?? 0) > 0, label: "Get your looks", href: "/outfits", icon: Sparkles },
  ];

  return (
    <div className="space-y-8">
      {refId && <ConfirmReturn refId={refId} />}
      {paid === "1" && !refId &&
        (plan.paid ? (
          <div className="animate-pop rounded-[2rem] bg-primary p-6 text-primary-foreground">
            <PartyPopper className="size-8" />
            <h2 className="mt-3 text-3xl font-black tracking-tight">You’re on {plan.name}!</h2>
            <p className="mt-1 opacity-80">Here’s what’s unlocked:</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {def.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 font-semibold">
                  <Check className="size-4" /> {b}
                </li>
              ))}
            </ul>
            <Link href="/wardrobe" className="tap mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background">
              Keep digitizing <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-foreground p-6">
            <h2 className="text-xl font-black">Confirming your payment…</h2>
            <p className="mt-1 text-muted-foreground">This usually takes a few seconds. This page refreshes on its own.</p>
            <RefreshSoon />
          </div>
        ))}

      <div>
        <h1 className="text-4xl sm:text-5xl">Hey {name}.</h1>
        <p className="mt-1 text-muted-foreground">
          You’re on <b className="text-foreground">{plan.name}</b>
          {plan.stale ? " (last known)" : ""}. Usage resets on the 1st of each month.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Meter label={def.key === "free" ? "Free scans" : "Closet items"} used={def.key === "free" ? usage.digitize : usage.items} max={def.key === "free" ? def.digitize : def.items} />
        <Meter label="Trips this month" used={usage.trip} max={def.trips} />
        <Meter label="Outfit plans this month" used={usage.generate} max={def.generate} />
      </div>
      {def.key === "free" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-foreground p-5 text-background">
          <div>
            <div className="font-black">Ready to pack your whole closet?</div>
            <div className="text-sm opacity-70">Starter gives you 50 pieces and 2 capsules a month, from $0.17 a day.</div>
          </div>
          <UpgradeButton className="tap rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground" label="See plans" />
        </div>
      )}

      <section>
        <h2 className="mb-3 text-xl font-black">Your carry-on in 3 steps</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <Link key={s.href} href={s.href} className="lift group flex items-center gap-3 rounded-3xl border border-border bg-card p-4 hover:border-foreground">
              <span className={`grid size-10 shrink-0 place-items-center rounded-full font-black ${s.done ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {s.done ? <Check className="size-5" /> : i + 1}
              </span>
              <span className="font-bold">{s.label}</span>
              <ArrowRight className="ml-auto size-4 opacity-0 transition group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">Upcoming trips</h2>
          <Link href="/trips" className="text-sm font-bold underline-offset-4 hover:underline">All trips</Link>
        </div>
        {trips?.length ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {trips.map((t) => (
              <Link key={t.id} href={`/trips/${t.id}`} className="lift rounded-3xl border border-border bg-card p-5 hover:border-foreground">
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{TRIP_LABEL[t.trip_type as TripType]}</div>
                <div className="mt-1 text-lg font-black">{t.destination}</div>
                <div className="text-sm text-muted-foreground">{formatDate(t.start_date)} · {t.days} days</div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No trips yet. <Link href="/trips" className="font-bold text-foreground underline">Plan one</Link></p>
        )}
      </section>
    </div>
  );
}
