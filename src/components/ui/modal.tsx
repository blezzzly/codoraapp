"use client";

import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    triggerRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        ref={triggerRef}
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default bg-foreground/25 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={ref}
        className={cn(
          "relative z-10 w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl",
          "max-h-[85vh] overflow-y-auto",
          className
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background"
          >
            <Icon name="X" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  disabled,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="inline-flex h-11 items-center rounded-xl border border-border bg-white px-5 text-sm font-bold text-foreground transition-colors hover:bg-background"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={disabled}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-md transition-all disabled:opacity-50",
            destructive ? "bg-rose-600 hover:bg-rose-700" : "bg-primary text-primary-foreground"
          )}
        >
          <Icon name={destructive ? "Trash2" : "Check"} size={16} />
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}