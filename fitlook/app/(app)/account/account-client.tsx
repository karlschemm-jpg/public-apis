"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cancelSubscriptionAction, deleteAccountAction } from "@/app/actions";

export function CancelButton({ planName, until }: { planName: string; until: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [res, setRes] = useState<{ message: string; manage_url?: string; error?: string; until?: string } | null>(null);
  const date = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

  if (res?.manage_url)
    return (
      <a href={res.manage_url} target="_blank" rel="noopener noreferrer" className="font-bold underline">
        Manage or cancel your subscription →
      </a>
    );
  const done = Boolean(res && !res.error);
  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={() => setOpen(true)}>Cancel my subscription</Button>
      <Dialog open={open} onOpenChange={(v) => !pending && (v ? setOpen(true) : (setOpen(false), done && router.refresh()))}>
        <DialogContent>
          {done ? (
            <>
              <DialogTitle className="text-xl font-black">Subscription canceled</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                {res!.until ? (
                  <>You keep {planName} until <b className="text-foreground">{date(res!.until)}</b>. Then your account moves to Free — nothing is deleted.</>
                ) : (
                  res!.message
                )}
              </DialogDescription>
              <Button className="mt-5 w-full" onClick={() => { setOpen(false); router.refresh(); }}>Got it</Button>
            </>
          ) : (
            <>
              <DialogTitle className="text-xl font-black">Cancel {planName}?</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                {until ? (
                  <>You’ll keep everything in {planName} until <b className="text-foreground">{date(until)}</b>. After that your account moves to Free. Your closet, trips and looks stay.</>
                ) : (
                  <>Your account moves to Free when your paid month ends. Your closet, trips and looks stay.</>
                )}
              </DialogDescription>
              {res?.error && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{res.error}</p>}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
                <Button variant="outline" className="sm:flex-1" disabled={pending} onClick={() => start(async () => setRes(await cancelSubscriptionAction()))}>
                  {pending && <Loader2 className="animate-spin" />} Cancel subscription
                </Button>
                <Button className="sm:flex-1" disabled={pending} onClick={() => setOpen(false)}>
                  Keep {planName}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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
