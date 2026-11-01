import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 font-black tracking-tight text-xl", className)}>
      <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
        <svg viewBox="0 0 100 100" className="size-5" aria-hidden>
          <rect x="18" y="28" width="64" height="58" rx="10" fill="currentColor" />
          <rect x="36" y="14" width="28" height="18" rx="6" fill="none" stroke="currentColor" strokeWidth="7" />
          <path d="M38 48 L62 48 M38 48 L38 72 M38 60 L56 60" stroke="#c8ff3d" strokeWidth="8" strokeLinecap="round" fill="none" />
        </svg>
      </span>
      FitLook
    </Link>
  );
}
