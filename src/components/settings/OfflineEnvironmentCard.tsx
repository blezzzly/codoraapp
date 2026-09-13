"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  installCppToolchain,
  verifyCppToolchain,
  clearCppToolchain,
  runtimeStorageUsage,
  formatBytes,
  CLANG_TOOLCHAIN_BYTES,
  CLANG_VERSION_TEXT,
  CPP_STANDARD_TEXT,
  PYODIDE_VERSION_TEXT,
  type InstallProgress,
} from "@/lib/runtimeManager";
import { setCppEngine } from "@/lib/offlineExecutor";
import { currentBackend, javaOfflineNote } from "@/lib/executionBackend";
import { isDesktopApp } from "@/lib/desktop";

export default function OfflineEnvironmentCard() {
  const { show } = useToast();
  const backend = currentBackend();

  const [installed, setInstalled] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<InstallProgress | null>(null);
  const [working, setWorking] = useState(false);
  const [storage, setStorage] = useState<{
    runtimeBytes: number;
    siteUsage?: number;
    siteQuota?: number;
  } | null>(null);

  const refresh = useCallback(async () => {
    if (typeof caches === "undefined") return;
    try {
      const v = await verifyCppToolchain();
      setInstalled(v.installed);
      if (v.installed) setCppEngine("clang");
    } catch {
      setInstalled(false);
    }
    runtimeStorageUsage().then(setStorage).catch(() => {});
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(t);
  }, [refresh]);

  const download = useCallback(async () => {
    if (working) return;
    setWorking(true);
    setProgress({
      doneBytes: 0,
      totalBytes: CLANG_TOOLCHAIN_BYTES,
      file: "Preparing…",
      phase: "downloading",
    });
    const res = await installCppToolchain(setProgress);
    setWorking(false);
    if (res.ok) {
      setCppEngine("clang");
      await refresh();
      show({
        title: "C++ compiler installed",
        description:
          "Full C++ now compiles and runs on this device — even with airplane mode on.",
      });
    } else if (!res.canceled) {
      show({
        title: "Download did not finish",
        description: res.error,
        variant: "destructive",
      });
    }
  }, [working, refresh, show]);

  const removeCompiler = useCallback(async () => {
    if (working) return;
    setWorking(true);
    await clearCppToolchain();
    setCppEngine("jscpp");
    setWorking(false);
    await refresh();
    show({
      title: "C++ compiler removed",
      description: "C++ falls back to the light interpreter until you install the Clang toolchain.",
    });
  }, [working, refresh, show]);

  const pct =
    progress && progress.totalBytes > 0
      ? Math.min(100, Math.round((progress.doneBytes / progress.totalBytes) * 100))
      : 0;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/40 text-foreground">
          <Icon name="Cpu" size={20} />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">Offline environment</p>
          <p className="text-xs text-muted-foreground">
            The code engines are stored on this device. After setup, runs never
            contact the internet.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {/* C++ */}
        <div className="flex items-start justify-between gap-3 rounded-xl border border-black/5 bg-slate-50 p-3">
          <div className="flex items-start gap-2.5">
            <Icon name="FileCode" size={18} className="mt-0.5 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">C++</p>
              <p className="text-[11px] leading-snug text-muted-foreground">
                {backend.cppCompiler} · {backend.cppStandard}
              </p>
              {installed === true ? (
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  <Icon name="Check" size={12} /> Installed
                </p>
              ) : (
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                  <Icon name="Download" size={12} /> Auto-installs on first C++ run
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {installed === true ? (
              <>
                <button
                  onClick={download}
                  disabled={working}
                  className="text-[11px] font-bold text-primary/80 hover:text-primary"
                >
                  Check for updates
                </button>
                <button
                  onClick={removeCompiler}
                  disabled={working}
                  className="text-[11px] font-bold text-rose-500/80 hover:text-rose-500"
                >
                  Clear runtime data
                </button>
              </>
            ) : (
              <button
                onClick={download}
                disabled={working}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-foreground shadow-sm active:scale-95"
              >
                <Icon name="Download" size={14} />
                {working ? "Downloading…" : "Install offline compiler"}
              </button>
            )}
          </div>
        </div>

        {progress && progress.phase === "downloading" && (
          <div className="rounded-xl border border-black/5 bg-slate-50 p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span className="truncate pr-2">{progress.file}</span>
              <span>
                {formatBytes(progress.doneBytes)} / {formatBytes(progress.totalBytes)} ({pct}%)
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              One-time download (~{formatBytes(CLANG_TOOLCHAIN_BYTES)}). Keep
              this tab open — you can stop and restart later, nothing breaks.
            </p>
          </div>
        )}

        {/* Python */}
        <div className="flex items-start justify-between gap-3 rounded-xl border border-black/5 bg-slate-50 p-3">
          <div className="flex items-start gap-2.5">
            <Icon name="FileCode" size={18} className="mt-0.5 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">Python</p>
              <p className="text-[11px] leading-snug text-muted-foreground">
                {backend.pythonRuntime}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                <Icon name="Check" size={12} /> Installed
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
            Bundled ✓
          </span>
        </div>

        {/* Java */}
        <div className="flex items-start justify-between gap-3 rounded-xl border border-black/5 bg-slate-50 p-3">
          <div className="flex items-start gap-2.5">
            <Icon name="FileCode" size={18} className="mt-0.5 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">Java</p>
              <p className="text-[11px] leading-snug text-muted-foreground">
                {backend.kind === "desktop"
                  ? "Bundled Temurin JRE + ecj compiler"
                  : "Not bundled on this device"}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {backend.kind === "desktop"
                  ? "Runs fully offline in the desktop app."
                  : javaOfflineNote}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 text-[11px] font-semibold",
              backend.kind === "desktop" ? "text-emerald-600" : "text-muted-foreground"
            )}
          >
            {backend.kind === "desktop" ? "Offline ✓" : "Desktop app"}
          </span>
        </div>
      </div>

      <p className="mt-4 border-t border-black/5 pt-3 text-[11px] leading-relaxed text-muted-foreground">
        {storage
          ? `Clang toolchain: ${formatBytes(storage.runtimeBytes)} · Site storage: ${formatBytes(storage.siteUsage ?? 0)} of ${formatBytes(storage.siteQuota ?? 0)}`
          : `Clang toolchain: ${installed === true ? `~${formatBytes(CLANG_TOOLCHAIN_BYTES)}` : "not installed"}`}
        {isDesktopApp()
          ? " · Desktop backend uses native g++ and a bundled Java runtime."
          : " · Install as an app for the best offline experience."}
      </p>
    </div>
  );
}