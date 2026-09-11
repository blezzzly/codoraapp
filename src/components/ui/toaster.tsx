"use client";

import React from "react";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-8"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white p-3.5 shadow-xl shadow-black/10 animate-fade-in-up",
            toast.variant === "destructive" && "border-rose-200",
            toast.variant === "success" && "border-emerald-200",
            toast.variant === "default" && "border-border"
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
              toast.variant === "destructive" && "bg-rose-100 text-rose-600",
              toast.variant === "success" && "bg-emerald-100 text-emerald-600",
              toast.variant === "default" && "bg-primary/50 text-foreground"
            )}
          >
            <Icon
              name={
                toast.variant === "destructive"
                  ? "AlertTriangle"
                  : toast.variant === "success"
                    ? "CheckCircle"
                    : "Info"
              }
              size={16}
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">{toast.title}</p>
            {toast.description && (
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {toast.description}
              </p>
            )}
          </div>
          <button
            onClick={() => dismiss()}
            aria-label="Dismiss notification"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}