import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTry } from "@/lib/tries";

// Delete a try and its photo (the person who made it: same browser before sign-up, or the owner after).
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTry(id);
  if (!t) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const jar = await cookies();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const mine = (t.user_id && t.user_id === data.user?.id) || (!t.user_id && jar.get("fl_try")?.value === t.id);
  if (!mine) return NextResponse.json({ error: "Not yours." }, { status: 403 });
  const admin = createAdminClient();
  const { count } = await admin.from("garments").select("id", { count: "exact", head: true }).eq("image_path", t.image_path);
  if (!count) await admin.storage.from("garments").remove([t.image_path]); // keep it if it became a wardrobe piece
  await admin.from("tries").delete().eq("id", t.id);
  const res = NextResponse.json({ ok: true });
  if (jar.get("fl_try")?.value === t.id) res.cookies.delete("fl_try");
  return res;
}
