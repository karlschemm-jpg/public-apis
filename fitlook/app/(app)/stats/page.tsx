import type { Metadata } from "next";
import Link from "next/link";
import { Camera, Minus, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getStats, type Metric } from "@/lib/stats";
import { track } from "@/lib/kwop";
import { PageTitle, Empty } from "@/components/empty";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Stats" };

const STAGGER_MS = 70;
const glass = "rounded-3xl border border-white/60 bg-card/75 shadow-[0_8px_30px_-12px_rgba(60,40,20,0.18)] backdrop-blur-md dark:border-white/10";

function TrendIcon({ dir }: { dir: Metric["trend"]["dir"] }) {
  const Icon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus;
  return <Icon aria-hidden className={cn("size-4 shrink-0", dir === "up" ? "text-sage" : dir === "down" ? "text-terracotta" : "text-muted-foreground")} />;
}

export default async function StatsPage() {
  const { user, supabase } = await requireUser();
  const stats = await getStats(supabase);
  track("feature_used", user.email!, "Stats");

  if (stats.empty) {
    return (
      <div>
        <PageTitle title="Stats" sub="Your packing and style, at a glance." />
        <Empty text="No stats yet. Snap your first piece and your numbers start here." cta="Go to Wardrobe" href="/wardrobe" />
      </div>
    );
  }

  let n = 0;
  const delay = () => ({ animationDelay: `${n++ * STAGGER_MS}ms` });

  return (
    <div className="relative">
      {/* warm neutral backdrop so the frosted cards have something to blur */}
      <div aria-hidden className="pointer-events-none absolute -inset-x-4 -top-6 bottom-0 -z-10 overflow-hidden rounded-[2.5rem] bg-warm lg:-inset-x-8">
        <div className="absolute -left-16 top-10 size-64 rounded-full bg-terracotta/25 blur-3xl" />
        <div className="absolute -right-10 top-72 size-72 rounded-full bg-sage/25 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 size-56 rounded-full bg-primary/30 blur-3xl" />
      </div>

      <PageTitle title="Stats" sub="Your packing and style, at a glance." />

      {stats.starter && (
        <div className={cn(glass, "animate-fade-up mb-3 flex flex-wrap items-center justify-between gap-3 p-4")} style={delay()}>
          <p className="text-sm font-semibold">Your numbers start with your first real piece.</p>
          <Link href="/wardrobe" className="tap inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground hover:brightness-95">
            <Camera className="size-4" /> Snap a piece
          </Link>
        </div>
      )}

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.metrics.map((m) => (
          <div key={m.key} className={cn(glass, "animate-fade-up flex flex-col p-4 sm:p-5")} style={delay()}>
            <div className="text-4xl font-black tracking-tight tabular-nums sm:text-5xl">{m.value}</div>
            <div className="mt-1 text-sm font-semibold">{m.label}</div>
            <div className="mt-auto flex items-start gap-1.5 pt-3 text-xs font-medium text-muted-foreground">
              <TrendIcon dir={m.trend.dir} />
              <span>{m.trend.label}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section aria-labelledby="top-pieces" className={cn(glass, "animate-fade-up p-5")} style={delay()}>
          <h2 id="top-pieces" className="flex items-center gap-2 text-lg font-black">
            <Trophy aria-hidden className="size-5 text-terracotta" /> Most-styled pieces
          </h2>
          {stats.topPieces.length ? (
            <ol className="mt-4 grid grid-cols-3 gap-3">
              {stats.topPieces.map((p, i) => (
                <li key={p.id} className="text-center">
                  <div className="checker relative grid aspect-square place-items-center rounded-2xl p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image_url} alt={p.name} className="max-h-full max-w-full object-contain drop-shadow-md" loading="lazy" />
                    <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-foreground text-xs font-black text-background">{i + 1}</span>
                  </div>
                  <div className="mt-1.5 truncate text-sm font-bold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">in {p.count} look{p.count === 1 ? "" : "s"}</div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Style a trip in Outfits to see which pieces work hardest.</p>
          )}
        </section>

        <section aria-labelledby="style-mix" className={cn(glass, "animate-fade-up p-5")} style={delay()}>
          <h2 id="style-mix" className="text-lg font-black">Your closet mix</h2>
          <ul className="mt-4 space-y-2.5">
            {stats.categories.map((c) => (
              <li key={c.label}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{c.label}</span>
                  <span className="tabular-nums text-muted-foreground">{c.count} · {c.pct}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted" role="presentation">
                  <div className="h-full rounded-full bg-sage" style={{ width: `${Math.max(4, c.pct)}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {stats.colors.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {stats.colors.map((c) => (
                <span key={c.label} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold first-letter:uppercase">
                  {c.label} <span className="text-muted-foreground">×{c.count}</span>
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      {stats.travel.length > 0 && (
        <section aria-labelledby="travel" className={cn(glass, "animate-fade-up mt-3 p-5")} style={delay()}>
          <h2 id="travel" className="text-lg font-black">Travel trends</h2>
          <dl className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.travel.map((t) => (
              <div key={t.label}>
                <dt className="text-xs font-semibold text-muted-foreground">{t.label}</dt>
                <dd className="mt-0.5 font-black">{t.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <p className="mt-4 pb-2 text-xs text-muted-foreground">
        Luggage saved compares your capsule with packing one top, one bottom and one pair of shoes per day (about 1.8 L per piece).
      </p>
    </div>
  );
}
