"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  isNavActive,
  primaryNavItems,
  secondaryNavItems,
} from "@/components/nav/navItems";
import { useApp } from "@/hooks/useApp";
import { LANGUAGES, LanguageId } from "@/lib/languages";

const LANG_ORDER: LanguageId[] = ["cpp", "java", "python"];

export default function DesktopNav() {
  const pathname = usePathname();
  const { profile, language, setLanguage } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 hidden bg-white/90 backdrop-blur-md shadow-sm shadow-black/5 md:block">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
        <Link href="/home" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-black/10">
            <Icon name="Sparkles" size={20} className="text-foreground" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-foreground">
            Codora
          </span>
        </Link>

        <nav aria-label="Primary" className="flex flex-1 items-center gap-1 overflow-x-auto">
          {primaryNavItems.slice(0, 4).map((item) => {
            const isActive = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-foreground/60",
                  isActive
                    ? "bg-background text-foreground"
                    : "text-slate-500 hover:bg-background/60 hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon name={item.icon} size={16} className={cn(!isActive && "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
          {secondaryNavItems.slice(0, 2).map((item) => {
            const isActive = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-foreground/60",
                  isActive
                    ? "bg-background text-foreground"
                    : "text-slate-500 hover:bg-background/60 hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon name={item.icon} size={16} className={cn(!isActive && "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative shrink-0" ref={langRef}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            aria-expanded={langOpen}
            aria-haspopup="listbox"
            aria-label="Select language"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-2.5 py-1.5 text-sm font-bold text-foreground hover:bg-background/60"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary">
              <Icon name={LANGUAGES[language].icon} size={13} className="text-foreground" />
            </span>
            {LANGUAGES[language].label}
            <Icon
              name="ChevronDown"
              size={14}
              className={cn("text-muted-foreground transition-transform", langOpen && "rotate-180")}
            />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-white py-1.5 shadow-xl ring-1 ring-black/5 animate-fade-in-down">
              {LANG_ORDER.map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setLanguage(id);
                    setLangOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-4 py-2 text-sm font-bold transition-colors hover:bg-background/60",
                    language === id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon name={LANGUAGES[id].icon} size={15} className="text-foreground/70" />
                  {LANGUAGES[id].label}
                  {language === id && <Icon name="Check" size={14} className="ml-auto text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5">
            <Icon name="Flame" size={14} className="text-orange-500" />
            <span className="text-sm font-extrabold text-foreground tabular-nums">
              {profile.streak}
            </span>
            <span className="hidden text-xs text-muted-foreground lg:inline">streak</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5">
            <Icon name="Zap" size={14} className="text-accent" />
            <span className="text-sm font-extrabold text-foreground tabular-nums">
              {profile.xp}
            </span>
            <span className="hidden text-xs text-muted-foreground lg:inline">XP</span>
          </div>
        </div>

        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
            aria-label="Open profile menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-foreground hover:bg-secondary transition-colors"
          >
            <Icon name="User" size={18} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-white py-2 shadow-xl ring-1 ring-black/5 animate-fade-in-down">
              <div className="px-4 py-2">
                <p className="text-sm font-bold text-foreground">{profile.username}</p>
                <p className="text-xs text-muted-foreground">
                  Level {profile.level} · {profile.xp} XP
                </p>
              </div>
              <div className="my-1 h-px bg-border" />
              {[
                { href: "/progress", icon: "TrendingUp", label: "Progress" },
                { href: "/library", icon: "Library", label: "Code Library" },
                { href: "/challenges", icon: "Trophy", label: "Challenges" },
                { href: "/community", icon: "Users", label: "Community" },
                { href: "/settings", icon: "Settings", label: "Settings" },
                { href: "/profile", icon: "User", label: "Profile" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-background/60 hover:text-foreground"
                >
                  <Icon name={item.icon} size={16} className="text-muted-foreground" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}