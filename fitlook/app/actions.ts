"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser, getUsage, quotaLeft, consume, getSessionUser } from "@/lib/session";
import { track, cancelSubscription } from "@/lib/kwop";
import { nextPlan, PLANS } from "@/lib/plans";
import { buildCapsule, planOutfits, type G, type TripInput } from "@/lib/matcher";
import { aiEnabled, stylistNotes } from "@/lib/ai";
import { exampleGarments, exampleTrip } from "@/lib/examples";
import { CATEGORIES, TRIP_TYPES } from "@/lib/utils";

export type FormState = { error?: string; ok?: string } | undefined;

const site = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const Email = z.string().trim().toLowerCase().email("Enter a valid email.").max(200);
const Password = z.string().min(8, "Use at least 8 characters.").max(72);
const Uuid = z.string().uuid();

// ---------- AUTH -------------------------------------------------------------

export async function signUpAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z.object({ email: Email, password: Password }).safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${site()}/auth/callback` } });
  if (error) {
    if (/registered|exists/i.test(error.message)) return { error: "You already have an account. Log in instead." };
    return { error: error.message };
  }
  if (!data.session) {
    const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
    if (e2) return { error: "Account created. Check your inbox to confirm, then log in." };
  }
  const jar = await cookies();
  const plan = jar.get("fl_plan")?.value;
  if (data.user) {
    const admin = createAdminClient();
    await admin.from("profiles").upsert({ id: data.user.id, email, ...(plan ? { intended_plan: plan.slice(0, 30) } : {}) });
  }
  jar.delete("fl_plan");
  track("signup", email);
  redirect("/onboarding");
}

export async function signInAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z.object({ email: Email, password: z.string().min(1, "Enter your password.").max(72) }).safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Wrong email or password." };
  const next = String(form.get("next") || "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function forgotPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = Email.safeParse(form.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${site()}/auth/callback?next=/reset-password` });
  return { ok: "If an account exists for that email, a reset link is on its way." };
}

export async function resetPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = Password.safeParse(form.get("password"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: "Your reset link expired. Request a new one." };
  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------- FUNNEL -----------------------------------------------------------

export async function trackPaywallView() {
  const user = await getSessionUser();
  if (user?.email) track("paywall_view", user.email);
}

// ---------- ONBOARDING -------------------------------------------------------

const Answer = z.discriminatedUnion("field", [
  z.object({ field: z.literal("trip_style"), value: z.enum(["beach", "city", "cold", "work"]) }),
  z.object({ field: z.literal("pain"), value: z.enum(["overpack", "matching", "forget", "all"]) }),
  z.object({ field: z.literal("style_vibe"), value: z.enum(["casual", "classic", "bold", "sporty"]) }),
  z.object({ field: z.literal("trip_length"), value: z.enum(["weekend", "week", "two_weeks"]) }),
]);

export async function saveOnboardingAnswer(field: string, value: string) {
  const parsed = Answer.safeParse({ field, value });
  if (!parsed.success) return { error: "Invalid answer" };
  const { user, supabase } = await requireUser();
  const { error } = await supabase.from("profiles").update({ [parsed.data.field]: parsed.data.value }).eq("id", user.id);
  return error ? { error: "Could not save. Try again." } : { ok: true };
}

export async function finishOnboarding() {
  const { user, supabase } = await requireUser();
  const admin = createAdminClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile?.onboarding_done) {
    const { count } = await admin.from("garments").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if (!count) {
      const { data: garments } = await admin
        .from("garments")
        .insert(exampleGarments(profile?.trip_style).map((g) => ({ ...g, user_id: user.id })))
        .select("id");
      const { data: trip } = await admin
        .from("trips")
        .insert({ ...exampleTrip(profile?.trip_style, profile?.trip_length), user_id: user.id })
        .select("id")
        .single();
      if (trip && garments?.length) {
        await admin.from("trip_items").insert(garments.map((g) => ({ user_id: user.id, trip_id: trip.id, garment_id: g.id })));
      }
    }
    await admin.from("profiles").update({ onboarding_done: true }).eq("id", user.id);
    track("onboarding_done", user.email!);
  }
  redirect("/wardrobe?first=1");
}

