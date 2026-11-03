import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { requireUser } from "@/lib/session";
import { planCards } from "@/lib/pricing";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav, SideNav } from "@/components/app-nav";
import { PaywallProvider, UpgradeButton } from "@/components/paywall";
import { getTrial, trialEligible } from "@/lib/trial";
import { daysLeft, longDate } from "@/lib/grace";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // server actions here may call Gemini

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, plan } = await requireUser();
  if (!profile.onboarding_done) redirect("/onboarding");
  const free = plan.key === "free";
  const trial = await getTrial(user.id);
  const canTrial = trialEligible(trial, plan);
  const trialing = plan.status === "trialing" && Boolean(plan.until);
  const left = trialing ? daysLeft(plan.until!) : 0;
  const trialOver = Boolean(trial && !trial.canceled_at && !plan.paid && new Date(trial.ends_at) <= new Date());
  const upgradeCls = "tap inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground hover:brightness-95";

  return (
    <PaywallProvider plans={planCards(user.email!, trialing ? "free" : plan.key, { trial: canTrial })}>
      <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
        <aside className="no-print sticky top-0 hidden h-dvh flex-col border-r border-border p-5 lg:flex">
          <Logo href="/dashboard" />
          <div className="mt-8 flex-1">
            <SideNav />
          </div>
          {free ? (
            <div className="rounded-3xl bg-foreground p-5 text-background">
              <div className="font-black">Pack your whole closet</div>
              <p className="mt-1 text-sm opacity-70">More scans, more trips, smarter looks.</p>
              <UpgradeButton className={`${upgradeCls} mt-4 w-full justify-center`} label="Upgrade" />
            </div>
          ) : (
            <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
              <span className="text-muted-foreground">Plan</span> <b>{plan.name}</b>
            </div>
          )}
        </aside>

        <div className="min-w-0">
          <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur lg:px-8">
            <Logo href="/dashboard" className="lg:invisible" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {free && (
                <UpgradeButton className={upgradeCls} label="Upgrade" />
              )}
              {!free && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-bold">
                  <Zap className="size-3.5" /> {plan.name}
                </span>
              )}
            </div>
          </header>
          {trialing && (
            <div role="status" className="no-print flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-border bg-warm px-4 py-2.5 text-sm text-slate">
              <span>
                <b>{plan.name} trial</b> · {left} day{left === 1 ? "" : "s"} left · ends {longDate(plan.until!)}
              </span>
              <UpgradeButton className="tap rounded-full bg-slate px-3 py-1 text-xs font-black text-warm" label="Subscribe" reason={`Keep ${plan.name} after your trial`} />
            </div>
          )}
          {trialOver && (
            <div role="status" className="no-print flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-border bg-warm px-4 py-2.5 text-sm text-slate">
              <span>
                Your <b>{trial!.plan_name}</b> trial ended. Your closet, trips and looks are safe.
              </span>
              <UpgradeButton className="tap rounded-full bg-slate px-3 py-1 text-xs font-black text-warm" label={`Keep ${trial!.plan_name}`} reason={`Your ${trial!.plan_name} trial ended`} />
            </div>
          )}
          <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 lg:px-8 lg:pb-12">{children}</main>
        </div>
      </div>
      <BottomNav />
    </PaywallProvider>
  );
}
