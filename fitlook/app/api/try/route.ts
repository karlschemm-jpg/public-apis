import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createHash, randomUUID } from "crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { tagGarment, aiEnabled } from "@/lib/ai";
import { buildTryCapsule, type Piece } from "@/lib/capsule";

export const runtime = "nodejs";
export const maxDuration = 60;

const DAILY_LIMIT = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const Meta = z.object({ trip: z.enum(["city", "beach", "cold", "work"]).default("city"), sample: z.enum(["0", "1"]).default("0") });

// Try-first: one photo → a real 14-day carry-on capsule, no account needed (3 a day per device and per IP).
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || !["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Use a PNG, JPG or WebP photo under 5 MB." }, { status: 400 });
  }
  const meta = Meta.safeParse({ trip: form.get("trip") || undefined, sample: form.get("sample") || undefined });
  if (!meta.success) return NextResponse.json({ error: "Pick a kind of trip." }, { status: 400 });

  const jar = await cookies();
  const h = await headers();
  let device = jar.get("fl_dev")?.value || "";
  if (!/^[0-9a-f-]{36}$/i.test(device)) device = randomUUID();
  const ip = (h.get("x-forwarded-for") || h.get("x-real-ip") || "unknown").split(",")[0].trim();
  const ipHash = createHash("sha256").update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-16) || "fitlook"}`).digest("hex").slice(0, 40);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  // the end-to-end test sends a secret key (server env E2E_KEY) to skip the daily limit; visitors never can
  const e2e = Boolean(process.env.E2E_KEY) && h.get("x-e2e-key") === process.env.E2E_KEY;
  if (!userId && !e2e) {
    const [{ count: byDevice }, { count: byIp }] = await Promise.all([
      admin.from("tries").select("id", { count: "exact", head: true }).eq("device_id", device).gte("created_at", since),
      admin.from("tries").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since),
    ]);
    if ((byDevice ?? 0) >= DAILY_LIMIT || (byIp ?? 0) >= DAILY_LIMIT) {
      return NextResponse.json({ error: "You've built 3 capsules today. Save one to keep going — it's free.", limit: true }, { status: 429 });
    }
  }

  const id = randomUUID();
  const bytes = Buffer.from(await file.arrayBuffer());
  const path = `tries/${id}.png`;
  const up = await admin.storage.from("garments").upload(path, bytes, { contentType: file.type, upsert: false });
  if (up.error) {
    console.error("[try] upload failed:", up.error.message);
    return NextResponse.json({ error: "We couldn't save your photo. Try again." }, { status: 500 });
  }

  const tags = aiEnabled() ? await tagGarment(bytes.toString("base64"), file.type) : null;
  const piece: Piece = {
    name: tags?.name || (meta.data.sample === "1" ? "Striped tee" : "Your piece"),
    category: tags?.category || "top",
    color: tags?.color || (meta.data.sample === "1" ? "navy and white" : null),
    warmth: tags?.warmth || "light",
    formality: tags?.formality || "casual",
  };
  const result = buildTryCapsule(meta.data.trip, piece);
  const { error } = await admin.from("tries").insert({ id, user_id: userId, device_id: device, ip_hash: ipHash, trip_type: meta.data.trip, piece, image_path: path, result });
  if (error) {
    console.error("[try] insert failed:", error.message);
    await admin.storage.from("garments").remove([path]);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }

  const { data: signed } = await admin.storage.from("garments").createSignedUrl(path, 60 * 60 * 24);
  const res = NextResponse.json({ id, piece, result, image_url: signed?.signedUrl || "", tagged: Boolean(tags) });
  const cookieOpts = { path: "/", sameSite: "lax" as const, httpOnly: true, maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === "production" };
  res.cookies.set("fl_dev", device, { ...cookieOpts, maxAge: 60 * 60 * 24 * 365 });
  res.cookies.set("fl_try", id, cookieOpts);
  return res;
}
