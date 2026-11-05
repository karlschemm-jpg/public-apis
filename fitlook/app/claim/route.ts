import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { attachTry } from "@/lib/tries";
import { track } from "@/lib/kwop";

// After Google sign-in: attach the try made before signing up, record the source, then back to the capsule.
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) return NextResponse.redirect(`${origin}/login`);
  const jar = await cookies();
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("created_at,source").eq("id", user.id).single();
  const isNew = profile && Date.now() - new Date(profile.created_at).getTime() < 5 * 60_000;
  if (isNew) {
    const src = jar.get("fl_src")?.value;
    const plan = jar.get("fl_plan")?.value;
    await admin.from("profiles").update({ ...(src && !profile.source ? { source: src.slice(0, 80) } : {}), ...(plan ? { intended_plan: plan.slice(0, 30) } : {}) }).eq("id", user.id);
    track("signup", user.email);
  }
  const tryId = jar.get("fl_try")?.value;
  let target = isNew ? "/onboarding" : "/start";
  if (tryId) {
    const attached = await attachTry(tryId, user.id);
    if (attached) {
      if (isNew) track("onboarding_done", user.email);
      target = `/r/${attached}?unlock=1`;
    }
  }
  const res = NextResponse.redirect(`${origin}${target}`);
  res.cookies.delete("fl_try");
  return res;
}
