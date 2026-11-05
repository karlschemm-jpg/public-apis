import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getPlan } from "@/lib/kwop";
import { getTry, tryImageUrl } from "@/lib/tries";
import { TRIP_WEATHER } from "@/lib/capsule";
import { paywallPlans } from "@/lib/paywall-data";
import { getTrial, trialEligible } from "@/lib/trial";
import { Logo } from "@/components/logo";
import { PaywallProvider } from "@/components/paywall";
import { AnonOwnerResult, OwnerResult, PublicResult } from "./result-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const t = await getTry(id);
  if (!t) return { title: "Capsule not found" };
  const w = TRIP_WEATHER[t.trip_type];
  return {
    title: `A ${t.result.days}-day ${w.noun} capsule`,
    description: `${t.result.pieces.length} pieces, ${t.result.days} looks, one carry-on — built around a ${t.piece.name.toLowerCase()} with FitLook.`,
  };
}

export default async function ResultPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ unlock?: string }> }) {
  const { id } = await params;
  const { unlock } = await searchParams;
  const t = await getTry(id);
  if (!t) notFound();
  const user = await getSessionUser().catch(() => null);
  const jar = await cookies();
  const w = TRIP_WEATHER[t.trip_type];
  const c = {
    id: t.id,
    piece: t.piece,
    result: t.result,
    imageUrl: await tryImageUrl(t.image_path),
    tripLabel: w.label,
    title: `Your ${t.result.days}-day ${w.noun} capsule is ready.`,
    line: `Built around your ${t.piece.name.toLowerCase()}: ${t.result.pieces.length} pieces, ${t.result.days} looks, one carry-on.`,
  };
  const isOwner = Boolean(user && t.user_id === user.id);
  const isAnonOwner = !t.user_id && jar.get("fl_try")?.value === t.id;

  const header = (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-6">
        <Logo href={user ? "/start" : "/"} />
        {user ? (
          <Link href="/dashboard" className="text-sm font-semibold underline-offset-4 hover:underline">My closet</Link>
        ) : (
          <Link href="/login" className="text-sm font-semibold underline-offset-4 hover:underline">Log in</Link>
        )}
      </div>
    </header>
  );

  if (isOwner && user?.email) {
    const plan = await getPlan(user.email, { userId: user.id });
    const plans = await paywallPlans();
    const trial = await getTrial(user.id);
    const pro = plans.find((p) => p.recommended) ?? plans[0];
    return (
      <PaywallProvider plans={plans} current={{ key: plan.key, name: plan.name, paid: plan.paid, status: plan.status }} trialEligible={trialEligible(trial, plan)}>
        {header}
        <main className="mx-auto max-w-[1120px] px-4 pb-32 pt-6 sm:px-6">
          <h1 className="mb-5 text-[34px] font-semibold leading-tight sm:text-5xl">{plan.paid ? `Your ${t.result.days}-day ${w.noun} capsule` : c.title}</h1>
          <OwnerResult c={c} locked={!plan.paid} autoOpen={unlock === "1"} perDay={pro?.month.perDay ?? "$0.30"} tripId={t.trip_id} />
        </main>
      </PaywallProvider>
    );
  }

  return (
    <>
      <Script src="https://kwop.io/flow.js" data-site="s_ff5952e9df" strategy="afterInteractive" />
      {header}
      <main className="mx-auto max-w-[1120px] px-4 pb-24 pt-6 sm:px-6">
        {isAnonOwner ? (
          <>
            <h1 className="mb-5 text-[34px] font-semibold leading-tight sm:text-5xl">{c.title}</h1>
            <AnonOwnerResult c={c} />
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Made with FitLook</p>
            <h1 className="mb-5 mt-1 text-[34px] font-semibold leading-tight sm:text-5xl">A {t.result.days}-day {w.noun} capsule, one carry-on.</h1>
            <PublicResult c={c} />
          </>
        )}
      </main>
    </>
  );
}
