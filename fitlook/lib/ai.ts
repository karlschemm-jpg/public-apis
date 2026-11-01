import "server-only";
import { z } from "zod";
import { CATEGORIES } from "@/lib/utils";

// The only file that talks to an AI model (Google Gemini). Callers count usage against the plan quota.
const KEY = process.env.GEMINI_API_KEY || "";
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

export const aiEnabled = () => Boolean(KEY);

async function generateJson(parts: unknown[], schemaHint: string): Promise<unknown> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": KEY },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [...parts, { text: schemaHint }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.4, thinkingConfig: { thinkingLevel: "low" } },
    }),
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) throw new Error(`Gemini answered ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "{}";
  return JSON.parse(text);
}

const TagSchema = z.object({
  name: z.string().min(1).max(80),
  category: z.enum(CATEGORIES),
  color: z.string().max(30).optional(),
  warmth: z.enum(["light", "medium", "warm"]).optional(),
  formality: z.enum(["casual", "smart", "formal"]).optional(),
});
export type GarmentTags = z.infer<typeof TagSchema>;

/** Look at a garment photo and return tags. Returns null when AI is off or fails. */
export async function tagGarment(base64: string, mime: string): Promise<GarmentTags | null> {
  if (!KEY) return null;
  try {
    const out = await generateJson(
      [{ inline_data: { mime_type: mime, data: base64 } }],
      `You are a fashion cataloguer. Describe the single main clothing item in this photo. Answer JSON only:
{"name": short US-English name like "White linen shirt" (max 5 words),
 "category": one of ${CATEGORIES.join(", ")},
 "color": main color in one or two words,
 "warmth": "light" | "medium" | "warm",
 "formality": "casual" | "smart" | "formal"}`
    );
    return TagSchema.parse(out);
  } catch (err) {
    console.error("[ai] tagGarment failed:", (err as Error).message);
    return null;
  }
}

/** One short stylist note per day. Returns null when AI is off or fails. */
export async function stylistNotes(
  trip: { destination: string; days: number; temp_low: number; temp_high: number; rain: boolean; trip_type: string },
  days: { day: number; items: string[] }[]
): Promise<string[] | null> {
  if (!KEY) return null;
  try {
    const out = await generateJson(
      [{ text: JSON.stringify({ trip, days }) }],
      `You are a friendly US travel stylist. For each day, write one upbeat styling tip (max 20 words) for that outfit at this destination and weather (°F). Answer JSON only: {"notes": ["...", ...]} with exactly ${days.length} strings.`
    );
    const parsed = z.object({ notes: z.array(z.string().max(300)) }).parse(out);
    return parsed.notes.slice(0, days.length);
  } catch (err) {
    console.error("[ai] stylistNotes failed:", (err as Error).message);
    return null;
  }
}
