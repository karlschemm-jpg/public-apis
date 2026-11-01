import Link from "next/link";

export function Empty({ text, cta, href, children }: { text: string; cta?: string; href?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border px-6 py-14 text-center">
      <p className="max-w-xs text-muted-foreground">{text}</p>
      {cta && href && (
        <Link href={href} className="rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground hover:brightness-95">
          {cta}
        </Link>
      )}
      {children}
    </div>
  );
}

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
