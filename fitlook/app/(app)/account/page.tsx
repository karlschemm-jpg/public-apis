import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { requireUser, getUsage } from "@/lib/session";
import { nextPlan } from "@/lib/plans";
import { longDate } from "@/lib/grace";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/empty";
import { Button } from "@/components/ui/button";
import { UpgradeButton } from "@/components/paywall";
import { signOutAction } from "@/app/actions";
import { CancelButton, DeleteAccount } from "./account-client";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const { user, profile, plan, def } = await requireUser();
  const usage = await getUsage(user.id, profile, plan);
  const next = nextPlan(def.key);
  const canceling = plan.paid && plan.status === "canceling" && Boolean(plan.until);
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
              {canceling ? (
                <Badge className="normal-case tracking-normal">Active until {shortDate(plan.until!)}</Badge>
              ) : plan.paid ? (
                <Badge tone="primary">Active</Badge>
              ) : null}
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {!plan.paid
                ? "Free forever. Upgrade anytime."
                : canceling
                  ? "Canceled · won’t renew"
                  : `$${def.price}/month${plan.until ? ` · renews on ${longDate(plan.until)}` : ""}`}
            </div>
          </div>
          {next && !canceling && <UpgradeButton className="tap rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground" label={`Upgrade to ${next.name}`} />}
        </div>
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
        {plan.paid && !canceling && (
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
