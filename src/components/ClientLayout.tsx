"use client";

import React from "react";
import { usePathname } from "next/navigation";
import DesktopNav from "@/components/nav/DesktopNav";
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
      <main className="pb-36 pt-14 md:pb-20 md:pt-16">
        {children}
      </main>
      <DesktopNav />
      <MobileHeader />
      <MobileNav />
      <Toaster />
    </div>
  );
}