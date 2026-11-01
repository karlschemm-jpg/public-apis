import "server-only";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planKeyFrom, type PlanKey } from "@/lib/plans";

// Everything Kwop lives here. KWOP_API is a server-only secret.
const KWOP_API = (process.env.KWOP_API || "").replace(/\/$/, "");

export type KwopPlan = { paid: boolean; plan: { id: number; name: string } | null; status?: string; until?: string | null };
export type UserPlan = { key: PlanKey; name: string; paid: boolean; status: string | null; until: string | null; stale: boolean };

const cache = new Map<string, { at: number; value: UserPlan }>();
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

/** Which plan a user has. Server only. Cached 60 s per email unless fresh=true. */
export async function getPlan(email: string, opts: { fresh?: boolean; userId?: string } = {}): Promise<UserPlan> {
  const key = email.trim().toLowerCase();
  const hit = cache.get(key);
  if (!opts.fresh && hit && Date.now() - hit.at < TTL) return hit.value;

  try {
    const data = (await kwopFetch(`/plan?email=${encodeURIComponent(key)}`)) as KwopPlan;
    const planKey = data.paid && data.plan ? planKeyFrom(data.plan.id, data.plan.name) : "free";
    const value: UserPlan = {
      key: planKey,
      name: data.paid && data.plan ? data.plan.name : "Free",
      paid: Boolean(data.paid && data.plan),
      status: data.status ?? null,
      until: data.until ?? null,
      stale: false,
    };
    cache.set(key, { at: Date.now(), value });
    if (opts.userId) {
      // remember the last known plan, so a Kwop outage never downgrades a payer
      const admin = createAdminClient();
      await admin
        .from("profiles")
        .update({
          last_plan_id: value.paid ? data.plan!.id : null,
          last_plan_name: value.paid ? value.name : null,
          last_plan_checked_at: new Date().toISOString(),
        })
        .eq("id", opts.userId);
    }
    return value;
  } catch (err) {
    console.error("[kwop] getPlan failed, using last known plan:", (err as Error).message);
    if (hit) return { ...hit.value, stale: true };
    if (opts.userId) {
      try {
        const admin = createAdminClient();
        const { data } = await admin.from("profiles").select("last_plan_id,last_plan_name").eq("id", opts.userId).single();
        if (data?.last_plan_id) {
          return { key: planKeyFrom(data.last_plan_id, data.last_plan_name), name: data.last_plan_name || "Paid", paid: true, status: null, until: null, stale: true };
        }
      } catch {}
    }
    return { key: "free", name: "Free", paid: false, status: null, until: null, stale: true };
  }
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

export async function cancelSubscription(email: string): Promise<{ message: string; manage_url?: string }> {
  const data = await kwopFetch("/cancel", { method: "POST", body: JSON.stringify({ email }) });
  cache.delete(email.trim().toLowerCase());
  return { message: String(data?.message || "Your cancellation request was sent."), manage_url: data?.manage_url || undefined };
}
