"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Module-level singleton capturing the browser install prompt, plus tracking
 * of dismissal/installed state so the UI never nags repeatedly.
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferredPrompt: InstallPromptEvent | null = null;
let dismissed = false;
let installed = false;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    const event = e as unknown as InstallPromptEvent;
    deferredPrompt = event;
    dismissed = false;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    notify();
  });
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setCanInstall(
        typeof window !== "undefined" &&
          !!deferredPrompt &&
          !dismissed &&
          !installed &&
          window.matchMedia("(display-mode: standalone)").matches === false
      );
      setIsInstalled(
        installed ||
          (typeof window !== "undefined" &&
            window.matchMedia("(display-mode: standalone)").matches)
      );
    };
    listeners.add(refresh);
    refresh();
    return () => {
      listeners.delete(refresh);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (choice.outcome === "accepted") {
      installed = true;
    } else {
      dismissed = true;
    }
    notify();
    return choice.outcome === "accepted";
  }, []);

  const dismiss = useCallback(() => {
    dismissed = true;
    notify();
  }, []);

  return { canInstall, isInstalled, promptInstall, dismiss };
}