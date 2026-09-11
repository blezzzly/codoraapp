"use client";

import React from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** A dismissible install call-to-action shown on primary pages when supported. */
export function InstallPrompt({ className }: { className?: string }) {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();
  const { show } = useToast();

  if (!canInstall) return null;

  const handleInstall = async () => {
    const ok = await promptInstall();
    if (ok) {
      show({ title: "Codora installed", description: "Enjoy app-like access and smoother offline use.", variant: "success" });
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-primary/40 bg-white p-5 shadow-lg shadow-black/10",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-background blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-foreground">
            <Icon name="Smartphone" size={22} />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">Install Codora</p>
            <p className="mt-0.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
              Get an app icon on your device for faster access and easier offline use.
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-background"
        >
          <Icon name="X" size={16} />
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="relative mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-foreground shadow-md shadow-black/10 transition-all hover:brightness-[0.97] active:translate-y-px"
      >
        <Icon name="Download" size={16} /> Install Codora
      </button>
    </div>
  );
}