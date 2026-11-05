import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { TryHero } from "@/components/capsule/try-hero";
import { Vsl } from "@/components/landing/vsl";
import { CountUp, Reveal, StickyCta } from "@/components/landing/motion-bits";
import { LooksLoop, SnapLoop, SuitcaseLoop, TripLoop, WeatherLoop } from "@/components/landing/feature-loops";

const hasVideo = fs.existsSync(path.join(process.cwd(), "public", "vsl.mp4"));

const FAQ = [
  ["Do I need to photograph my whole closet?", "No. Start with one piece you love. FitLook fills the rest of the capsule with classic basics, and you swap in your own clothes whenever you like."],
  ["Will it work with my clothes?", "Yes: tops, bottoms, dresses, layers, shoes and accessories. Lay the piece flat on a plain surface (a bed, the floor) for the cleanest cut-out."],
  ["What does it cost?", "You try it free first. The plans show up once your capsule is ready."],
  ["Is my photo private?", "Yes. It’s stored privately in the US, only you can see it unless you share your capsule, and you can delete it in one tap."],
  ["Does it know the weather?", "You pick the kind of trip, and in the app you set your dates, temperatures and rain. FitLook layers and swaps pieces to match. It doesn’t read a live forecast."],
  ["Is there an app to download?", "No download needed. FitLook works in your phone’s browser, and you can add it to your home screen like an app."],
];

