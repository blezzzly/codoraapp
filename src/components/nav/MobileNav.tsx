"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { navItems, isNavActive } from "@/components/nav/navItems";

export default function MobileNav() {
  const pathname = usePathname();

  const SPRING_TIMING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto w-full max-w-[340px] px-4 pb-4">
        <div className="flex items-center justify-between rounded-[30px] bg-white/95 px-2 py-2.5 shadow-[0_-2px_4px_rgba(74,59,94,0.04),0_14px_30px_-8px_rgba(74,59,94,0.22)] ring-1 ring-black/[0.04]">
          <nav className="flex flex-1 justify-center gap-1">
            {navItems.slice(0, 4).map((item) => {
              const isActive = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className="group flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foreground/60"
                  style={{ transitionTimingFunction: SPRING_TIMING }}
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 motion-reduce:transition-none motion-reduce:transform-none",
                      isActive
                        ? "-translate-y-1 scale-110 bg-primary text-foreground shadow-[0_6px_16px_-2px_rgba(240,192,192,0.6)]"
                        : "bg-transparent text-slate-400 group-hover:bg-background group-hover:text-foreground group-active:scale-95 motion-reduce:group-hover:translate-y-0"
                    )}
                  >
                    <Icon
                      name={item.icon}
                      size={isActive ? 22 : 20}
                      className={cn(
                        "transition-all duration-300 motion-reduce:transition-none",
                        isActive && "motion-safe:group-hover:scale-105"
                      )}
                    />
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-semibold leading-none transition-colors duration-300 motion-reduce:transition-none",
                      isActive ? "text-foreground" : "text-slate-400"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </nav>
  );
}