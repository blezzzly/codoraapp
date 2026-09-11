import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "success" | "destructive" | "outline";
}) {
  const styles: Record<string, string> = {
    default: "bg-primary/60 text-foreground",
    secondary: "bg-secondary text-foreground",
    success: "bg-emerald-100 text-emerald-700",
    destructive: "bg-rose-100 text-rose-700",
    outline: "border border-border bg-white text-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}