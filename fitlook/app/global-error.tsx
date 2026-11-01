"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, background: "#0b0c09", color: "#f4f6ee" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1>FitLook hit a bump.</h1>
          <p>Please try again.</p>
          <button onClick={reset} style={{ background: "#c8ff3d", border: 0, borderRadius: 999, padding: "10px 20px", fontWeight: 800 }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
