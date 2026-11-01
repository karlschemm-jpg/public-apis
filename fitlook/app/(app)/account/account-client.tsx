"use client";
import { useActionState, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cancelSubscriptionAction, deleteAccountAction } from "@/app/actions";

export function CancelButton() {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<{ message: string; manage_url?: string; error?: string } | null>(null);
  if (res?.manage_url)
    return (
      <a href={res.manage_url} target="_blank" rel="noopener noreferrer" className="font-bold underline">
        Manage or cancel your subscription →
      </a>
    );
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!confirm("Cancel your subscription? You’ll keep your closet on the Free plan.")) return;
          start(async () => setRes(await cancelSubscriptionAction()));
        }}
      >
        {pending && <Loader2 className="animate-spin" />} Cancel my subscription
      </Button>
      {res?.error && <p role="alert" className="text-sm text-red-600">{res.error}</p>}
      {res?.message && <p role="status" className="text-sm font-semibold">{res.message}</p>}
    </div>
  );
}

export function DeleteAccount() {
  const [state, action, pending] = useActionState(deleteAccountAction, undefined);
  return (
    <form action={action} className="mt-4 flex flex-wrap gap-2">
      <Input name="confirm" placeholder="Type DELETE" className="max-w-48" aria-label="Type DELETE to confirm" />
      <Button variant="destructive" type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Delete my account
      </Button>
      {state?.error && <p role="alert" className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
