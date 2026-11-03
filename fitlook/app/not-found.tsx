import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl font-black">404</div>
      <h1 className="text-2xl font-black">This page missed its flight.</h1>
      <p className="text-muted-foreground">It doesn’t exist or was deleted.</p>
      <Link href="/" className="tap rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground">Take me home</Link>
    </div>
  );
}
