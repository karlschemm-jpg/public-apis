"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RefreshSoon() {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      if (++n > 24) return clearInterval(t); // stop after 2 minutes
      router.refresh();
    }, 5000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
