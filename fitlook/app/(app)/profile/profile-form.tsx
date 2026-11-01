"use client";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { updateProfileAction } from "@/app/actions";
import type { Profile } from "@/lib/session";

export function ProfileForm({ email, profile }: { email: string; profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);
  return (
    <form action={action} className="space-y-4 rounded-3xl border border-border bg-card p-5">
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={email} disabled readOnly />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="display_name">Name</Label>
        <Input id="display_name" name="display_name" defaultValue={profile.display_name || ""} maxLength={60} placeholder="What should we call you?" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="trip_style">Usual destination</Label>
        <Select id="trip_style" name="trip_style" defaultValue={profile.trip_style || "city"}>
          <option value="beach">Beach & sun</option>
          <option value="city">City break</option>
          <option value="cold">Cold & snowy</option>
          <option value="work">Work trip</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="style_vibe">Style</Label>
        <Select id="style_vibe" name="style_vibe" defaultValue={profile.style_vibe || "casual"}>
          <option value="casual">Casual</option>
          <option value="classic">Classic</option>
          <option value="bold">Bold</option>
          <option value="sporty">Sporty</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="trip_length">Typical trip length</Label>
        <Select id="trip_length" name="trip_length" defaultValue={profile.trip_length || "week"}>
          <option value="weekend">A weekend</option>
          <option value="week">About a week</option>
          <option value="two_weeks">Two weeks+</option>
        </Select>
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm font-semibold">{state.ok}</p>}
      <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Save</Button>
    </form>
  );
}
