import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORIES = ["top", "bottom", "dress", "outerwear", "shoes", "accessory"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABEL: Record<Category, string> = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Dresses",
  outerwear: "Layers",
  shoes: "Shoes",
  accessory: "Accessories",
};

export const TRIP_TYPES = ["beach", "city", "cold", "work"] as const;
export type TripType = (typeof TRIP_TYPES)[number];
export const TRIP_LABEL: Record<TripType, string> = {
  beach: "Beach & sun",
  city: "City break",
  cold: "Cold & snowy",
  work: "Work trip",
};

export function formatDate(d: string | null) {
  if (!d) return "Dates TBD";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
