import { ImageResponse } from "next/og";
import { getTry, tryImageUrl } from "@/lib/tries";
import { TRIP_WEATHER } from "@/lib/capsule";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A FitLook carry-on capsule";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://fitlook-beta.vercel.app").replace(/\/$/, "");

// Share image of a capsule: the piece, the result, the brand.
export default async function OG({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTry(id);
  const img = t ? await tryImageUrl(t.image_path) : "";
  const w = t ? TRIP_WEATHER[t.trip_type] : null;
  const days = t?.result.days ?? 14;
  const looks = (t?.result.looks ?? []).slice(0, 4);
  const byId = new Map((t?.result.pieces ?? []).map((p) => [p.id, p]));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffffff", color: "#0a0a0a", fontFamily: "serif" }}>
        <div style={{ width: 470, display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f4f2", position: "relative" }}>
          {img && <img src={img} width={340} height={400} style={{ objectFit: "contain" }} alt="" />}
          <div style={{ position: "absolute", left: 24, top: 24, width: 34, height: 34, borderLeft: "4px solid #0a0a0a", borderTop: "4px solid #0a0a0a" }} />
          <div style={{ position: "absolute", right: 24, bottom: 24, width: 34, height: 34, borderRight: "4px solid #0a0a0a", borderBottom: "4px solid #0a0a0a" }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 800, fontFamily: "sans-serif" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#c8ff3d" }} /> FitLook
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#6b6b66", fontFamily: "sans-serif" }}>{w ? w.label : "Carry-on"} · {days} days</div>
            <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.02, marginTop: 10 }}>{t ? `${t.result.pieces.length} pieces. ${days} looks. One carry-on.` : "Two weeks of outfits. One carry-on."}</div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {looks.map((l) => (
              <div key={l.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 120, padding: 10, border: "2px solid #e6e6e2", borderRadius: 16 }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{String(l.day).padStart(2, "0")}</div>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4 }}>
                  {l.ids.slice(0, 4).map((pid) => {
                    const p = byId.get(pid);
                    const src = p?.yours ? img : p?.img ? `${SITE}${p.img}` : "";
                    return src ? <img key={pid} src={src} width={44} height={44} style={{ objectFit: "contain" }} alt="" /> : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
