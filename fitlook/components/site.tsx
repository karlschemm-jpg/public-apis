import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link href="/pricing" className="hidden rounded-full px-3 py-2 text-sm font-semibold hover:bg-muted sm:block">
            Pricing
          </Link>
          <Link href="/login" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-muted">
            Log in
          </Link>
          <ThemeToggle />
          <Link href="/signup" className="tap rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-95">
            Start free
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <Logo className="text-base text-foreground" />
          <span>Pack smarter, travel in style.</span>
        </div>
        <div className="flex gap-5">
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <span>© {new Date().getFullYear()} FitLook</span>
        </div>
      </div>
    </footer>
  );
}
