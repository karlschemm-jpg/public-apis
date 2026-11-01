"use client";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImageIcon, Loader2, Pencil, Sparkles, Trash2, Wand2 } from "lucide-react";
import { removeBackground } from "@/lib/bg-remove";
import { usePaywall } from "@/components/paywall";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { PageTitle } from "@/components/empty";
import { CATEGORIES, CATEGORY_LABEL, cn, type Category } from "@/lib/utils";
import { deleteGarment, updateGarment } from "@/app/actions";

export type GarmentView = {
  id: string;
  name: string;
  category: Category;
  color: string | null;
  warmth: "light" | "medium" | "warm";
  formality: "casual" | "smart" | "formal";
  image_url: string;
  is_example: boolean;
};

type Phase = { kind: "idle" } | { kind: "working"; before: string; step: string } | { kind: "done"; before: string; after: string; name: string; firstTime: boolean } | { kind: "error"; message: string };

const planKey = (name: string | null) => {
  const n = (name || "").toLowerCase();
  return n.includes("global") ? "global" : n.includes("starter") ? "starter" : n.includes("pro") ? "pro" : undefined;
};

export function Wardrobe({ initial, left: initialLeft, free, first, ai }: { initial: GarmentView[]; left: number; free: boolean; first: boolean; ai: boolean }) {
  const router = useRouter();
  const { open: openPaywall } = usePaywall();
  const [items, setItems] = useState(initial);
  const [left, setLeft] = useState(initialLeft);
  const [category, setCategory] = useState<Category>("top");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [filter, setFilter] = useState<Category | "all">("all");
  const [editing, setEditing] = useState<GarmentView | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const shown = useMemo(() => (filter === "all" ? items : items.filter((g) => g.category === filter)), [items, filter]);
  const realCount = items.filter((g) => !g.is_example).length;

  async function digitize(file: Blob, name?: string) {
    if (left <= 0) {
      openPaywall({ reason: free ? "You've used your 3 free scans." : "Your closet is full on this plan." });
      return;
    }
    const before = URL.createObjectURL(file);
    try {
      setPhase({ kind: "working", before, step: "Removing background…" });
      const result = await removeBackground(file);
      setPhase({ kind: "working", before, step: ai ? "Tagging your piece…" : "Saving to your closet…" });
      const fd = new FormData();
      fd.append("file", result.blob, "garment.png");
      fd.append("category", category);
      if (name) fd.append("name", name);
      const res = await fetch("/api/garments", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        setPhase({ kind: "idle" });
        setLeft(0);
        openPaywall({ reason: data.paywall });
        return;
      }
      if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
      setItems((xs) => [data.garment, ...xs]);
      setLeft(data.left);
      setPhase({ kind: "done", before, after: result.url, name: data.garment.name, firstTime: Boolean(data.aha) });
      router.refresh();
      if (data.paywall) setTimeout(() => openPaywall({ reason: data.paywall }), 2200);
      else if (data.intendedPlan) setTimeout(() => openPaywall({ reason: "Nice! Here’s the plan you picked.", highlight: planKey(data.intendedPlan) }), 2200);
    } catch (e) {
      setPhase({ kind: "error", message: (e as Error).message || "Could not read that photo. Try another one." });
    }
  }

  async function trySample() {
    const blob = await fetch("/sample/striped-tee.jpg").then((r) => r.blob());
    setCategory("top");
    digitize(blob, "Striped tee");
  }

  return (
    <div>
      <PageTitle title="Wardrobe" sub="Snap a piece. The background disappears instantly.">
        {free && (
          <Badge tone={left > 0 ? "primary" : "ink"}>
            {left} free scan{left === 1 ? "" : "s"} left
          </Badge>
        )}
      </PageTitle>

      {/* CLOSET DIGITIZER */}
      <section className={cn("rounded-[2rem] border-2 p-5 sm:p-6", first ? "border-foreground bg-primary/20" : "border-border bg-card")}>
        {first && phase.kind === "idle" && (
          <div className="mb-4">
            <Badge tone="ink">Your first step</Badge>
            <h2 className="mt-2 text-2xl font-black">Snap one piece you’d pack.</h2>
            <p className="text-muted-foreground">Lay it flat on a bed or the floor. No photo handy? Try our sample — it takes 3 seconds.</p>
          </div>
        )}

        {phase.kind === "working" || phase.kind === "done" ? (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={phase.before} alt="Your photo" className="aspect-[4/5] w-full rounded-2xl object-cover" />
            <Wand2 className={cn("size-6", phase.kind === "working" && "animate-pulse")} />
            <div className="checker grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl p-3">
              {phase.kind === "done" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={phase.after} alt={phase.name} className="animate-pop max-h-full w-full object-contain drop-shadow-xl" />
              ) : (
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Loader2 className="size-4 animate-spin" /> {phase.step}
                </span>
              )}
            </div>
          </div>
        ) : null}

        {phase.kind === "done" && (
          <div className="animate-pop mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-foreground p-4 text-background">
            <div className="flex items-center gap-2 font-bold">
              <Sparkles className="size-5 text-primary" />
              {phase.firstTime ? "Your first piece is in your closet! 🎉" : `${phase.name} added.`}
            </div>
            <Button size="sm" onClick={() => setPhase({ kind: "idle" })}>Add another</Button>
          </div>
        )}

        {phase.kind === "error" && (
          <div role="alert" className="mb-4 rounded-2xl bg-red-500/10 p-4 text-sm font-medium text-red-600 dark:text-red-400">
            {phase.message}{" "}
            <button className="underline" onClick={() => setPhase({ kind: "idle" })}>Try again</button>
          </div>
        )}

        {(phase.kind === "idle" || phase.kind === "error") && (
          <>
            <div className="mb-4">
              <div className="mb-2 text-sm font-semibold">What is it?</div>
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn("shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-semibold", category === c ? "border-foreground bg-foreground text-background" : "border-border")}
                  >
                    {CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>
              {ai ? (
                <p className="mt-2 text-xs text-muted-foreground">AI will name and tag it for you.</p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">AI auto-tagging: coming soon.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => fileRef.current?.click()}>
                <Camera /> Snap or upload a photo
              </Button>
              <Button size="lg" variant="outline" onClick={trySample}>
                <ImageIcon /> Use a sample photo
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                if (f.size > 15 * 1024 * 1024) return setPhase({ kind: "error", message: "That photo is too big. Try one under 15 MB." });
                digitize(f);
              }}
            />
          </>
        )}
      </section>

      {/* CLOSET */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">Your closet <span className="text-muted-foreground">({realCount})</span></h2>
        </div>
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          {(["all", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold", filter === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
            >
              {c === "all" ? "All" : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">Nothing here yet. Snap your first piece above.</p>
            <Button className="mt-4" onClick={() => fileRef.current?.click()}><Camera /> Snap a photo</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((g) => (
              <GarmentCard key={g.id} g={g} onEdit={() => setEditing(g)} onDeleted={() => setItems((xs) => xs.filter((x) => x.id !== g.id))} />
            ))}
          </div>
        )}
      </section>

      <EditDialog
        g={editing}
        onClose={() => setEditing(null)}
        onSaved={(u) => setItems((xs) => xs.map((x) => (x.id === u.id ? u : x)))}
      />
    </div>
  );
}

function GarmentCard({ g, onEdit, onDeleted }: { g: GarmentView; onEdit: () => void; onDeleted: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState(false);
  return (
    <div className={cn("group overflow-hidden rounded-3xl border border-border bg-card", pending && "opacity-50")}>
      <div className="checker relative grid aspect-square place-items-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={g.image_url} alt={g.name} className="max-h-full max-w-full object-contain drop-shadow-lg" loading="lazy" />
        {g.is_example && <Badge tone="ink" className="absolute left-3 top-3">Example</Badge>}
      </div>
      <div className="flex items-center gap-1 p-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{g.name}</div>
          <div className="text-xs text-muted-foreground">{CATEGORY_LABEL[g.category]}{g.color ? ` · ${g.color}` : ""}</div>
        </div>
        <button onClick={onEdit} className="rounded-full p-2 hover:bg-muted" aria-label={`Edit ${g.name}`}><Pencil className="size-4" /></button>
        <button
          onClick={() => {
            if (!confirm(`Delete “${g.name}”?`)) return;
            start(async () => {
              const r = await deleteGarment(g.id);
              if (r.error) setErr(true);
              else onDeleted();
            });
          }}
          className="rounded-full p-2 hover:bg-muted"
          aria-label={`Delete ${g.name}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {err && <p className="px-3 pb-3 text-xs text-red-600">Could not delete. Try again.</p>}
    </div>
  );
}

function EditDialog({ g, onClose, onSaved }: { g: GarmentView | null; onClose: () => void; onSaved: (g: GarmentView) => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog open={Boolean(g)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogTitle className="text-xl font-black">Edit item</DialogTitle>
        {g && (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const data = Object.fromEntries(fd) as Record<string, string>;
              start(async () => {
                const r = await updateGarment(g.id, data);
                if (r.error) return setError(r.error);
                onSaved({ ...g, ...(data as Partial<GarmentView>) } as GarmentView);
                onClose();
              });
            }}
          >
            <div className="space-y-1"><Label htmlFor="name">Name</Label><Input id="name" name="name" defaultValue={g.name} maxLength={80} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label htmlFor="category">Type</Label>
                <Select id="category" name="category" defaultValue={g.category}>{CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</Select>
              </div>
              <div className="space-y-1"><Label htmlFor="color">Color</Label><Input id="color" name="color" defaultValue={g.color || ""} maxLength={30} /></div>
              <div className="space-y-1"><Label htmlFor="warmth">Warmth</Label>
                <Select id="warmth" name="warmth" defaultValue={g.warmth}><option value="light">Light</option><option value="medium">Medium</option><option value="warm">Warm</option></Select>
              </div>
              <div className="space-y-1"><Label htmlFor="formality">Dress code</Label>
                <Select id="formality" name="formality" defaultValue={g.formality}><option value="casual">Casual</option><option value="smart">Smart</option><option value="formal">Formal</option></Select>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Save</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
