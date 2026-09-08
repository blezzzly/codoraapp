"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { navItems, isNavActive } from "@/components/nav/navItems";
import { useApp } from "@/hooks/useApp";

const PROFILE_ITEMS = [
  { href: "/", icon: "Home", label: "Home" },
  { href: "/learn", icon: "BookOpen", label: "Learn" },
  { href: "/practice", icon: "Code", label: "Practice" },
  { href: "/community", icon: "MessagesSquare", label: "Community" },
  { href: "/settings", icon: "User", label: "Profile" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { profile } = useApp();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 group-hover:bg-background group-hover:text-foreground"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-foreground shadow-[0_3px_10px_-2px_rgba(240,192,192,0.6)]">
                <Icon name="Menu" size={20} />
              </span>
            </button>

            {isProfileOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-lg ring-1 ring-black/5 py-2 animate-fade-in-up">
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Streak</p>
                      <p className="font-bold text-foreground">{profile.streak} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">XP</p>
                      <p className="font-bold text-foreground">{profile.xp}</p>
                    </div>
                  </div>
                </div>
                {PROFILE_ITEMS.map((item) => {
                  const isActive = isNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-background text-foreground"
                          : "text-slate-600 hover:bg-background hover:text-foreground"
                      )}
                    >
                      <Icon name={item.icon} size={18} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}