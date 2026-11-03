import "server-only";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planKeyFrom, type PlanKey } from "@/lib/plans";
import { applyTrial, resolvePlan, type Resolved, type SubRow, type TrialRow } from "@/lib/grace";

// Everything Kwop lives here. KWOP_API is a server-only secret.
const KWOP_API = (process.env.KWOP_API || "").replace(/\/$/, "");

export type KwopPlan = { paid: boolean; plan: { id: number; name: string } | null; status?: string; until?: string | null };
export type UserPlan = { key: PlanKey; name: string; paid: boolean; status: string | null; until: string | null; stale: boolean };

// One cache per server process, shared by pages and server actions (Next bundles them separately, so a plain module-level
// Map would exist twice and invalidating it from an action would not reach the pages).
const g = globalThis as typeof globalThis & { __fitlookPlanCache?: Map<string, { at: number; value: UserPlan }> };
const cache = (g.__fitlookPlanCache ??= new Map<string, { at: number; value: UserPlan }>());
const TTL = 60_000;

async function kwopFetch(path: string, init?: RequestInit) {
  if (!KWOP_API) throw new Error("KWOP_API is not set");
  const res = await fetch(`${KWOP_API}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Kwop ${path} answered ${res.status}`);
  return res.json();
}

/** Which plan a user has. Server only. Cached 60 s per email unless fresh=true.
 *  With a userId, the grace period applies (lib/grace.ts): a cancelled plan stays active until the paid month ends. */
export async function getPlan(email: string, opts: { fresh?: boolean; userId?: string } = {}): Promise<UserPlan> {
  const key = email.trim().toLowerCase();
  const hit = cache.get(key);
  if (!opts.fresh && hit && Date.now() - hit.at < TTL) return hit.value;

  try {
    const data = (await kwopFetch(`/plan?email=${encodeURIComponent(key)}`)) as KwopPlan;
    let resolved: Resolved = {
      paid: Boolean(data.paid && data.plan),
      plan: data.paid ? data.plan : null,
      status: data.paid && data.plan ? "active" : "free",
      until: data.until ?? null,
      write: null,
    };
    if (opts.userId) {
      const admin = createAdminClient();
      const [{ data: row }, { data: trial }] = await Promise.all([
        admin.from("subscriptions").select("*").eq("user_id", opts.userId).maybeSingle<SubRow>(),
        admin.from("trials").select("*").eq("user_id", opts.userId).maybeSingle<TrialRow>(),
      ]);
      resolved = applyTrial(resolvePlan(data, row ?? null), trial ?? null);
      if (resolved.write) {
        await admin.from("subscriptions").upsert({ user_id: opts.userId, ...(row ?? {}), ...resolved.write, updated_at: new Date().toISOString() });
      }
      // remember the last known plan, so a Kwop outage never downgrades a payer
      await admin
        .from("profiles")
        .update({
          last_plan_id: resolved.paid && resolved.status !== "trialing" ? resolved.plan!.id : null,
          last_plan_name: resolved.paid && resolved.status !== "trialing" ? resolved.plan!.name : null,
          last_plan_checked_at: new Date().toISOString(),
        })
        .eq("id", opts.userId);
    }
    const value: UserPlan = {
      key: resolved.paid && resolved.plan ? planKeyFrom(resolved.plan.id, resolved.plan.name) : "free",
      name: resolved.paid && resolved.plan ? shortName(resolved.plan.name) : "Free",
      paid: resolved.paid,
      status: resolved.status,
      until: resolved.until,
      stale: false,
    };
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch (err) {
    console.error("[kwop] getPlan failed, using last known plan:", (err as Error).message);
    if (hit) return { ...hit.value, stale: true };
    if (opts.userId) {
      try {
        const admin = createAdminClient();
        const { data: row } = await admin.from("subscriptions").select("*").eq("user_id", opts.userId).maybeSingle<SubRow>();
        if (row && row.status !== "expired" && new Date(row.current_period_end) > new Date()) {
          return { key: planKeyFrom(row.plan_id, row.plan_name), name: shortName(row.plan_name), paid: true, status: row.status, until: row.current_period_end, stale: true };
        }
        const { data: trial } = await admin.from("trials").select("*").eq("user_id", opts.userId).maybeSingle<TrialRow>();
        if (trial && !trial.canceled_at && new Date(trial.ends_at) > new Date()) {
          return { key: planKeyFrom(trial.plan_id, trial.plan_name), name: shortName(trial.plan_name), paid: true, status: "trialing", until: trial.ends_at, stale: true };
        }
        const { data } = await admin.from("profiles").select("last_plan_id,last_plan_name").eq("id", opts.userId).single();
        if (data?.last_plan_id) {
          return { key: planKeyFrom(data.last_plan_id, data.last_plan_name), name: shortName(data.last_plan_name || "Paid"), paid: true, status: null, until: null, stale: true };
        }
      } catch {}
    }
    return { key: "free", name: "Free", paid: false, status: null, until: null, stale: true };
  }
}

/** Kwop names plans "FitLook Pro"; inside the app "Pro" reads better. */
export function shortName(name: string) {
  return name.replace(/^fitlook\s+/i, "") || name;
}

export function invalidatePlanCache(email: string) {
  cache.delete(email.trim().toLowerCase());
}

export function payLink(planId: number, email: string): string {
  return `https://kwop.io/fitlook/pay/${planId}?email=${encodeURIComponent(email)}`;
}

export type KwopEvent = "signup" | "onboarding_done" | "aha" | "paywall_view" | "feature_used";

/** Fire-and-forget funnel event. Never blocks, never throws. */
export function track(type: KwopEvent, email: string, detail?: string) {
  if (!KWOP_API || !email) return;
  const send = async () => {
    try {
      await kwopFetch("/event", { method: "POST", body: JSON.stringify(detail ? { type, email, detail } : { type, email }) });
    } catch (err) {
      console.error("[kwop] event failed:", type, (err as Error).message);
    }
  };
  try {
    after(send);
  } catch {
    void send();
  }
}

export async function cancelSubscription(email: string, userId: string): Promise<{ message: string; manage_url?: string; until?: string }> {
  const data = await kwopFetch("/cancel", { method: "POST", body: JSON.stringify({ email }) });
  cache.delete(email.trim().toLowerCase());
  if (data?.manage_url) return { message: String(data?.message || ""), manage_url: data.manage_url };
  // Kwop cancelled the renewal: keep access until the end of the month already paid for.
  const admin = createAdminClient();
  const { data: row } = await admin.from("subscriptions").select("*").eq("user_id", userId).maybeSingle<SubRow>();
  if (row && row.status !== "expired") {
    await admin
      .from("subscriptions")
      .update({ status: "canceling", canceled_at: row.canceled_at || new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    return { message: String(data?.message || "Your subscription is cancelled."), until: row.current_period_end };
  }
  return { message: String(data?.message || "Your subscription is cancelled.") };
}
