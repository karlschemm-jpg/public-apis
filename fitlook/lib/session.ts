import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan, type UserPlan } from "@/lib/kwop";
import { PLANS, currentPeriod, type PlanDef } from "@/lib/plans";

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  intended_plan: string | null;
  trip_style: string | null;
  pain: string | null;
  style_vibe: string | null;
  trip_length: string | null;
  onboarding_done: boolean;
  free_uses: number;
  aha_at: string | null;
};

export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

/** The signed-in user, profile and plan (from Kwop, server side). Redirects to /login if signed out. */
export const requireUser = cache(async (opts: { fresh?: boolean } = {}) => {
  const user = await getSessionUser();
  if (!user || !user.email) redirect("/login");
  const supabase = await createClient();
  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile) {
    // trigger missed (e.g. user created before migration): create it
    const admin = createAdminClient();
    await admin.from("profiles").upsert({ id: user.id, email: user.email });
    profile = { id: user.id, email: user.email, display_name: null, intended_plan: null, trip_style: null, pain: null, style_vibe: null, trip_length: null, onboarding_done: false, free_uses: 0, aha_at: null };
  }
  // right after checkout (/dashboard?paid=1) the middleware sets fl_fresh for 60 s: skip the plan cache
  const fresh = opts.fresh || (await cookies()).has("fl_fresh");
  const plan = await getPlan(user.email, { fresh, userId: user.id });
  return { user, profile, plan, def: PLANS[plan.key], supabase };
});

export type Usage = { digitize: number; trip: number; generate: number; items: number };

export async function getUsage(userId: string, profile: Profile, plan: UserPlan): Promise<Usage> {
  const admin = createAdminClient();
  const [{ data: rows }, { count }] = await Promise.all([
    admin.from("usage").select("kind,count").eq("user_id", userId).eq("period", currentPeriod()),
    admin.from("garments").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_example", false),
  ]);
  const get = (k: string) => rows?.find((r) => r.kind === k)?.count ?? 0;
  return {
    digitize: plan.key === "free" ? profile.free_uses : get("digitize"),
    trip: get("trip"),
    generate: get("generate"),
    items: count ?? 0,
  };
}

export type QuotaKind = "digitize" | "trip" | "generate";

export function quotaLeft(def: PlanDef, usage: Usage, kind: QuotaKind): number {
  if (kind === "digitize") return Math.max(0, Math.min(def.digitize - usage.digitize, def.items - usage.items));
  if (kind === "trip") return Math.max(0, def.trips - usage.trip);
  return Math.max(0, def.generate - usage.generate);
}

export async function consume(userId: string, kind: QuotaKind, isFree: boolean) {
  const admin = createAdminClient();
  if (kind === "digitize" && isFree) {
    const { data } = await admin.rpc("increment_free_uses", { p_user: userId });
    return Number(data ?? 0);
  }
  const { data } = await admin.rpc("increment_usage", { p_user: userId, p_period: currentPeriod(), p_kind: kind, p_by: 1 });
  return Number(data ?? 0);
}
