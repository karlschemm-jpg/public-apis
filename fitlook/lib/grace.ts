// Subscription grace period, as pure functions (no I/O) so they can be tested in isolation.
// Rule: a paid plan stays active until the end of the billing month already paid for, even after a cancel
// (Kwop reports "free" right after a cancel). After that date the account is Free. Nothing is deleted.

export type SubRow = {
  plan_id: number;
  plan_name: string;
  status: "active" | "canceling" | "expired";
  paid_since: string;
  current_period_end: string;
  canceled_at: string | null;
};

export type KwopAnswer = { paid: boolean; plan: { id: number; name: string } | null; status?: string | null; until?: string | null };

export type Resolved = {
  paid: boolean;
  plan: { id: number; name: string } | null;
  status: "active" | "canceling" | "free";
  /** active → next renewal; canceling → last day of access; free → null */
  until: string | null;
  /** what to write back to the subscriptions row (null = nothing to write) */
  write: Partial<SubRow> | null;
};

/** Next monthly anniversary of `since` that is after `now` (Jan 31 → Feb 28/29, like card billing). */
export function nextRenewal(since: Date, now: Date): Date {
  for (let m = 1; m < 12 * 50; m++) {
    const y = since.getUTCFullYear(), mo = since.getUTCMonth() + m;
    const last = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    const d = new Date(Date.UTC(y, mo, Math.min(since.getUTCDate(), last), since.getUTCHours(), since.getUTCMinutes()));
    if (d > now) return d;
  }
  return new Date(now.getTime() + 30 * 864e5);
}

function validFuture(iso: string | null | undefined, now: Date) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) || d <= now ? null : d;
}

export function resolvePlan(kwop: KwopAnswer, row: SubRow | null, now = new Date()): Resolved {
  if (kwop.paid && kwop.plan) {
    // Paying: remember the plan and the end of the current paid month.
    const sameSub = row && row.status !== "expired" && row.plan_id === kwop.plan.id;
    const since = sameSub ? new Date(row!.paid_since) : now;
    const end = validFuture(kwop.until, now) || nextRenewal(since, now);
    const kwopCanceled = /cancel/i.test(kwop.status || "");
    const canceling = kwopCanceled || Boolean(sameSub && row!.status === "canceling");
    const write: Partial<SubRow> = {
      plan_id: kwop.plan.id,
      plan_name: kwop.plan.name,
      status: canceling ? "canceling" : "active",
      paid_since: since.toISOString(),
      current_period_end: end.toISOString(),
      canceled_at: canceling ? row?.canceled_at || now.toISOString() : null,
    };
    return { paid: true, plan: kwop.plan, status: canceling ? "canceling" : "active", until: end.toISOString(), write };
  }
  // Kwop says not paid. Grace period if the last paid month isn't over yet.
  if (row && row.status !== "expired") {
    const end = new Date(row.current_period_end);
    if (end > now) {
      const write = row.status === "canceling" ? null : { status: "canceling" as const, canceled_at: now.toISOString() };
      return { paid: true, plan: { id: row.plan_id, name: row.plan_name }, status: "canceling", until: end.toISOString(), write };
    }
    return { paid: false, plan: null, status: "free", until: null, write: { status: "expired" } };
  }
  return { paid: false, plan: null, status: "free", until: null, write: null };
}

/** "December 1, 2026" */
export function longDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}
