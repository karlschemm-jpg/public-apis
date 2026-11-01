"use client";
import { useEffect } from "react";

export function AutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <button onClick={() => window.print()} className="no-print mb-4 rounded-full bg-black px-4 py-2 text-sm font-bold text-white">
      Save as PDF
    </button>
  );
}
