"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TripForm, type TripRow } from "@/components/trips/trip-form";

export function NewTripButton({ trip, label }: { trip?: TripRow; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} variant={trip ? "outline" : "default"}>
        {!trip && <Plus />} {label || (trip ? "Edit trip" : "New trip")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogTitle className="mb-4 text-2xl font-black">{trip ? "Edit trip" : "Where to next?"}</DialogTitle>
          <TripForm trip={trip} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
