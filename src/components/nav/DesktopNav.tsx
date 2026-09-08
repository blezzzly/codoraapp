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

export default function DesktopNav() {
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

  return (
    <header className="fixed inset-x-0 top-0 z-50 hidden bg-white/90 backdrop-blur-md md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-foreground shadow-[0_3px_10px_-2px_rgba(240,192,192,0.6)] transition-transform duration-300 group-hover:scale-105">
            <Icon name="Leaf" size={18} />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-700">
            codora <span className="text-muted-foreground">c++</span>
          </span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 flex-1 justify-center">
          {navItems.slice(0, 4).map((item) => {
            const isActive = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-foreground/60 motion-reduce:transition-none",
                  isActive
                    ? "bg-primary text-foreground shadow-[0_4px_14px_-2px_rgba(240,192,192,0.6)]"
                    : "text-slate-500 hover:bg-background hover:text-foreground"
                )}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50">
              <Icon name="Flame" size={14} className="text-orange-500" />
              <span className="text-sm font-bold text-orange-600 tabular-nums">{profile.streak}</span>
              <span className="text-xs text-orange-500">streak</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background">
              <Icon name="Zap" size={14} className="text-accent" />
              <span className="text-sm font-bold text-foreground tabular-nums">{profile.xp}</span>
              <span className="text-xs text-muted-foreground">XP</span>
            </div>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 transition-all duration-300 hover:bg-background"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-foreground shadow-[0_3px_10px_-2px_rgba(240,192,192,0.6)]">
                <Icon name="Menu" size={18} />
              </span>
              <Icon name="ChevronDown" size={16} className={cn("transition-transform duration-200", isProfileOpen && "rotate-180")} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-lg ring-1 ring-black/5 py-2 animate-fade-in-down">
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
    </header>
  );
}