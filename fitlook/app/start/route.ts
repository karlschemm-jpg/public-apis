import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/kwop";
import { latestTry } from "@/lib/tries";

// Where a returning signed-in person should land: their locked capsule if they haven't paid, the app if they have.
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) return NextResponse.redirect(`${origin}/`);
  const plan = await getPlan(data.user.email, { userId: data.user.id });
  if (!plan.paid) {
    const t = await latestTry(data.user.id);
    if (t) return NextResponse.redirect(`${origin}/r/${t.id}`);
  }
  return NextResponse.redirect(`${origin}/dashboard`);
}
