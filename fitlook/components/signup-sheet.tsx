"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";
import { signInAction, signUpAction, type FormState } from "@/app/actions";

export const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "1";

export function GoogleButton({ next = "/claim", label = "Continue with Google" }: { next?: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  if (!GOOGLE_ENABLED) return null;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
      }}
      className="tap flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-white text-[15px] font-semibold text-[#1f1f1f] shadow-sm hover:shadow-md disabled:opacity-60"
    >
      <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      {busy ? "Opening Google…" : label}
    </button>
  );
}

/** Email + password form used by the sheet and the /signup, /login pages. */
export function AuthForm({ mode, onModeChange, submitLabel, next }: { mode: "signup" | "login"; onModeChange?: (m: "signup" | "login") => void; submitLabel?: string; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "signup" ? signUpAction : signInAction, undefined);
  const [show, setShow] = useState(false);
  const emailErr = state?.error && (state.field === "email" || /email/i.test(state.error));
  return (
    <div className="space-y-4">
      <GoogleButton />
      {GOOGLE_ENABLED && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
      )}
      <form action={action} className="space-y-3" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label htmlFor={`${mode}-email`} className="sr-only">Email</label>
          <input id={`${mode}-email`} name="email" type="email" autoComplete="email" required placeholder="Email" aria-invalid={Boolean(emailErr)} aria-describedby={emailErr ? `${mode}-err` : undefined}
            className="h-12 w-full rounded-[14px] border border-border bg-background px-4 text-base outline-none transition focus:border-foreground aria-[invalid=true]:border-red-500" />
          {emailErr && (
            <p id={`${mode}-err`} role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {state!.error}{" "}
              {onModeChange && /already has an account/i.test(state!.error!) && (
                <button type="button" onClick={() => onModeChange("login")} className="font-semibold underline">Log in</button>
              )}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${mode}-password`} className="sr-only">Password</label>
          <div className="relative">
            <input id={`${mode}-password`} name="password" type={show ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 8 : 1}
              placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
              className="h-12 w-full rounded-[14px] border border-border bg-background px-4 pr-12 text-base outline-none transition focus:border-foreground" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {state?.error && !emailErr && <p role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">{state.error}</p>}
        </div>
        <button type="submit" disabled={pending} className="tap flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground text-[15px] font-semibold text-background disabled:opacity-60">
          {pending && <Loader2 className="size-4 animate-spin" />} {submitLabel || (mode === "signup" ? "Save my capsule" : "Log in")}
        </button>
      </form>
      {mode === "login" && (
        <p className="text-center text-sm"><Link href="/forgot-password" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Forgot password?</Link></p>
      )}
    </div>
  );
}

/** "Save your capsule": sign-up over the result (try-first). The try is attached to the account on the server. */
export function SignupSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  return (
    <Sheet open={open} onOpenChange={onOpenChange} variant="bottom" title={mode === "signup" ? "Save your capsule" : "Log in"} closeSide="right">
      <div className="overflow-y-auto px-6 pb-8 pt-3 sm:pt-8">
        <Logo href="/" className="text-lg" />
        <h2 className="mt-5 text-[32px] font-semibold leading-tight">{mode === "signup" ? "Save your capsule" : "Welcome back"}</h2>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          {mode === "signup" ? "Free account, no card. Your 14 looks wait right here." : "Log in and your capsule is saved to your account."}
        </p>
        <div className="mt-6">
          <AuthForm key={mode} mode={mode} onModeChange={setMode} />
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account? " : "New to FitLook? "}
          <button onClick={() => setMode(mode === "signup" ? "login" : "signup")} className="font-semibold text-foreground underline-offset-4 hover:underline">
            {mode === "signup" ? "Log in" : "Create an account"}
          </button>
        </p>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </Sheet>
  );
}