export default function Landing() {
  return (
    <>
      <Script src="https://kwop.io/flow.js" data-site="s_ff5952e9df" strategy="afterInteractive" />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1.5 sm:gap-3">
            <Link href="/login" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-muted">Log in</Link>
            <ThemeToggle />
            <a href="#try" className="tap hidden rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background sm:block">Pack my carry-on</a>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO — the product itself */}
        <section className="mx-auto grid max-w-[1120px] gap-8 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:pb-28 lg:pt-16">
          <div className="min-w-0 lg:pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Your AI stylist for every trip</p>
            <h1 className="mt-3 text-[42px] leading-[1.04] sm:text-6xl lg:text-[64px]">
              Two weeks of outfits. <em className="font-normal">One</em>{" "}
              <span className="bg-[linear-gradient(transparent_58%,var(--primary)_58%,var(--primary)_92%,transparent_92%)] px-1 [box-decoration-break:clone]">carry-on.</span>
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted-foreground">
              Snap one piece you’d pack. FitLook builds the <b className="text-foreground">whole capsule</b> and a <b className="text-foreground">look for every day</b>.
            </p>
            <ul className="mt-6 hidden space-y-2 text-sm lg:block">
              {["Free to try · No card", "Ready in about 10 seconds", "Your photo stays private"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="size-4" aria-hidden /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <TryHero />
          </div>
        </section>

        {/* VSL */}
        <section className="mx-auto max-w-[1120px] px-4 pb-16 sm:px-6 lg:pb-28">
          <Reveal>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-3xl sm:text-4xl">FitLook in 60 seconds</h2>
              <span className="text-xs text-muted-foreground">Sound off · captions on</span>
            </div>
            <Vsl video={hasVideo} />
          </Reveal>
        </section>

        {/* PROBLEM */}
        <section className="border-y border-border bg-muted/60">
          <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:py-28">
            <Reveal><h2 className="max-w-2xl text-4xl sm:text-5xl">The suitcase problem, <em className="font-normal">every</em> trip.</h2></Reveal>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["You overpack “just in case”", "Half the bag comes home unworn — and you paid the checked-bag fee for it."],
                ["Hotel-room outfit panic", "Every morning: clothes on the bed, twenty minutes gone, still nothing goes together."],
                ["“Wait, did I pack that?”", "You can’t remember what you brought, so you buy it again at the airport."],
              ].map(([t, d], i) => (
                <Reveal key={t} i={i} className="rounded-[18px] border border-border bg-background p-6">
                  <div className="font-display text-5xl font-semibold text-muted-foreground/40">0{i + 1}</div>
                  <div className="mt-3 text-lg font-semibold">{t}</div>
                  <p className="mt-2 text-muted-foreground">{d}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:py-28">
          <Reveal><h2 className="text-4xl sm:text-5xl">How it works</h2></Reveal>
          <div className="mt-10 grid gap-12 md:grid-cols-3 md:gap-6">
            {[
              [<SnapLoop key="a" />, "Snap clothes", "Lay a piece flat, take a photo. The background disappears."],
              [<TripLoop key="b" />, "Add your trip", "Where you’re going, how long, how warm."],
              [<LooksLoop key="c" />, "Get your looks", "A capsule that fits one carry-on, and a look for every day."],
            ].map(([visual, t, d], i) => (
              <Reveal key={t as string} i={i} className="text-center">
                {visual}
                <div className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Step {i + 1}</div>
                <div className="font-display mt-1 text-2xl font-semibold">{t as string}</div>
                <p className="mx-auto mt-1 max-w-xs text-muted-foreground">{d as string}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* THE PRODUCT IN ACTION */}
        <section className="bg-[#0a0a0a] text-[#f5f5f2]">
          <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:py-28">
            <Reveal><h2 className="max-w-2xl text-4xl sm:text-5xl">Everything for the trip, in one place.</h2></Reveal>
            <div className="mt-10 grid gap-4 text-[#0a0a0a] sm:grid-cols-2">
              <Reveal i={0} className="rounded-[20px] bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Closet Digitizer</div>
                <div className="font-display mt-1 text-2xl font-semibold">Your clothes, cut out in seconds</div>
                <div className="checker mt-4 flex h-44 items-center justify-center overflow-hidden rounded-2xl p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/sample/striped-tee-cutout.png" alt="A tee with the background removed" className="h-full w-auto max-w-full object-contain drop-shadow-xl" />
                </div>
              </Reveal>
              <Reveal i={1} className="rounded-[20px] bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Trip Planner</div>
                <div className="font-display mt-1 text-2xl font-semibold">Packed for the weather you set</div>
                <div className="mt-4"><WeatherLoop /></div>
              </Reveal>
              <Reveal i={2} className="rounded-[20px] bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">AI Matcher</div>
                <div className="font-display mt-1 text-2xl font-semibold">A different look every day</div>
                <div className="mt-4 overflow-hidden rounded-2xl"><LooksLoop /></div>
              </Reveal>
              <Reveal i={3} className="rounded-[20px] bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Suitcase View</div>
                <div className="font-display mt-1 text-2xl font-semibold">Check it off, leave nothing behind</div>
                <div className="mt-4"><SuitcaseLoop /></div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* WHAT CHANGES */}
        <section className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:py-28">
          <Reveal><h2 className="text-4xl sm:text-5xl">What changes on your next trip</h2></Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              [14, "", "looks planned, one per day of a two-week trip"],
              [10, " s", "about the time to your first capsule"],
              [1, "", "carry-on. That’s the whole bag."],
            ].map(([n, s, d], i) => (
              <Reveal key={d as string} i={i} className="border-t-2 border-foreground pt-4">
                <CountUp to={n as number} suffix={s as string} className="font-display text-7xl font-semibold" />
                <p className="mt-2 text-muted-foreground">{d as string}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* THE USUAL WAY vs FITLOOK */}
        <section className="mx-auto max-w-[1120px] px-4 pb-16 sm:px-6 lg:pb-28">
          <Reveal><h2 className="text-4xl sm:text-5xl">The usual way vs FitLook</h2></Reveal>
          <Reveal i={1} className="mt-8 overflow-hidden rounded-[20px] border border-border">
            <table className="w-full text-left text-[15px]">
              <thead className="bg-muted text-xs uppercase tracking-[0.15em] text-muted-foreground">
                <tr><th className="p-4 font-semibold"> </th><th className="p-4 font-semibold">The usual way</th><th className="p-4 font-semibold text-foreground">FitLook</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Planning", "An evening of trying things on", "One photo, about 10 seconds"],
                  ["What you bring", "“Just in case” pieces", "Only what makes a look"],
                  ["Each morning", "Outfit panic in the hotel room", "Today’s look, already decided"],
                  ["Leaving", "“Did I forget something?”", "A checklist you tick off"],
                ].map(([k, a, b]) => (
                  <tr key={k}>
                    <th className="p-4 font-semibold">{k}</th>
                    <td className="p-4 text-muted-foreground"><span className="inline-flex items-start gap-2"><Minus className="mt-1 size-4 shrink-0" aria-hidden />{a}</span></td>
                    <td className="p-4"><span className="inline-flex items-start gap-2"><Check className="mt-1 size-4 shrink-0 rounded-full bg-primary p-0.5 text-primary-foreground" strokeWidth={3} aria-hidden />{b}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </section>

        {/* QUESTIONS */}
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:pb-28">
          <Reveal><h2 className="text-4xl sm:text-5xl">Questions</h2></Reveal>
          <Reveal i={1} className="mt-6 divide-y divide-border border-y border-border">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold">
                  {q} <span className="text-2xl font-light transition group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-2 leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </Reveal>
        </section>

        {/* FINAL */}
        <section className="mx-auto max-w-[1120px] px-4 pb-24 sm:px-6">
          <Reveal className="rounded-[24px] bg-primary px-6 py-14 text-center text-primary-foreground sm:py-20">
            <h2 className="text-4xl sm:text-6xl">Tonight: pack once,<br /><em className="font-normal">wear it all trip.</em></h2>
            <p className="mx-auto mt-4 max-w-md opacity-80">Snap one piece now. Your 14 looks are ready before the kettle boils.</p>
            <a href="#try" className="tap mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-[#0a0a0a] px-8 text-[16px] font-semibold text-white">
              Pack my carry-on <ArrowRight className="size-4" aria-hidden />
            </a>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-4 py-10 pb-28 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-10">
          <Logo className="text-base text-foreground" />
          <div className="flex flex-wrap gap-5">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/login" className="hover:text-foreground">Log in</Link>
            <span>© {new Date().getFullYear()} FitLook</span>
          </div>
        </div>
      </footer>
      <StickyCta />
    </>
  );
}
