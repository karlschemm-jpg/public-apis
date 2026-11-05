import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getKwopPlans, startCheckout } from "@/lib/kwop";

const Body = z.object({ plan: z.number().int(), period: z.enum(["month", "year"]) });

// Opens Kwop's embedded checkout for the signed-in user. The email always comes from the session, never the browser.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pick a plan." }, { status: 400 });
  const plans = await getKwopPlans();
  const plan = plans.find((p) => p.id === parsed.data.plan);
  if (!plan) return NextResponse.json({ error: "That plan doesn't exist." }, { status: 400 });
  if (parsed.data.period === "year" && !plan.yearly) return NextResponse.json({ error: "No yearly price for this plan." }, { status: 400 });
  const r = await startCheckout(plan.id, parsed.data.period, data.user.email);
  if ("error" in r) {
    if (r.error === "payments_off") return NextResponse.json({ error: "payments_off" }, { status: 409 });
    return NextResponse.json({ error: "We couldn't open the secure checkout. Try again in a moment." }, { status: 502 });
  }
  return NextResponse.json(r);
}
