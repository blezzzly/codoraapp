import * as React from "react";
import { Icon } from "@/components/ui/icon";

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-white/60 px-6 py-8 text-center"
          : "flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-white/70 px-6 py-12 text-center"
      }
    >
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-accent">
          <Icon name={icon} size={24} />
        </span>
      )}
      <div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-4">
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-primary opacity-40 animate-ping" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Icon name="Sparkles" size={24} className="text-foreground" />
        </span>
      </span>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-white/70 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
        <Icon name="AlertTriangle" size={24} />
      </span>
      <div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
        >
          <Icon name="RefreshCw" size={16} /> Try again
        </button>
      )}
    </div>
  );
}