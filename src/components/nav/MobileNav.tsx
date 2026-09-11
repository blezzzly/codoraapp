"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { primaryNavItems, isNavActive } from "@/components/nav/navItems";

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 md:hidden safe-bottom"
    >
      <div className="mx-auto grid w-full max-w-md grid-cols-5 items-center gap-1 rounded-t-3xl border-t border-border/60 bg-white/95 px-2 pb-1 pt-2 shadow-[0_-6px_24px_-8px_rgba(74,59,94,0.18)] backdrop-blur">
        {primaryNavItems.map((item) => {
          const isActive = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foreground/60"
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-300",
                  isActive ? "bg-primary text-foreground" : "text-slate-400"
                )}
              >
                <Icon name={item.icon} size={20} />
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold transition-colors",
                  isActive ? "text-foreground" : "text-slate-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}