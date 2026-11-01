import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { requireUser } from "@/lib/session";
import { planCards } from "@/lib/pricing";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav, SideNav } from "@/components/app-nav";
import { PaywallProvider, UpgradeButton } from "@/components/paywall";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, plan } = await requireUser();
  if (!profile.onboarding_done) redirect("/onboarding");
  const free = plan.key === "free";
  const upgradeCls = "inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground hover:brightness-95";

  return (
    <PaywallProvider plans={planCards(user.email!, plan.key)}>
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
          <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 lg:px-8 lg:pb-12">{children}</main>
        </div>
      </div>
      <BottomNav />
    </PaywallProvider>
  );
}
