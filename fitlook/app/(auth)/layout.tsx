import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/50">
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center px-4 sm:px-6">
        <Logo />
      </div>
      <main className="flex flex-1 items-start justify-center px-4 pt-4 sm:pt-12">
        <div className="w-full max-w-[420px] rounded-[20px] border border-border bg-background p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.25)] sm:p-8">{children}</div>
      </main>
      <p className="px-4 py-6 text-center text-xs text-muted-foreground">
        By continuing you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