// ---------- PROFILE ----------------------------------------------------------

export async function updateProfileAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({
      display_name: z.string().trim().max(60),
      trip_style: z.enum(["beach", "city", "cold", "work"]),
      style_vibe: z.enum(["casual", "classic", "bold", "sporty"]),
      trip_length: z.enum(["weekend", "week", "two_weeks"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Please check your answers." };
  const { user, supabase } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, display_name: parsed.data.display_name || null })
    .eq("id", user.id);
  if (error) return { error: "Could not save. Try again." };
  revalidatePath("/profile");
  return { ok: "Saved." };
}

// ---------- GARMENTS (Closet Digitizer) ---------------------------------------

const GarmentEdit = z.object({
  name: z.string().trim().min(1, "Give it a name.").max(80),
  category: z.enum(CATEGORIES),
  color: z.string().trim().max(30),
  warmth: z.enum(["light", "medium", "warm"]),
  formality: z.enum(["casual", "smart", "formal"]),
});

export async function updateGarment(id: string, data: unknown) {
  const idOk = Uuid.safeParse(id);
  const parsed = GarmentEdit.safeParse(data);
  if (!idOk.success || !parsed.success) return { error: parsed.error?.issues[0]?.message || "Invalid item" };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("garments").update(parsed.data).eq("id", id);
  if (error) return { error: "Could not save. Try again." };
  revalidatePath("/wardrobe");
  return { ok: true };
}

export async function deleteGarment(id: string) {
  if (!Uuid.safeParse(id).success) return { error: "Invalid item" };
  const { user, supabase } = await requireUser();
  const { data: g } = await supabase.from("garments").select("image_path").eq("id", id).single();
  if (!g) return { error: "Item not found" };
  const { error } = await supabase.from("garments").delete().eq("id", id);
  if (error) return { error: "Could not delete. Try again." };
  if (!g.image_path.startsWith("/") && g.image_path.startsWith(user.id + "/")) {
    await createAdminClient().storage.from("garments").remove([g.image_path]);
  }
  revalidatePath("/wardrobe");
  return { ok: true };
}

// ---------- TRIPS (Trip Planner) ----------------------------------------------

const TripSchema = z
  .object({
    destination: z.string().trim().min(1, "Where are you going?").max(80),
    start_date: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    days: z.coerce.number().int().min(1, "At least 1 day.").max(30, "30 days max."),
    temp_low: z.coerce.number().int().min(-40).max(130),
    temp_high: z.coerce.number().int().min(-40).max(130),
    rain: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
    trip_type: z.enum(TRIP_TYPES),
    notes: z.string().trim().max(500).optional().default(""),
  })
  .refine((t) => t.temp_low <= t.temp_high, { message: "Low temp should be below high temp." });

type TripResult = { error?: string; paywall?: string; id?: string };

export async function createTrip(form: FormData): Promise<TripResult> {
  const parsed = TripSchema.safeParse({ ...Object.fromEntries(form), rain: form.get("rain") ?? false });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { user, profile, plan, def } = await requireUser();
  const usage = await getUsage(user.id, profile, plan);
  if (quotaLeft(def, usage, "trip") <= 0) {
    const n = nextPlan(def.key);
    return { paywall: n ? `You've planned ${def.trips} trip${def.trips > 1 ? "s" : ""} this month. ${n.name} gives you ${n.trips}.` : "You've reached this month's trip limit." };
  }
  const admin = createAdminClient();
  const t = parsed.data;
  const { data: trip, error } = await admin
    .from("trips")
    .insert({ ...t, start_date: t.start_date || null, notes: t.notes || null, user_id: user.id })
    .select("*")
    .single();
  if (error || !trip) return { error: "Could not create the trip. Try again." };
  await consume(user.id, "trip", def.key === "free");
  // tailored packing list: auto-fill the suitcase with a capsule from the wardrobe
  const { data: garments } = await admin.from("garments").select("id,name,category,warmth,formality,color").eq("user_id", user.id);
  const capsule = buildCapsule((garments || []) as G[], t as TripInput, def.weather);
  if (capsule.length) {
    await admin.from("trip_items").insert(capsule.map((g) => ({ user_id: user.id, trip_id: trip.id, garment_id: g.id })));
  }
  track("feature_used", user.email!, "Trip Planner");
  revalidatePath("/trips");
  return { id: trip.id };
}

export async function updateTrip(id: string, form: FormData): Promise<TripResult> {
  if (!Uuid.safeParse(id).success) return { error: "Invalid trip" };
  const parsed = TripSchema.safeParse({ ...Object.fromEntries(form), rain: form.get("rain") ?? false });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { supabase } = await requireUser();
  const t = parsed.data;
  const { error } = await supabase
    .from("trips")
    .update({ ...t, start_date: t.start_date || null, notes: t.notes || null })
    .eq("id", id);
  if (error) return { error: "Could not save. Try again." };
  revalidatePath(`/trips/${id}`);
  return { id };
}

export async function deleteTrip(id: string) {
  if (!Uuid.safeParse(id).success) return { error: "Invalid trip" };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) return { error: "Could not delete. Try again." };
  revalidatePath("/trips");
  return { ok: true };
}

