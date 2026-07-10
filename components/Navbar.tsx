"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, TrendingUp, X } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";

// Journey order: act (Dashboard) → watch (Live Macro) → learn → look up
const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/macro", label: "Live Macro" },
  { href: "/indicators", label: "Learn" },
  { href: "/glossary", label: "Dictionary" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Close the mobile menu on outside tap (link taps close it in their onClick)
  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent | TouchEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [open]);

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-zinc-900 dark:text-white">SwingSignal</span>
            <span className="hidden text-[10px] text-zinc-500 dark:text-zinc-500 sm:block">
              Macro Context Dashboard
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          {/* Desktop links */}
          <div className="hidden items-center gap-4 sm:flex">
            {LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:text-zinc-900 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <ThemeToggle />
          <UserMenu />

          {/* Mobile menu toggle — 44px touch target */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-2 flex h-11 w-11 items-center justify-center text-zinc-700 dark:text-zinc-300 sm:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 sm:hidden">
          {LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:text-zinc-900 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
