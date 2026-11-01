import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan, track } from "@/lib/kwop";
import { getUsage, quotaLeft, consume, type Profile } from "@/lib/session";
import { PLANS, nextPlan } from "@/lib/plans";
import { tagGarment, aiEnabled } from "@/lib/ai";
import { CATEGORIES } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60; // AI tagging can take a few seconds

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];
const Meta = z.object({
  name: z.string().trim().max(80).optional(),
  category: z.enum(CATEGORIES).default("top"),
});

// Closet Digitizer: receives the background-free PNG made in the browser, checks the quota, stores it, tags it.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user?.email) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No photo received." }, { status: 400 });
  if (!TYPES.includes(file.type)) return NextResponse.json({ error: "Use a PNG, JPG or WebP photo." }, { status: 400 });
  if (file.size === 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "Photo must be under 5 MB." }, { status: 400 });
  const meta = Meta.safeParse({ name: form.get("name") || undefined, category: form.get("category") || undefined });
  if (!meta.success) return NextResponse.json({ error: "Invalid details." }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  const plan = await getPlan(user.email, { userId: user.id });
  const def = PLANS[plan.key];
  const usage = await getUsage(user.id, profile, plan);
  if (quotaLeft(def, usage, "digitize") <= 0) {
    const n = nextPlan(def.key);
    const reason =
      def.key === "free"
        ? "You've used your 3 free scans. Keep digitizing your closet."
        : n
          ? `Your ${def.name} closet is full (${def.items} items). ${n.name} holds ${n.items}.`
          : "You've reached your plan's limit this month.";
    return NextResponse.json({ error: reason, paywall: reason }, { status: 402 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const admin = createAdminClient();
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const up = await admin.storage.from("garments").upload(path, bytes, { contentType: file.type, upsert: false });
  if (up.error) {
    console.error("[digitize] upload failed:", up.error.message);
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }

  const tags = aiEnabled() ? await tagGarment(bytes.toString("base64"), file.type) : null;
  const category = tags?.category || meta.data.category;
  const name = meta.data.name || tags?.name || `My ${category === "accessory" ? "accessory" : category}`;
  const { data: garment, error } = await admin
    .from("garments")
    .insert({
      user_id: user.id,
      name,
      category,
      color: tags?.color || null,
      warmth: tags?.warmth || "medium",
      formality: tags?.formality || "casual",
      image_path: path,
    })
    .select("*")
    .single();
  if (error || !garment) {
    await admin.storage.from("garments").remove([path]);
    return NextResponse.json({ error: "Could not save the item. Try again." }, { status: 500 });
  }

  const used = await consume(user.id, "digitize", def.key === "free");
  const firstResult = !profile.aha_at;
  if (firstResult) {
    await admin.from("profiles").update({ aha_at: new Date().toISOString() }).eq("id", user.id);
    track("aha", user.email);
  }
  track("feature_used", user.email, "Closet Digitizer");

  const left = def.key === "free" ? Math.max(0, def.digitize - used) : quotaLeft(def, { ...usage, digitize: used, items: usage.items + 1 }, "digitize");
  const { data: signed } = await admin.storage.from("garments").createSignedUrl(path, 3600);
  return NextResponse.json({
    garment: { ...garment, image_url: signed?.signedUrl || "" },
    left,
    aha: firstResult,
    tagged: Boolean(tags),
    // came from the Kwop page with ?plan= → show the paywall right after the first result
    intendedPlan: firstResult && plan.key === "free" ? profile.intended_plan : null,
    paywall: def.key === "free" && left === 0 ? "That was your 3rd free scan. Unlock your full closet." : null,
  });
}
