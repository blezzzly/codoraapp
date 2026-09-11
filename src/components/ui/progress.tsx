import * as React from "react";
import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  indicatorClassName,
  label,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>{label}</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
      )}
      <div
        className={cn("h-2 w-full overflow-hidden rounded-full bg-background", className)}
      >
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none",
            indicatorClassName
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}