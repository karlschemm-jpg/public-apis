"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { signUpAction, signInAction, forgotPasswordAction, resetPasswordAction, type FormState } from "@/app/actions";

function Msg({ state }: { state: FormState }) {
  if (state?.error) return <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>;
  if (state?.ok) return <p role="status" className="rounded-xl bg-primary/30 px-3 py-2 text-sm font-medium">{state.ok}</p>;
  return null;
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending && <Loader2 className="animate-spin" />} {children}
    </Button>
  );
}

export function SignupForm({ plan, trial }: { plan?: string; trial?: boolean }) {
  const [state, action, pending] = useActionState(signUpAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight">{trial ? `Start 7 days of ${plan || "Pro"} free` : "Pack your first look"}</h1>
        {trial ? (
          <p className="mt-2 rounded-2xl bg-warm px-4 py-3 text-sm text-slate">
            <b>No charge today, cancel anytime.</b> No card needed — your {plan || "Pro"} trial starts as soon as you sign up.
          </p>
        ) : (
          <p className="mt-1 text-muted-foreground">
            Free to start. No credit card.{plan ? ` You picked ${plan} — you can upgrade after your first look.` : ""}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@email.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" />
      </div>
      <Msg state={state} />
      <Submit pending={pending}>Start free</Submit>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="font-bold text-foreground underline-offset-4 hover:underline">Log in</Link>
      </p>
    </form>
  );
}

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, action, pending] = useActionState(signInAction, linkError ? { error: "That link expired. Log in or request a new one." } : undefined);
  return (
    <form action={action} className="space-y-4">
      <h1 className="text-3xl font-black tracking-tight">Welcome back</h1>
      <input type="hidden" name="next" value={next || ""} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Forgot password?</Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Msg state={state} />
      <Submit pending={pending}>Log in</Submit>
      <p className="text-center text-sm text-muted-foreground">
        New here? <Link href="/signup" className="font-bold text-foreground underline-offset-4 hover:underline">Start free</Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <h1 className="text-3xl font-black tracking-tight">Reset your password</h1>
      <p className="text-muted-foreground">We’ll email you a link to set a new one.</p>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <Msg state={state} />
      <Submit pending={pending}>Send reset link</Submit>
      <p className="text-center text-sm"><Link href="/login" className="font-bold underline-offset-4 hover:underline">Back to log in</Link></p>
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <h1 className="text-3xl font-black tracking-tight">Choose a new password</h1>
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <Msg state={state} />
      <Submit pending={pending}>Save password</Submit>
    </form>
  );
}
