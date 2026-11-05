"use client";
import { useState, useTransition } from "react";
import { Activity, ArrowLeft, Briefcase, Building2, CalendarDays, CircleHelp, Footprints, Layers, Loader2, Luggage, Moon, MountainSnow, Palmtree, Plane, Shirt, Sparkles, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { finishOnboarding, saveOnboardingAnswer } from "@/app/actions";

type Field = "trip_style" | "pain" | "style_vibe" | "trip_length";
const STEPS: { field: Field; title: string; sub: string; options: { value: string; icon: LucideIcon; label: string; hint: string }[] }[] = [
  {
    field: "trip_style",
    title: "Where are you headed next?",
    sub: "We’ll start your closet with pieces for it.",
    options: [
      { value: "beach", icon: Palmtree, label: "Beach & sun", hint: "Miami, Cancún, Hawaii" },
      { value: "city", icon: Building2, label: "City break", hint: "NYC, Paris, Lisbon" },
      { value: "cold", icon: MountainSnow, label: "Cold & snowy", hint: "Aspen, Denver, Banff" },
      { value: "work", icon: Briefcase, label: "Work trip", hint: "Meetings & dinners" },
    ],
  },
  {
    field: "pain",
    title: "What’s your packing struggle?",
    sub: "Be honest. We’ve all been there.",
    options: [
      { value: "overpack", icon: Luggage, label: "I overpack", hint: "Half comes home unworn" },
      { value: "matching", icon: Shirt, label: "Nothing matches", hint: "Outfit panic every morning" },
      { value: "forget", icon: CircleHelp, label: "I forget things", hint: "Bought it again at the airport" },
      { value: "all", icon: Layers, label: "All of the above", hint: "Help me" },
    ],
  },
  {
    field: "style_vibe",
    title: "Your style in one word?",
    sub: "It shapes the looks we put together.",
    options: [
      { value: "casual", icon: Footprints, label: "Casual", hint: "Tees, denim, sneakers" },
      { value: "classic", icon: Shirt, label: "Classic", hint: "Clean lines, neutrals" },
      { value: "bold", icon: Sparkles, label: "Bold", hint: "Color, prints, statements" },
      { value: "sporty", icon: Activity, label: "Sporty", hint: "Athleisure all day" },
    ],
  },
  {
    field: "trip_length",
    title: "How long are your trips usually?",
    sub: "We’ll size your capsule to match.",
    options: [
      { value: "weekend", icon: Moon, label: "A weekend", hint: "2–3 days" },
      { value: "week", icon: CalendarDays, label: "About a week", hint: "5–7 days" },
      { value: "two_weeks", icon: Plane, label: "Two weeks+", hint: "The big one" },
    ],
  },
];

export function Onboarding({ initial }: { initial: Partial<Record<Field, string | null>> }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(initial);
  const [saving, startSave] = useTransition();
  const [finishing, startFinish] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  const next = () => {
    if (last) startFinish(() => finishOnboarding());
    else setStep(step + 1);
  };
  const choose = (value: string) => {
    setAnswers((a) => ({ ...a, [s.field]: value }));
    setError(null);
    startSave(async () => {
      const res = await saveOnboardingAnswer(s.field, value);
      if (res.error) setError(res.error);
      else next();
    });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-xl px-4 pt-5">
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-sm font-semibold hover:bg-muted">
              <ArrowLeft className="size-4" /> Back
            </button>
          ) : (
            <Logo href="#" className="text-base" />
          )}
          <span className="text-sm font-semibold text-muted-foreground">{step + 1} / {STEPS.length}</span>
          <button onClick={next} disabled={finishing} className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
            Skip
          </button>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-10 pt-10">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{s.title}</h1>
        <p className="mt-2 text-muted-foreground">{s.sub}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {s.options.map((o) => {
            const selected = answers[s.field] === o.value;
            return (
              <button
                key={o.value}
                onClick={() => choose(o.value)}
                disabled={saving || finishing}
                className={cn(
                  "lift flex items-center gap-4 rounded-3xl border-2 p-5 text-left hover:border-foreground disabled:opacity-60",
                  selected ? "border-foreground bg-primary text-primary-foreground" : "border-border bg-card"
                )}
              >
                <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", selected ? "bg-primary-foreground/10" : "bg-muted")}><o.icon className="size-6" aria-hidden /></span>
                <span>
                  <span className="block text-lg font-black">{o.label}</span>
                  <span className={cn("block text-sm", selected ? "opacity-70" : "text-muted-foreground")}>{o.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
        {finishing && (
          <p className="mt-6 inline-flex items-center gap-2 font-semibold">
            <Loader2 className="size-4 animate-spin" /> Setting up your closet…
          </p>
        )}
      </main>
    </div>
  );
}
