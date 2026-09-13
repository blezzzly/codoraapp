"use client";

import React, { useEffect, useState } from "react";
import OfflineSetupWizard from "@/components/offline/OfflineSetupWizard";
import { offlineRuntime } from "@/lib/offlineRuntime/manager";
import { getPrefs } from "@/lib/offlineRuntime/registry";

/**
 * First-launch setup gate. Renders the offline environment wizard (as an
 * overlay, never a redirect) on the very first open when the C++ engine has
 * not been installed yet and the user has not opted to skip setup. Once
 * installed or skipped, it stays out of the way — engines can be managed in
 * Settings → Offline environment.
 */
export default function OfflineSetupGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof indexedDB === "undefined" || typeof caches === "undefined") {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await offlineRuntime.ensureBundledRegistered();
        const cpp = await offlineRuntime.engineState("cpp");
        const prefs = await getPrefs();
        if (!cancelled && !cpp.installed && !prefs.setupDismissed) {
          setVisible(true);
        }
      } catch {
        // A broken storage backend should never block the app.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  return <OfflineSetupWizard onClose={() => setVisible(false)} />;
}