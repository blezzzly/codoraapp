"use client";

import React, { ReactNode } from "react";
import DesktopNav from "@/components/nav/DesktopNav";
import MobileNav from "@/components/nav/MobileNav";
import MobileHeader from "@/components/nav/MobileHeader";

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-40 pt-14 md:pb-16 md:pt-16">
        {children}
      </main>

      <DesktopNav />
      <MobileHeader />
      <MobileNav />
    </div>
  );
}