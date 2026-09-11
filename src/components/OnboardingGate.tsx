"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import * as db from "@/lib/database";
import { Icon } from "@/components/ui/icon";

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const completed = db.isOnboardingCompleted();
    if (!completed && pathname !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecked(true);
  }, [pathname, router]);

  if (!checked) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <span className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-40" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-xl">
            <Icon name="Sparkles" size={28} className="text-foreground" />
          </span>
        </span>
      </div>
    );
  }

  return <>{children}</>;
}