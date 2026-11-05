import { SiteFooter, SiteHeader } from "@/components/site";

export function Legal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-black tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated November 5, 2026</p>
        <div className="mt-8 space-y-5 leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-black">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
