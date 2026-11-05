"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";

type WhopCheckout = { create: (kind: string) => { mount: (sel: string) => void }; destroy?: () => void };
type WhopElementsFn = () => { checkout: { create: (opts: Record<string, unknown>) => WhopCheckout } };
declare global {
  interface Window {
    WhopElements?: WhopElementsFn;
  }
}

const WHOP_SRC = "https://cdn.whop.com/elements/amber/elements.js";
let whopLoading: Promise<void> | null = null;
function loadWhop(): Promise<void> {
  if (window.WhopElements) return Promise.resolve();
  if (whopLoading) return whopLoading;
  whopLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = WHOP_SRC;
    s.async = true;
    s.setAttribute("data-whop-elements", "");
    s.onload = () => resolve();
    s.onerror = () => {
      whopLoading = null;
      reject(new Error("Whop script failed"));
    };
    document.head.appendChild(s);
  });
  return whopLoading;
}

export type CheckoutChoice = { planId: number; planName: string; period: "month" | "year"; priceLabel: string };

/**
 * The checkout INSIDE the page (Kwop's rule 8): POST /api/checkout → Whop Elements embedded in a sheet.
 * onPaid(ref) is called when Whop reports a payment; onPaymentsOff when Kwop's payments are not connected yet.
 */
export function CheckoutSheet({
  choice,
  onClose,
  onPaid,
  onPaymentsOff,
}: {
  choice: CheckoutChoice | null;
  onClose: () => void;
  onPaid: (ref: string) => void;
  onPaymentsOff: () => void;
}) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const ckRef = useRef<WhopCheckout | null>(null);
  const paidRef = useRef(false);

  useEffect(() => {
    if (!choice) return;
    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    setState("loading");
    setError(null);
    paidRef.current = false;

    (async () => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: choice.planId, period: choice.period }),
      }).catch(() => null);
      if (cancelled) return;
      if (!res) return fail("No connection. Check your internet and try again.");
      if (res.status === 409) {
        onPaymentsOff();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return fail(data.error || "We couldn't open the secure checkout.");
      const { embed, ref, fallback_url } = data as { embed: string | null; ref: string; fallback_url: string };
      if (!embed) {
        window.location.assign(fallback_url);
        return;
      }
      try {
        await loadWhop();
      } catch {
        window.location.assign(fallback_url);
        return;
      }
      if (cancelled || !window.WhopElements) return;
      const dark = document.documentElement.classList.contains("dark");
      const show = () => !cancelled && setState("ready");
      const ck = window.WhopElements().checkout.create({
        checkoutConfiguration: embed,
        returnUrl: `${location.origin}/dashboard?paid=1&ref=${encodeURIComponent(ref)}`,
        appearance: { theme: { appearance: dark ? "dark" : "light" } },
        onLoadingChange: (st: unknown) => {
          const loading = st && typeof st === "object" ? (st as { loading?: boolean }).loading : st;
          if (loading === false) show();
        },
        onComplete: (r: { result?: string } | undefined) => {
          if (r && r.result === "payment" && !paidRef.current) {
            paidRef.current = true;
            onPaid(ref);
          }
        },
      });
      ckRef.current = ck;
      ck.create("checkout").mount("#whop-checkout");
      // Whop's iframe is there but no loading event: show it after 2 s; nothing at all after 15 s: Whop's own page
      showTimer = setTimeout(() => {
        if (document.querySelector("#whop-checkout iframe")) show();
      }, 2000);
      fallbackTimer = setTimeout(() => {
        if (!cancelled && !document.querySelector("#whop-checkout iframe")) window.location.assign(fallback_url);
      }, 15000);
    })();

    function fail(msg: string) {
      setError(msg);
      setState("error");
    }
    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      clearTimeout(showTimer);
      try {
        ckRef.current?.destroy?.();
      } catch {}
      ckRef.current = null;
    };
  }, [choice, onPaid, onPaymentsOff]);

  return (
    <Sheet open={Boolean(choice)} onOpenChange={(v) => !v && onClose()} variant="bottom" title={`${choice?.planName ?? ""} checkout`} closeSide="right" z={60}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="px-6 pb-3 pt-2 sm:pt-6">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Secure checkout</div>
          <div className="font-display mt-1 text-2xl font-semibold">
            {choice?.planName} · {choice?.priceLabel}
          </div>
        </div>
        <div className="relative min-h-[420px] flex-1 overflow-y-auto px-3 pb-2 sm:px-5">
          {state === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground" role="status">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Loading secure checkout…
            </div>
          )}
          {state === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-sm" role="alert">
              <p>{error}</p>
              <button onClick={onClose} className="tap rounded-full border border-border px-4 py-2 font-semibold">Back to plans</button>
            </div>
          )}
          <div id="whop-checkout" className={state === "ready" ? "opacity-100 transition-opacity" : "opacity-0"} />
        </div>
        <div className="flex items-center justify-center gap-1.5 border-t border-border px-6 py-3 text-xs text-muted-foreground">
          <Lock className="size-3.5" aria-hidden /> Secure payment by Whop · Cancel in 1 click
        </div>
      </div>
    </Sheet>
  );
}
