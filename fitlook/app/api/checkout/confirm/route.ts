import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cancelOtherPlans, confirmCheckout, getPlan, invalidatePlanCache, track } from "@/lib/kwop";
import { latestTry } from "@/lib/tries";

const Body = z.object({ ref: z.string().min(3).max(80).regex(/^[\w-]+$/) });

// After Whop says "payment": confirm with Kwop, re-read the plan without cache, stop the previous plan on an upgrade.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid reference." }, { status: 400 });

  const before = await getPlan(user.email, { userId: user.id });
  // Whop can take a few seconds to tell Kwop: retry the confirmation briefly
  let c = await confirmCheckout(parsed.data.ref);
  for (let i = 0; i < 4 && !c.paid; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    c = await confirmCheckout(parsed.data.ref);
  }
  invalidatePlanCache(user.email);
  const plan = await getPlan(user.email, { fresh: true, userId: user.id });
  if (c.paid && before.paid && before.status !== "trialing" && before.key !== plan.key) {
    await cancelOtherPlans(user.email, parsed.data.ref); // upgrade: never two plans billed
  }
  const t = await latestTry(user.id);
  if (c.paid && t) track("aha", user.email); // first full capsule unlocked
  return NextResponse.json({ paid: c.paid && plan.paid, plan: { key: plan.key, name: plan.name } });
}
