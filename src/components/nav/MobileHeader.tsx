"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useApp } from "@/hooks/useApp";
import { LANGUAGES, LanguageId } from "@/lib/languages";

const LANG_ORDER: LanguageId[] = ["cpp", "java", "python"];

export default function MobileHeader() {
  const { profile, language, setLanguage } = useApp();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-white/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-2 px-4">
        <Link href="/home" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-md shadow-black/10">
            <Icon name="Sparkles" size={17} className="text-foreground" />
          </span>
          <span className="text-[17px] font-extrabold tracking-tight text-foreground">
            Codora
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5">
            <Icon name="Zap" size={13} className="text-accent" />
            <span className="text-xs font-extrabold text-foreground tabular-nums">
              {profile.xp}
            </span>
          </div>

          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              aria-label="Select language"
              className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-2.5 text-xs font-bold text-foreground"
            >
              <Icon name={LANGUAGES[language].icon} size={14} className="text-foreground/70" />
              {LANGUAGES[language].label}
              <Icon
                name="ChevronDown"
                size={13}
                className={cn("text-muted-foreground transition-transform", langOpen && "rotate-180")}
              />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 rounded-2xl bg-white py-1.5 shadow-xl ring-1 ring-black/5 animate-fade-in-down">
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
                    {language === id && (
                      <Icon name="Check" size={14} className="ml-auto text-accent" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}