import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { AuthForm } from "@/components/signup-sheet";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <>
      <Script src="https://kwop.io/flow.js" data-site="s_ff5952e9df" strategy="afterInteractive" />
      <h1 className="text-[34px] font-semibold leading-tight">Welcome back</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">Your closet, trips and capsules are waiting.</p>
      {error === "link" && <p role="alert" className="mt-4 rounded-2xl bg-muted px-4 py-3 text-sm">That link expired. Log in or request a new one.</p>}
      <div className="mt-6">
        <AuthForm mode="login" next={next} />
      </div>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        New to FitLook? <Link href="/#try" className="font-semibold text-foreground underline-offset-4 hover:underline">Pack my carry-on</Link>
      </p>
    </>
  );
}
