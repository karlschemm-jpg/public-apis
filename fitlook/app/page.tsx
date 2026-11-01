import Link from "next/link";
import { ArrowRight, Camera, CalendarDays, Luggage, Shirt, Sparkles, Wand2, X } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site";
import { PlanCards } from "@/components/plan-cards";
import { PAID_PLANS } from "@/lib/plans";

const LOOKS = [
  ["tee", "jeans", "sneakers"],
  ["linen-shirt", "chinos", "loafers"],
  ["dress", "sandals", "sunglasses"],
  ["sweater", "jeans", "boots"],
  ["tee", "shorts", "sneakers"],
  ["blazer", "chinos", "loafers"],
  ["linen-shirt", "shorts", "sandals"],
];

function StartFree({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/signup"
      className={`inline-flex h-13 items-center gap-2 rounded-full bg-primary px-7 text-base font-black text-primary-foreground shadow-[0_8px_30px_-8px_#c8ff3d] transition hover:brightness-95 active:scale-[0.98] ${className}`}
    >
      Start free <ArrowRight className="size-5" />
    </Link>
  );
}

export default function Landing() {
  const cards = PAID_PLANS.map((p) => ({ key: p.key, name: p.name, price: p.price, tagline: p.tagline, benefits: p.benefits, href: `/signup?plan=${p.name}` }));
  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO: the result + the product working */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold">
              <Sparkles className="size-3.5" /> Your AI stylist for every trip
            </div>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              2 weeks of outfits.
              <br />
              <span className="bg-primary px-2 text-primary-foreground [box-decoration-break:clone]">One carry-on.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Snap your clothes, tell FitLook where you&apos;re headed, and get a ready-to-wear look for every single day — packed into the smallest
              bag you own.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <StartFree />
              <span className="text-sm text-muted-foreground">Free · No credit card · 30 seconds</span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-border bg-card p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Lisbon · 14 days · 64–78°F</div>
                  <div className="text-xl font-black">Your carry-on capsule</div>
                </div>
                <div className="rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground">11 pieces → 14 looks</div>
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="aspect-[4/5] overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/sample/striped-tee.jpg" alt="A striped tee photographed on a bed" className="size-full object-cover" />
                </div>
                <Wand2 className="size-6" />
                <div className="checker grid aspect-[4/5] place-items-center rounded-2xl p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/examples/tee.svg" alt="The same tee with the background removed" className="w-full drop-shadow-xl" />
                </div>
              </div>
              <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
                {LOOKS.map((look, i) => (
                  <div key={i} className="w-24 shrink-0 rounded-2xl bg-muted p-2">
                    <div className="mb-1 text-[10px] font-black uppercase">Day {i + 1}</div>
                    <div className="grid gap-1">
                      {look.map((g) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={g} src={`/examples/${g}.svg`} alt="" className="mx-auto h-10" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 flex items-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background shadow-xl">
              <Luggage className="size-5 text-primary" /> Fits in one carry-on
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="border-y border-border bg-muted/50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Sound familiar?</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["You overpack “just in case”", "Half the suitcase comes home unworn — and you paid the checked-bag fee for it."],
                ["Hotel-room outfit panic", "Every morning: clothes on the bed, 30 minutes gone, still nothing goes together."],
                ["“Wait, did I pack that?”", "You can’t remember what you brought, so you buy it again at the airport."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-3xl bg-card p-6">
                  <X className="mb-3 size-6 rounded-full bg-foreground p-1 text-background" />
                  <div className="text-lg font-bold">{t}</div>
                  <p className="mt-2 text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOLUTION */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Your closet, your trip, one smart stylist.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              [Camera, "Closet Digitizer", "Upload a photo, the background disappears instantly. Your clothes, clean and ready to mix."],
              [CalendarDays, "Trip Planner", "Destination, days and forecast in. A tailored capsule packing list out."],
              [Shirt, "AI Matcher", "Full outfits for every day — tops, bottoms, layers, shoes and accessories that work together."],
              [Luggage, "Suitcase View", "Everything you’re bringing in one swipeable list. Check it off, leave nothing behind."],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof Camera;
              return (
                <div key={t as string} className="rounded-3xl border border-border bg-card p-6">
                  <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                    <I className="size-6" />
                  </div>
                  <div className="text-xl font-black">{t as string}</div>
                  <p className="mt-2 text-muted-foreground">{d as string}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-foreground text-background">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">How it works</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                ["Snap clothes", "Take quick photos of your favorite pieces. We clean them up instantly."],
                ["Add trip details", "Where you’re going, how long, and the weather forecast."],
                ["Get looks", "Your complete day-by-day outfit schedule — and a packing list to match."],
              ].map(([t, d], i) => (
                <div key={t}>
                  <div className="mb-3 grid size-12 place-items-center rounded-full bg-primary text-xl font-black text-primary-foreground">{i + 1}</div>
                  <div className="text-xl font-black">{t}</div>
                  <p className="mt-2 opacity-70">{d}</p>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <StartFree />
            </div>
          </div>
        </section>

        {/* PLANS */}
        <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Start free. Upgrade when you’re hooked.</h2>
          <p className="mt-2 text-muted-foreground">Every account starts free with 3 Closet Digitizer scans. Cancel anytime.</p>
          <div className="mt-10">
            <PlanCards plans={cards} cta="Start with" />
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          <h2 className="text-3xl font-black tracking-tight">Questions</h2>
          <div className="mt-6 divide-y divide-border rounded-3xl border border-border bg-card">
            {[
              ["Do I need a credit card to try it?", "No. Sign up with your email and start digitizing your closet for free."],
              ["What photos work best?", "Lay the item flat on a plain surface — a bed, a floor, a wall. Good light helps. The background is removed in seconds."],
              ["Does it really fit in a carry-on?", "FitLook builds a capsule: the fewest pieces that still give you a different look every day. Most 2-week trips land at 10–14 pieces."],
              ["Can I cancel anytime?", "Yes. Cancel in Account → Billing. You keep your closet and trips on the Free plan."],
              ["Is my closet private?", "Yes. Your photos and trips are only visible to you."],
            ].map(([q, a]) => (
              <details key={q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
                  {q} <span className="text-2xl transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="rounded-[2rem] bg-primary px-6 py-14 text-center text-primary-foreground">
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Your next trip, one bag lighter.</h2>
            <p className="mx-auto mt-3 max-w-md opacity-80">Snap 3 pieces now and watch your first look come together.</p>
            <Link href="/signup" className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-foreground px-7 text-base font-black text-background hover:opacity-90">
              Start free <ArrowRight className="size-5" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
