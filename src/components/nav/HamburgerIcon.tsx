"use client";

import { cn } from "@/lib/utils";

const SPRING_TIMING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

interface HamburgerIconProps {
  open: boolean;
  className?: string;
}

export default function HamburgerIcon({ open, className }: HamburgerIconProps) {
  const line = cn(
    "absolute left-0 h-[2px] w-full rounded-full bg-current transition-all duration-300",
    className
  );

  return (
    <span aria-hidden="true" className={cn("relative block h-4 w-5", className)}>
      <span
        className={cn(line, "top-0", open && "top-[7px] rotate-45")}
        style={{ transitionTimingFunction: SPRING_TIMING }}
      />
      <span
        className={cn(line, "top-[7px]", open && "opacity-0")}
        style={{ transitionTimingFunction: SPRING_TIMING }}
      />
      <span
        className={cn(line, "bottom-0", open && "bottom-[7px] -rotate-45")}
        style={{ transitionTimingFunction: SPRING_TIMING }}
      />
    </span>
  );
}