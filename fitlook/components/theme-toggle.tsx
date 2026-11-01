"use client";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const toggle = () => {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("fl-theme", dark ? "dark" : "light");
    } catch {}
  };
  return (
    <button onClick={toggle} className="rounded-full p-2 hover:bg-muted" aria-label="Switch light or dark mode">
      <Sun className="size-5 hidden dark:block" />
      <Moon className="size-5 dark:hidden" />
    </button>
  );
}
