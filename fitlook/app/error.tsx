"use client";
import Link from "next/link";
import { Luggage } from "lucide-react";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <Luggage className="size-12" aria-hidden />
      <h1 className="text-2xl font-black">Something slipped out of the suitcase.</h1>
      <p className="text-muted-foreground">It’s on us. Try again — your closet is safe.</p>
      <div className="flex gap-3">
        <button onClick={reset} className="tap rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground">Try again</button>
        <Link href="/dashboard" className="rounded-full border-2 border-border px-5 py-2.5 text-sm font-bold">Go home</Link>
      </div>
    </div>
  );
}
