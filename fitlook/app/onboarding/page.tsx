import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { Onboarding } from "./onboarding";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const { profile } = await requireUser();
  if (profile.onboarding_done) redirect("/wardrobe");
  return (
    <Onboarding
      initial={{ trip_style: profile.trip_style, pain: profile.pain, style_vibe: profile.style_vibe, trip_length: profile.trip_length }}
    />
  );
}
