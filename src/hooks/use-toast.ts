"use client";

import { useState, useEffect, useCallback } from "react";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
}

interface ToastItem extends ToastOptions {
  id: string;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn([...toasts]));
}

function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const DEFAULT_DURATION = 3200;

export function pushToast(options: ToastOptions) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { ...options, id }].slice(-3);
  emit();
  window.setTimeout(() => dismissToast(id), DEFAULT_DURATION);
}

/** React bindings for the global toast store. */
export function useToast() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: Listener = (next) => setItems(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const show = useCallback(
    (options: ToastOptions) => pushToast({ ...options, variant: options.variant ?? "default" }),
    []
  );
  const dismiss = useCallback((_id?: string) => {
    toasts = [];
    emit();
  }, []);

  return { toast: items.length > 0 ? items[items.length - 1] : null, toasts: items, show, dismiss };
}