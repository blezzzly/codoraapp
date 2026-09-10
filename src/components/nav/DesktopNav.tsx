"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { isNavActive } from "@/components/nav/navItems";
import HamburgerIcon from "@/components/nav/HamburgerIcon";
import { useApp } from "@/hooks/useApp";
import { LANGUAGES, LanguageId } from "@/lib/languages";

const PROFILE_ITEMS = [
  { href: "/home", icon: "Home", label: "Home" },
  { href: "/community", icon: "MessagesSquare", label: "Community" },
  { href: "/settings", icon: "Settings", label: "Settings" },
  { href: "/profile", icon: "User", label: "Profile" },
];

const MAIN_ITEMS = [
  { href: "/ide", icon: "Terminal", label: "Code" },
  { href: "/learn", icon: "BookOpen", label: "Learn" },
  { href: "/practice", icon: "Target", label: "Practice" },
  { href: "/challenges", icon: "Trophy", label: "Challenges" },
];

const LANGUAGES_ORDER: LanguageId[] = ["cpp", "java", "python"];

export default function DesktopNav() {
  const pathname = usePathname();
  const { profile, language: activeLanguage, setLanguage } = useApp();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 hidden bg-white/90 backdrop-blur-md md:block">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-4">
        <div className="relative shrink-0" ref={langRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="group flex items-center gap-2.5 rounded-xl px-2 -mx-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 transition-colors hover:bg-background/50"
            aria-expanded={isLangOpen}
            aria-haspopup="listbox"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-[0_3px_10px_-2px_rgba(240,192,192,0.6)] transition-transform duration-300 group-hover:scale-105 overflow-hidden">
              <img src="/codoralogo.png" alt="Codora" width={36} height={36} className="object-contain" />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-700">
              codora <span className="text-muted-foreground">{activeLanguage === "cpp" ? "c++" : LANGUAGES[activeLanguage as LanguageId]?.label}</span>
            </span>
            <Icon
              name="ChevronDown"
              size={16}
              className={cn(
                "text-muted-foreground transition-transform duration-300",
                isLangOpen && "rotate-180",
                activeLanguage !== "cpp" && "text-foreground font-bold"
              )}
            />
          </button>

          {isLangOpen && (
            <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg ring-1 ring-black/5 py-2 animate-fade-in-down">
              <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Choose Language
              </p>
              {LANGUAGES_ORDER.map((langId) => {
                const lang = LANGUAGES[langId];
                const isActive = langId === activeLanguage;
                return (
                  <button
                    key={lang.id}
                    onClick={() => {
                      setLanguage(langId);
                      setIsLangOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-background text-foreground"
                        : "text-slate-600 hover:bg-background hover:text-foreground"
                    )}
                  >
                    <Icon name={lang.icon} size={18} className={cn(!isActive && "text-slate-400")} />
                    {lang.label}
                    {isActive && <Icon name="Check" size={16} className="ml-auto text-foreground" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <nav aria-label="Primary" className="hidden md:flex flex-1 items-center justify-center gap-1">
          {MAIN_ITEMS.map((item) => {
            const isActive = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-foreground/60",
                  isActive ? "bg-background text-foreground" : "text-slate-500 hover:bg-background/60 hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon name={item.icon} size={16} className={cn(!isActive && "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 shrink-0">
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
              <HamburgerIcon open={isProfileOpen} className="text-foreground" />
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