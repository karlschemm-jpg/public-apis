import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = ["/dashboard", "/wardrobe", "/trips", "/outfits", "/suitcase", "/profile", "/account", "/onboarding"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname, searchParams } = request.nextUrl;

  // Keep ?plan= from the Kwop page through signup
  const plan = searchParams.get("plan");
  const rememberPlan = (res: NextResponse) => {
    if (plan && /^[\w .-]{1,30}$/.test(plan)) {
      res.cookies.set("fl_plan", plan, { maxAge: 60 * 60 * 24 * 7, path: "/", sameSite: "lax", httpOnly: true });
    }
    return res;
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return rememberPlan(response);

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  const redirect = (to: string) => {
    const r = NextResponse.redirect(new URL(to, request.url));
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return rememberPlan(r);
  };

  if (!user && PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }
  if (user && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
    return redirect("/dashboard");
  }
  if (user && pathname === "/dashboard" && searchParams.get("paid") === "1") {
    request.cookies.set("fl_fresh", "1");
    const r = NextResponse.next({ request });
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    r.cookies.set("fl_fresh", "1", { maxAge: 60, path: "/", httpOnly: true, sameSite: "lax" });
    return r;
  }
  return rememberPlan(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|examples|sample|api/health|.*\\.(?:png|svg|jpg|jpeg|webp)$).*)"],
};