// ---------- SUITCASE ---------------------------------------------------------

export async function setInSuitcase(tripId: string, garmentId: string, inside: boolean) {
  if (!Uuid.safeParse(tripId).success || !Uuid.safeParse(garmentId).success) return { error: "Invalid item" };
  const { user, supabase } = await requireUser();
  const { error } = inside
    ? await supabase.from("trip_items").upsert({ user_id: user.id, trip_id: tripId, garment_id: garmentId }, { onConflict: "trip_id,garment_id", ignoreDuplicates: true })
    : await supabase.from("trip_items").delete().eq("trip_id", tripId).eq("garment_id", garmentId);
  if (error) return { error: "Could not update the suitcase." };
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/suitcase");
  return { ok: true };
}

export async function setPacked(itemId: string, packed: boolean) {
  if (!Uuid.safeParse(itemId).success) return { error: "Invalid item" };
  const { user, supabase } = await requireUser();
  const { error } = await supabase.from("trip_items").update({ packed: Boolean(packed) }).eq("id", itemId);
  if (error) return { error: "Could not update." };
  track("feature_used", user.email!, "Suitcase View");
  return { ok: true };
}

// ---------- OUTFITS (AI Matcher) ----------------------------------------------

export async function generateOutfits(tripId: string): Promise<{ error?: string; paywall?: string; ok?: boolean }> {
  if (!Uuid.safeParse(tripId).success) return { error: "Invalid trip" };
  const { user, profile, plan, def, supabase } = await requireUser();
  const usage = await getUsage(user.id, profile, plan);
  if (quotaLeft(def, usage, "generate") <= 0) {
    const n = nextPlan(def.key);
    return { paywall: n ? `You've used your ${def.generate} outfit plan${def.generate > 1 ? "s" : ""} this month. ${n.name} gives you ${n.generate}.` : "You've reached this month's outfit limit." };
  }
  const { data: trip } = await supabase.from("trips").select("*").eq("id", tripId).single();
  if (!trip) return { error: "Trip not found" };
  const { data: items } = await supabase.from("trip_items").select("garment_id").eq("trip_id", tripId);
  let q = supabase.from("garments").select("id,name,category,warmth,formality,color");
  if (items?.length) q = q.in("id", items.map((i) => i.garment_id));
  const { data: garments } = await q;
  if (!garments?.length) return { error: "Add a few clothes to your wardrobe first." };

  const tripIn = trip as TripInput;
  const pool = items?.length ? (garments as G[]) : buildCapsule(garments as G[], tripIn, def.weather);
  const days = planOutfits(pool, tripIn, def.weather);
  if (def.aiNotes && aiEnabled()) {
    const names = new Map(garments.map((g) => [g.id, g.name]));
    const notes = await stylistNotes(
      trip,
      days.map((d) => ({ day: d.day_index + 1, items: [d.top_id, d.bottom_id, d.dress_id, d.outer_id, d.shoes_id, d.accessory_id].filter(Boolean).map((id) => names.get(id!) || "") }))
    );
    notes?.forEach((n, i) => days[i] && (days[i].note = n.slice(0, 300)));
  }
  const admin = createAdminClient();
  await admin.from("outfits").delete().eq("trip_id", tripId).eq("user_id", user.id);
  const { error } = await admin.from("outfits").insert(days.map((d) => ({ ...d, trip_id: tripId, user_id: user.id })));
  if (error) return { error: "Could not save your looks. Try again." };
  await consume(user.id, "generate", def.key === "free");
  track("feature_used", user.email!, "AI Matcher");
  revalidatePath("/outfits");
  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

const SLOTS = ["top_id", "bottom_id", "dress_id", "outer_id", "shoes_id", "accessory_id"] as const;

export async function updateOutfitSlot(outfitId: string, slot: string, garmentId: string | null) {
  const s = z.enum(SLOTS).safeParse(slot);
  if (!Uuid.safeParse(outfitId).success || !s.success || (garmentId && !Uuid.safeParse(garmentId).success)) return { error: "Invalid change" };
  const { supabase } = await requireUser();
  if (garmentId) {
    const { data } = await supabase.from("garments").select("id").eq("id", garmentId).single();
    if (!data) return { error: "Item not found" };
  }
  const { error } = await supabase.from("outfits").update({ [s.data]: garmentId }).eq("id", outfitId);
  if (error) return { error: "Could not save." };
  revalidatePath("/outfits");
  return { ok: true };
}

export async function deleteOutfit(id: string) {
  if (!Uuid.safeParse(id).success) return { error: "Invalid outfit" };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("outfits").delete().eq("id", id);
  if (error) return { error: "Could not delete." };
  revalidatePath("/outfits");
  return { ok: true };
}

// ---------- ACCOUNT ----------------------------------------------------------

export async function cancelSubscriptionAction(): Promise<{ message: string; manage_url?: string; error?: string; until?: string; plan?: string }> {
  const { user, plan } = await requireUser({ fresh: true });
  if (!plan.paid) return { message: "You're on the Free plan — nothing to cancel." };
  if (plan.status === "canceling" && plan.until) {
    return { message: "Your subscription is already cancelled.", until: plan.until, plan: plan.name };
  }
  try {
    // no revalidatePath here: the confirmation dialog must stay open; "Got it" refreshes the page
    const r = await cancelSubscription(user.email!, user.id);
    return { ...r, until: r.until ?? plan.until ?? undefined, plan: plan.name };
  } catch (err) {
    console.error("[kwop] cancel failed:", (err as Error).message);
    return { message: "", error: "We couldn't reach the billing service. Please try again in a minute." };
  }
}

export async function deleteAccountAction(_: FormState, form: FormData): Promise<FormState> {
  if (String(form.get("confirm") || "").trim().toUpperCase() !== "DELETE") return { error: 'Type DELETE to confirm.' };
  const { user, supabase } = await requireUser();
  const admin = createAdminClient();
  const { data: files } = await admin.storage.from("garments").list(user.id, { limit: 1000 });
  if (files?.length) await admin.storage.from("garments").remove(files.map((f) => `${user.id}/${f.name}`));
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "Could not delete your account. Try again." };
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}

export async function planSummary() {
  const { user, profile, plan, def } = await requireUser();
  const usage = await getUsage(user.id, profile, plan);
  return { plan, def, usage, next: nextPlan(def.key), all: PLANS };
}
