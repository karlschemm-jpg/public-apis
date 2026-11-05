import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "FitLook — Two weeks of outfits. One carry-on.";

export default async function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0a0a0a", color: "#f5f5f2", padding: 72, fontFamily: "serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 800, fontFamily: "sans-serif" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#c8ff3d" }} /> FitLook
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 104, fontWeight: 700, lineHeight: 1 }}>Two weeks of outfits.</div>
          <div style={{ display: "flex", fontSize: 104, fontWeight: 700, lineHeight: 1.05 }}>
            <span style={{ background: "#c8ff3d", color: "#0a0a0a", padding: "0 18px" }}>One carry-on.</span>
          </div>
        </div>
        <div style={{ fontSize: 30, color: "#a3a39c", fontFamily: "sans-serif" }}>Snap one piece. Get your 14-day capsule and a look for every day.</div>
      </div>
    ),
    size
  );
}
