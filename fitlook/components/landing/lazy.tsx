"use client";
import dynamic from "next/dynamic";

// Below-the-fold animations load after the hero, with placeholders of the same size (no layout shift).
const phone = () => <div className="mx-auto aspect-[9/18.5] w-[230px] rounded-[38px] bg-muted" aria-hidden />;
const card = () => <div className="h-40 rounded-[18px] bg-muted" aria-hidden />;

export const LazyVsl = dynamic(() => import("@/components/landing/vsl").then((m) => m.Vsl), {
  ssr: false,
  loading: () => <div className="min-h-[476px] rounded-[22px] bg-[#0a0a0a] sm:min-h-[516px]" aria-hidden />,
});
export const LazySnapLoop = dynamic(() => import("@/components/landing/feature-loops").then((m) => m.SnapLoop), { ssr: false, loading: phone });
export const LazyTripLoop = dynamic(() => import("@/components/landing/feature-loops").then((m) => m.TripLoop), { ssr: false, loading: phone });
export const LazyLooksLoop = dynamic(() => import("@/components/landing/feature-loops").then((m) => m.LooksLoop), { ssr: false, loading: phone });
export const LazyWeatherLoop = dynamic(() => import("@/components/landing/feature-loops").then((m) => m.WeatherLoop), { ssr: false, loading: card });
export const LazySuitcaseLoop = dynamic(() => import("@/components/landing/feature-loops").then((m) => m.SuitcaseLoop), { ssr: false, loading: card });
