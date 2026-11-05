"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function useIsDesktop() {
  const [desktop, setDesktop] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return desktop;
}

/**
 * Sheets with spring physics.
 * - "page": full screen on a phone, a centered 480 px card on a computer (the paywall).
 * - "bottom": a bottom sheet with a grab handle on a phone (drag down to close), a centered card on a computer (checkout).
 */
export function Sheet({
  open,
  onOpenChange,
  variant = "page",
  title,
  description,
  closeSide = "left",
  className,
  children,
  z = 50,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "page" | "bottom";
  title: string;
  description?: string;
  closeSide?: "left" | "right";
  className?: string;
  children: React.ReactNode;
  z?: number;
}) {
  const desktop = useIsDesktop();
  const reduce = useReducedMotion();
  const controls = useDragControls();
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 380, damping: 36, mass: 0.9 };
  const mobileBottom = !desktop && variant === "bottom";
  const mobilePage = !desktop && variant === "page";
  const from = desktop ? { opacity: 0, scale: 0.97, y: 12 } : { y: "100%" };
  const to = desktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
                style={{ zIndex: z }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.2 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <div
                className={cn("fixed inset-0 flex", desktop ? "items-center justify-center p-6" : "items-end")}
                style={{ zIndex: z + 1 }}
                onPointerDown={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
              >
                <motion.div
                  className={cn(
                    "relative flex w-full flex-col bg-background text-foreground shadow-2xl outline-none",
                    desktop && "max-h-[min(880px,calc(100dvh-48px))] w-[480px] overflow-hidden rounded-[20px] border border-border",
                    mobilePage && "h-dvh",
                    mobileBottom && "max-h-[94dvh] rounded-t-[22px]",
                    className
                  )}
                  initial={from}
                  animate={to}
                  exit={from}
                  transition={spring}
                  drag={mobileBottom ? "y" : false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.6 }}
                  dragListener={false}
                  dragControls={controls}
                  onDragEnd={(_, info) => {
                    if (info.offset.y > 120 || info.velocity.y > 600) onOpenChange(false);
                  }}
                >
                  <DialogPrimitive.Title asChild>
                    <span className="sr-only">{title}</span>
                  </DialogPrimitive.Title>
                  {description && <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>}
                  {mobileBottom && (
                    <div aria-hidden className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center" onPointerDown={(e) => controls.start(e)}>
                      <div className="h-1.5 w-11 rounded-full bg-border" />
                    </div>
                  )}
                  <DialogPrimitive.Close
                    className={cn(
                      "absolute top-3 z-10 grid size-10 place-items-center rounded-full bg-background/80 backdrop-blur transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                      closeSide === "left" ? "left-3" : "right-3",
                      mobileBottom && "top-4"
                    )}
                    aria-label="Close"
                  >
                    <X className="size-5" />
                  </DialogPrimitive.Close>
                  {children}
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
