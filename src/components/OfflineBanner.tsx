"use client";

import React from "react";
import { useOnline } from "@/hooks/useOnline";
import { Icon } from "@/components/ui/icon";

export function OfflineBanner() {
  const online = useOnline();

  if (online) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-[#4A3B5E] px-4 py-2.5 text-center text-xs font-semibold text-white shadow-md animate-fade-in-down"
    >
      <Icon name="WifiOff" size={15} className="shrink-0 text-primary" />
      <span>
        You&apos;re offline. Lessons, progress, and C++ / Python code still work
        on your device. Java needs the internet.
      </span>
    </div>
  );
}