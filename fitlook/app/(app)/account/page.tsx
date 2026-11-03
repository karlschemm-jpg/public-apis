import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { requireUser, getUsage } from "@/lib/session";
import { nextPlan } from "@/lib/plans";
import { daysLeft, longDate, TRIAL_DAYS } from "@/lib/grace";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/empty";
import { Button } from "@/components/ui/button";
import { UpgradeButton } from "@/components/paywall";
import { signOutAction } from "@/app/actions";
import { CancelButton, CancelTrialButton, DeleteAccount } from "./account-client";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const { user, profile, plan, def } = await requireUser();
  const usage = await getUsage(user.id, profile, plan);
  const next = nextPlan(def.key);
  const canceling = plan.paid && plan.status === "canceling" && Boolean(plan.until);
  const trialing = plan.paid && plan.status === "trialing" && Boolean(plan.until);
  const left = trialing ? daysLeft(plan.until!) : 0;
  const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return (
    <div className="max-w-2xl space-y-6">
      <PageTitle title="Account" sub={user.email!}>
        <form action={signOutAction}>
          <Button variant="outline" type="submit"><LogOut /> Log out</Button>
        </form>
      </PageTitle>

      <Link href="/profile" className="flex items-center gap-3 lift rounded-3xl border border-border bg-card p-5 hover:border-foreground">
        <User className="size-5" />
        <span className="font-bold">Profile & style answers</span>
      </Link>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="text-xl font-black">Plan & billing</h2>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl font-black">{plan.name}</span>
              {trialing ? (
                <Badge className="bg-warm normal-case tracking-normal text-slate">Trial · {left} day{left === 1 ? "" : "s"} left</Badge>
              ) : canceling ? (
                <Badge className="normal-case tracking-normal">Active until {shortDate(plan.until!)}</Badge>
              ) : plan.paid ? (
                <Badge tone="primary">Active</Badge>
              ) : null}
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {!plan.paid
                ? "Free forever. Upgrade anytime."
                : trialing
                  ? `Free trial · ends ${longDate(plan.until!)} · no card on file`
                  : canceling
                  ? "Canceled · won’t renew"
                  : `$${def.price}/month${plan.until ? ` · renews on ${longDate(plan.until)}` : ""}`}
            </div>
          </div>
          {next && !canceling && !trialing && <UpgradeButton className="tap rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground" label={`Upgrade to ${next.name}`} />}
        </div>
        {trialing && (
          <div role="status" className="mt-4 rounded-2xl bg-warm p-4 text-sm text-slate">
            <div className="flex items-baseline justify-between gap-2">
              <span>
                <b>{left} of {TRIAL_DAYS} days left</b> in your {plan.name} trial
              </span>
              <span className="text-xs opacity-80">ends {shortDate(plan.until!)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate/15" role="progressbar" aria-valuemin={0} aria-valuemax={TRIAL_DAYS} aria-valuenow={TRIAL_DAYS - left} aria-label="Trial days used">
              <div className="h-full rounded-full bg-slate" style={{ width: `${Math.round(((TRIAL_DAYS - left) / TRIAL_DAYS) * 100)}%` }} />
            </div>
            <p className="mt-3 opacity-90">
              No card on file, so you won{"’"}t be charged. When the trial ends you move to Free {"—"} subscribe before{" "}
              <b>{longDate(plan.until!)}</b> to keep {plan.name}.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <UpgradeButton className="tap w-full rounded-full bg-slate py-3 text-sm font-black text-warm shadow-sm hover:shadow-md sm:w-auto sm:px-6" label={`Subscribe to ${plan.name}`} reason={`Keep ${plan.name} after your trial`} />
              <CancelTrialButton planName={plan.name} />
            </div>
          </div>
        )}
        {canceling && (
          <div role="status" className="mt-4 rounded-2xl border border-border bg-muted p-4 text-sm text-muted-foreground">
            Your {plan.name} plan stays fully active until <b className="text-foreground">{longDate(plan.until!)}</b>. After that your account
            moves to Free on its own. Your closet, trips and looks stay {"—"} only {plan.name} features and limits lock.
          </div>
        )}
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <li className="rounded-2xl bg-muted p-3"><b>{def.key === "free" ? `${usage.digitize}/${def.digitize}` : `${usage.items}/${def.items}`}</b><br />{def.key === "free" ? "free scans" : "closet items"}</li>
          <li className="rounded-2xl bg-muted p-3"><b>{usage.trip}/{def.trips}</b><br />trips this month</li>
          <li className="rounded-2xl bg-muted p-3"><b>{usage.generate}/{def.generate}</b><br />outfit plans this month</li>
        </ul>
        {plan.paid && !canceling && !trialing && (
          <div className="mt-5 border-t border-border pt-5">
            <CancelButton planName={plan.name} until={plan.until} />
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">Payments are handled securely by Whop through Kwop.</p>
      </section>

      <section className="rounded-3xl border-2 border-red-500/40 p-5">
        <h2 className="text-xl font-black">Delete my account</h2>
        <p className="mt-1 text-sm text-muted-foreground">This erases your closet photos, trips and looks forever. Cancel any paid plan first.</p>
        <DeleteAccount />
      </section>
    </div>
  );
}
