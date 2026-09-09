"use client";

import { useOnline } from "@/hooks/useOnline";

export function OfflineBanner() {
  const online = useOnline();

  if (online) return null;

  return (
    <div className="fixed top-14 inset-x-0 z-50 bg-amber-500 text-white text-center text-xs font-bold px-4 py-2 shadow-lg">
      Offline mode — pages you've visited still open. Running code needs the internet.
    </div>
  );
}