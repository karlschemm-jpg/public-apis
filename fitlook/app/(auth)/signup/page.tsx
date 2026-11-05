import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { AuthForm } from "@/components/signup-sheet";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string; trial?: string }> }) {
  const { plan, trial } = await searchParams;
  const clean = plan && /^[\w .-]{1,30}$/.test(plan) ? plan : undefined;
  return (
    <>
      <Script src="https://kwop.io/flow.js" data-site="s_ff5952e9df" strategy="afterInteractive" />
      <h1 className="text-[34px] font-semibold leading-tight">{trial === "1" ? `Start 7 days of ${clean || "Pro"} free` : "Pack your first carry-on"}</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        {trial === "1" ? "No charge today, cancel anytime. No card needed." : "Free account, no card. Your capsule is ready in about 10 seconds."}
      </p>
      <div className="mt-6">
        <AuthForm mode="signup" submitLabel="Create my account" />
      </div>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">Log in</Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Rather see it first? <Link href="/#try" className="font-semibold text-foreground underline-offset-4 hover:underline">Pack one piece</Link>
      </p>
    </>
  );
}
