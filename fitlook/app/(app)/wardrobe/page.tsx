import type { Metadata } from "next";
import { requireUser, getUsage, quotaLeft } from "@/lib/session";
import { withImages } from "@/lib/images";
import { aiEnabled } from "@/lib/ai";
import { Wardrobe, type GarmentView } from "./wardrobe";

export const metadata: Metadata = { title: "Wardrobe" };

export default async function WardrobePage({ searchParams }: { searchParams: Promise<{ first?: string }> }) {
  const { first } = await searchParams;
  const { user, profile, plan, def, supabase } = await requireUser();
  const [{ data, error }, usage] = await Promise.all([
    supabase.from("garments").select("*").order("created_at", { ascending: false }),
    getUsage(user.id, profile, plan),
  ]);
  if (error) throw new Error("Could not load your wardrobe.");
  const garments = (await withImages(data || [])) as GarmentView[];
  return (
    <Wardrobe
      initial={garments}
      left={quotaLeft(def, usage, "digitize")}
      free={def.key === "free"}
      first={first === "1" && !profile.aha_at}
      ai={aiEnabled()}
    />
  );
}
