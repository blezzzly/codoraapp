"use client";

import { useCallback, useEffect, useState } from "react";

export type OfflineEngineStatus =
  | "checking"
  | "unsupported"
  | "not-ready"
  | "ready"
  | "preparing";

interface EngineStatusMessage {
  type: string;
  payload?: { engines?: Record<string, boolean>; cacheName?: string };
}

/** Tracks whether the offline C++/Python engines are saved on this device. */
export function useOfflineEngines(): {
  status: OfflineEngineStatus;
  prepare: () => void;
} {
  const [status, setStatus] = useState<OfflineEngineStatus>(() =>
    typeof navigator !== "undefined" && "serviceWorker" in navigator
      ? "checking"
      : "unsupported"
  );

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    let disposed = false;

    const onMessage = (event: MessageEvent<EngineStatusMessage>) => {
      const data = event.data;
      if (!data || typeof data.type !== "string") return;
      if (data.type === "COFORA_ENGINES_STATUS") {
        const engines = data.payload?.engines;
        if (!engines) return;
        const cached = Object.values(engines);
        if (disposed) return;
        setStatus(cached.length > 0 && cached.every(Boolean) ? "ready" : "not-ready");
      }
      if (data.type === "COFORA_PREPARE_DONE") {
        if (!disposed) setStatus("ready");
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker
      .ready.then((reg) => {
        reg.active?.postMessage({ type: "COFORA_ENGINES_STATUS" });
      })
      .catch(() => {
        if (!disposed) setStatus("unsupported");
      });

    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  const prepare = useCallback(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    setStatus("preparing");
    navigator.serviceWorker
      .ready.then((reg) => {
        reg.active?.postMessage({ type: "COFORA_PREPARE_OFFLINE" });
      })
      .catch(() => setStatus("unsupported"));
  }, []);

  return { status, prepare };
}