import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { requireUser, getUsage } from "@/lib/session";
import { nextPlan } from "@/lib/plans";
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
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="text-2xl font-black">{plan.name}</div>
            <div className="text-sm text-muted-foreground">
              {plan.paid ? `$${def.price}/month${plan.until ? ` · renews or ends ${new Date(plan.until).toLocaleDateString("en-US")}` : ""}${plan.status ? ` · ${plan.status}` : ""}` : "Free forever. Upgrade anytime."}
            </div>
          </div>
          {next && <UpgradeButton className="tap rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground" label={`Upgrade to ${next.name}`} />}
        </div>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <li className="rounded-2xl bg-muted p-3"><b>{def.key === "free" ? `${usage.digitize}/${def.digitize}` : `${usage.items}/${def.items}`}</b><br />{def.key === "free" ? "free scans" : "closet items"}</li>
          <li className="rounded-2xl bg-muted p-3"><b>{usage.trip}/{def.trips}</b><br />trips this month</li>
          <li className="rounded-2xl bg-muted p-3"><b>{usage.generate}/{def.generate}</b><br />outfit plans this month</li>
        </ul>
        {plan.paid && (
          <div className="mt-5 border-t border-border pt-5">
            <CancelButton />
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
