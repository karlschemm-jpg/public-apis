"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Luggage, Shirt, Sparkles, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home, mobile: false },
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt, mobile: true },
  { href: "/trips", label: "Trips", icon: CalendarDays, mobile: true },
  { href: "/outfits", label: "Outfits", icon: Sparkles, mobile: true },
  { href: "/suitcase", label: "Suitcase", icon: Luggage, mobile: true },
  { href: "/profile", label: "Profile", icon: User, mobile: false },
  { href: "/account", label: "Account", icon: Settings, mobile: true },
];

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
              active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className={cn("size-5", active && "text-primary")} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {ITEMS.filter((i) => i.mobile).map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/") || (href === "/account" && path.startsWith("/profile"));
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold">
              <span className={cn("grid h-7 w-12 place-items-center rounded-full transition", active ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                <Icon className="size-5" />
              </span>
              <span className={active ? "text-foreground" : "text-muted-foreground"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
