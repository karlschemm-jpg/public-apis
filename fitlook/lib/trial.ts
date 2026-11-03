import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TrialRow } from "@/lib/grace";
import type { UserPlan } from "@/lib/kwop";

export async function getTrial(userId: string): Promise<TrialRow | null> {
  const { data } = await createAdminClient().from("trials").select("*").eq("user_id", userId).maybeSingle<TrialRow>();
  return data ?? null;
}

/** One trial per account, only for people not already on a paid plan (or its grace period). */
export function trialEligible(trial: TrialRow | null, plan: UserPlan) {
  return !trial && !plan.paid;
}
