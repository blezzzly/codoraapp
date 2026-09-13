"use client";

import { useCallback, useEffect, useState } from "react";
import { offlineRuntime } from "@/lib/offlineRuntime/manager";

export interface RuntimeStatus {
  checked: boolean;
  online: boolean;
  cpp: "checking" | "installed" | "light" | "partial";
  python: "checking" | "installed" | "missing";
  persisted: boolean;
}

function onlineNow(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/**
 * The authoritative "can I compile offline?" answer. Not derived from
 * connectivity alone — it reads the installed-runtime registry, and the
 * online flag is only shown as information.
 */
export function useRuntimeStatus(refreshKey?: number): RuntimeStatus {
  const [status, setStatus] = useState<RuntimeStatus>({
    checked: false,
    online: onlineNow(),
    cpp: "checking",
    python: "checking",
    persisted: false,
  });

  const refresh = useCallback(async () => {
    if (typeof indexedDB === "undefined") {
      setStatus((s) => ({ ...s, checked: true, cpp: "light", python: "missing" }));
      return;
    }
    let cpp: RuntimeStatus["cpp"] = "light";
    try {
      const state = await offlineRuntime.engineState("cpp");
      cpp = state.installed ? "installed" : state.partial ? "partial" : "light";
    } catch {
      cpp = "light";
    }
    let python: RuntimeStatus["python"] = "missing";
    try {
      const state = await offlineRuntime.engineState("python");
      python = state.installed ? "installed" : "missing";
    } catch {
      python = "missing";
    }
    let persisted = false;
    try {
      const snap = await offlineRuntime.snapshot();
      persisted = snap.persisted;
    } catch {
      persisted = false;
    }
    setStatus({ checked: true, online: onlineNow(), cpp, python, persisted });
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const onOnline = () => {
      setStatus((s) => ({ ...s, online: true }));
      void refresh();
    };
    const onOffline = () => {
      setStatus((s) => ({ ...s, online: false }));
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh, refreshKey]);

  return status;
}