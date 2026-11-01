import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, tone = "muted", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "muted" | "primary" | "ink" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        tone === "primary" && "bg-primary text-primary-foreground",
        tone === "ink" && "bg-foreground text-background",
        tone === "muted" && "bg-muted text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
