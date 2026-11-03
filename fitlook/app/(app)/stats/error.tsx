"use client";

export default function StatsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center">
      <p className="text-muted-foreground">We couldn’t load your stats just now.</p>
      <button onClick={reset} className="tap mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground">Try again</button>
    </div>
  );
}
