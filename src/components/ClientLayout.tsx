"use client";

import React from "react";
import { usePathname } from "next/navigation";
import MobileNav from "@/components/nav/MobileNav";
import MobileHeader from "@/components/nav/MobileHeader";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Toaster } from "@/components/ui/toaster";

const FULLSCREEN_ROUTES = ["/onboarding"];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullscreen =
    FULLSCREEN_ROUTES.includes(pathname) ||
    pathname === "/" ||
    pathname === "/onboarding";

  if (fullscreen) {
    return (
      <div className="min-h-dvh bg-background">
        <Toaster />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <OfflineBanner />
      <main className="pb-24 pt-12">
        {children}
      </main>
      <MobileHeader />
      <MobileNav />
      <Toaster />
    </div>
  );
}