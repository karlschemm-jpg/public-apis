import type { Metadata } from "next";
import { SignupForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Start free" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string; trial?: string }> }) {
  const { plan, trial } = await searchParams;
  const clean = plan && /^[\w .-]{1,30}$/.test(plan) ? plan : undefined;
  return <SignupForm plan={clean} trial={trial === "1"} />;
}
