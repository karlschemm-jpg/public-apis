import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Adds a displayable image_url. Paths come from rows already filtered by RLS for this user. */
export async function withImages<T extends { image_path: string }>(rows: T[]): Promise<(T & { image_url: string })[]> {
  const stored = rows.filter((r) => !r.image_path.startsWith("/")).map((r) => r.image_path);
  const urls = new Map<string, string>();
  if (stored.length) {
    const admin = createAdminClient();
    const { data } = await admin.storage.from("garments").createSignedUrls(stored, 60 * 60);
    data?.forEach((d) => d.path && d.signedUrl && urls.set(d.path, d.signedUrl));
  }
  return rows.map((r) => ({ ...r, image_url: r.image_path.startsWith("/") ? r.image_path : urls.get(r.image_path) || "" }));
}
