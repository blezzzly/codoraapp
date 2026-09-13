"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  formatBytes,
  getEngine,
  type EngineId,
} from "@/lib/offlineRuntime/manifest";
import {
  offlineRuntime,
  type EngineInstallState,
  type InstallProgress,
  type RuntimeSnapshot,
} from "@/lib/offlineRuntime/manager";
import { setCppEngine } from "@/lib/offlineExecutor";
import { runOfflineSelfTest } from "@/lib/offlineSelfTest";
import { currentBackend, javaOfflineNote } from "@/lib/executionBackend";
import { isDesktopApp } from "@/lib/desktop";
import {
  installJavaTeavmToolchain,
  verifyJavaTeavmToolchain,
  clearJavaTeavmToolchain,
  TEAVM_VERSION_TEXT,
  type InstallProgress as RuntimeInstallProgress,
} from "@/lib/runtimeManager";

type EngineStates = Record<EngineId, EngineInstallState>;

export default function OfflineEnvironmentCard() {
  const { show } = useToast();
  const backend = currentBackend();

  const [states, setStates] = useState<EngineStates | null>(null);
  const [snap, setSnap] = useState<RuntimeSnapshot | null>(null);
  const [progress, setProgress] = useState<InstallProgress | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (typeof indexedDB === "undefined") return;
    try {
      await offlineRuntime.ensureBundledRegistered();
      const next = {} as EngineStates;
      for (const id of ["cpp", "python", "java"] as EngineId[]) {
        next[id] = await offlineRuntime.engineState(id);
      }
      setStates(next);
      setSnap(await offlineRuntime.snapshot());
      if (next.cpp.installed) setCppEngine("clang");
    } catch {
      /* keep previous state */
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(t);
  }, [refresh]);

  const run = useCallback(
    async (task: () => Promise<{ ok: boolean; canceled?: boolean; error?: string }>) => {
      if (busy) return null;
      setBusy(true);
      setProgress(null);
      const res = await task();
      setBusy(false);
      await refresh();
      return res;
    },
    [busy, refresh]
  );

  const installCpp = useCallback(() => {
    void run(async () => {
      const res = await offlineRuntime.install(["cpp"], setProgress);
      if (res.ok) {
        setCppEngine("clang");
        show({
          title: "C++ offline engine ready",
          description: "Clang now compiles and runs on this device — even with airplane mode on.",
        });
      } else if (!res.canceled) {
        show({ title: "Installation did not finish", description: res.error, variant: "destructive" });
      }
      return res;
    });
  }, [run, show]);

  const repairCpp = useCallback(() => {
    void run(async () => {
      const res = await offlineRuntime.repair("cpp", setProgress);
      if (res.ok) {
        setCppEngine("clang");
        show({
          title: "C++ engine repaired",
          description: "Corrupted files were re-downloaded and verified.",
        });
      } else if (!res.canceled) {
        show({ title: "Repair did not finish", description: res.error, variant: "destructive" });
      }
      return res;
    });
  }, [run, show]);

  const verifyCpp = useCallback(() => {
    void run(async () => {
      const outcome = await offlineRuntime.verify("cpp");
      if (outcome.ok) {
        show({
          title: "C++ engine verified",
          description: "Every file matches its checksum. Nothing is corrupted.",
        });
      } else {
        show({
          title: "Corrupted files found",
          description: `${outcome.mismatches.length} file(s) failed verification. Run Repair to fix.`,
          variant: "destructive",
        });
      }
      return { ok: outcome.ok };
    });
  }, [run, show]);

  const removeCpp = useCallback(() => {
    void run(async () => {
      await offlineRuntime.remove("cpp");
      setCppEngine("jscpp");
      show({
        title: "C++ engine removed",
        description: "C++ falls back to the light interpreter until you install the Clang toolchain again.",
      });
      return { ok: true };
    });
  }, [run, show]);

  const installJava = useCallback(() => {
    void run(async () => {
      const res = await installJavaTeavmToolchain((p) => {
        // Convert simple InstallProgress to the UI's InstallProgress format
        setProgress({
          phase: p.phase as "downloading" | "verifying" | "ready" | "interrupted" | "error",
          engineId: "java",
          engineDownloadedBytes: p.doneBytes,
          engineTotalBytes: p.totalBytes,
          overallDownloadedBytes: p.doneBytes,
          overallTotalBytes: p.totalBytes,
          overallPercent: p.totalBytes > 0 ? (p.doneBytes / p.totalBytes) * 100 : 0,
          fileUrl: p.file,
          fileName: p.file?.split("/").pop(),
        });
      });
      if (res.ok) {
        show({
          title: "Java offline engine ready",
          description: "TeaVM now compiles and runs Java on this device — even with airplane mode on.",
        });
      } else if (!res.canceled) {
        show({ title: "Installation did not finish", description: res.error, variant: "destructive" });
      }
      return res;
    });
  }, [run, show]);

  const repairJava = useCallback(() => {
    void run(async () => {
      const res = await offlineRuntime.repair("java", setProgress);
      if (res.ok) {
        show({
          title: "Java engine repaired",
          description: "Corrupted files were re-downloaded and verified.",
        });
      } else if (!res.canceled) {
        show({ title: "Repair did not finish", description: res.error, variant: "destructive" });
      }
      return res;
    });
  }, [run, show]);

  const verifyJava = useCallback(() => {
    void run(async () => {
      const outcome = await verifyJavaTeavmToolchain();
      if (outcome.installed) {
        show({
          title: "Java engine verified",
          description: "Every file matches its checksum. Nothing is corrupted.",
        });
      } else {
        show({
          title: "Corrupted files found",
          description: `${outcome.missing.length} file(s) failed verification. Run Repair to fix.`,
          variant: "destructive",
        });
      }
      return { ok: outcome.installed };
    });
  }, [run, show]);

  const removeJava = useCallback(() => {
    void run(async () => {
      await clearJavaTeavmToolchain();
      show({
        title: "Java engine removed",
        description: "Java falls back to online execution with your explicit consent.",
      });
      return { ok: true };
    });
  }, [run, show]);

  const checkUpdates = useCallback(() => {
    void run(async () => {
      const stale = await offlineRuntime.checkForUpdates();
      if (stale.length === 0) {
        show({
          title: "Everything is up to date",
          description: "All offline engines match the latest codora release.",
        });
      } else {
        show({
          title: "Engine update available",
          description: `${stale.map((id) => getEngine(id).label).join(", ")} need to be refreshed.`,
          variant: "destructive",
        });
      }
      return { ok: true };
    });
  }, [run, show]);

  const requestPersistence = useCallback(() => {
    void run(async () => {
      const granted = await offlineRuntime.requestPersistence();
      show(
        granted
          ? { title: "Persistent storage granted", description: "Offline engines will survive browser cleanup." }
          : {
              title: "Persistent storage not granted",
              description: "The browser may clear these files under storage pressure.",
              variant: "destructive",
            }
      );
      return { ok: true };
    });
  }, [run, show]);

  const selfTest = useCallback(() => {
    void run(async () => {
      const res = await runOfflineSelfTest();
      const cppLine = res.cpp.installed
        ? `C++ verified${res.cpp.verified ? " + probe ran" : " (hash mismatch)"}`
        : "C++ not installed";
      const pyLine = res.python.installed
        ? `Python verified${res.python.verified ? " + probe ran" : " (hash mismatch)"}`
        : "Python not installed";
      const javaLine = res.java.installed
        ? `Java verified${res.java.verified ? " + probe ran" : " (hash mismatch)"}`
        : "Java not installed";
      if (res.ok) {
        show({
          title: "Offline self-test passed",
          description: `${cppLine} · ${pyLine} · ${javaLine}. C++, Python and Java Run work with no internet.`,
        });
      } else {
        show({
          title: "Offline self-test found issues",
          description: `${cppLine} · ${pyLine} · ${javaLine}. ${res.errors.join("; ")}`,
          variant: "destructive",
        });
      }
      return { ok: res.ok };
    });
  }, [run, show]);

  const cpp = states?.cpp;
  const java = states?.java;
  const cppPct =
    progress && progress.engineTotalBytes > 0
      ? (progress.engineDownloadedBytes / progress.engineTotalBytes) * 100
      : cpp?.percent ?? 0;
  const javaPct =
    progress && progress.engineTotalBytes > 0
      ? (progress.engineDownloadedBytes / progress.engineTotalBytes) * 100
      : java?.percent ?? 0;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/40 text-foreground">
          <Icon name="Cpu" size={20} />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">Offline environment</p>
          <p className="text-xs text-muted-foreground">
            Engines are stored on this device. After setup, runs never contact the
            internet.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {/* C++ */}
        <div className="rounded-xl border border-black/5 bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Icon name="FileCode" size={18} className="mt-0.5 text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">C++</p>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {cpp ? cpp.version : backend.cppCompiler} · ≈{" "}
                  {formatBytes(cpp?.totalBytes ?? 0)}
                </p>
                {cpp?.installed ? (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    <Icon name="Check" size={12} /> Installed
                  </p>
                ) : cpp?.partial ? (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                    <Icon name="Download" size={12} /> {cpp.percent}% downloaded — resume
                  </p>
                ) : (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    <Icon name="Info" size={12} /> Light mode · installs on first run
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {cpp?.installed ? (
                <>
                  <button onClick={verifyCpp} disabled={busy} className="text-[11px] font-bold text-primary/80 hover:text-primary">
                    Verify files
                  </button>
                  <button onClick={repairCpp} disabled={busy} className="text-[11px] font-bold text-amber-600/80 hover:text-amber-600">
                    Repair
                  </button>
                  <button onClick={removeCpp} disabled={busy} className="text-[11px] font-bold text-rose-500/80 hover:text-rose-500">
                    Remove
                  </button>
                </>
              ) : (
                <button
                  onClick={installCpp}
                  disabled={busy}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-foreground shadow-sm active:scale-95"
                >
                  <Icon name="Download" size={14} />
                  {busy ? "Working…" : cpp?.partial ? "Resume download" : "Install offline compiler"}
                </button>
              )}
            </div>
          </div>

          {(progress?.engineId === "cpp" || cpp?.partial) && !cpp?.installed && (
            <div className="mt-3 rounded-lg border border-black/5 bg-white p-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span className="truncate pr-2">
                  {progress?.phase === "verifying"
                    ? "Verifying files…"
                    : progress?.fileName
                      ? `Downloading ${progress.fileName}…`
                      : "Preparing…"}
                </span>
                <span>{Math.min(100, Math.round(cppPct))}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-150"
                  style={{ width: `${cppPct}%` }}
                />
              </div>
              {progress?.fileName && progress.phase === "downloading" && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {formatBytes(progress.engineDownloadedBytes)} /{" "}
                  {formatBytes(progress.engineTotalBytes)} ·{" "}
                  {progress.speedBytesPerSec
                    ? `${formatBytes(progress.speedBytesPerSec)}/s`
                    : ""}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Python */}
        <div className="flex items-start justify-between gap-3 rounded-xl border border-black/5 bg-slate-50 p-3">
          <div className="flex items-start gap-2.5">
            <Icon name="FileCode" size={18} className="mt-0.5 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">Python</p>
              <p className="text-[11px] leading-snug text-muted-foreground">
                {states?.python?.version ?? backend.pythonRuntime} · ≈{" "}
                {formatBytes(states?.python?.totalBytes ?? 0)}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                <Icon name="Check" size={12} /> Installed
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
            Bundled with the app
          </span>
        </div>

        {/* Java */}
        <div className="rounded-xl border border-black/5 bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Icon name="FileCode" size={18} className="mt-0.5 text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">Java</p>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {java ? java.version : TEAVM_VERSION_TEXT} · ≈{" "}
                  {formatBytes(java?.totalBytes ?? 0)}
                </p>
                {java?.installed ? (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    <Icon name="Check" size={12} /> Installed
                  </p>
                ) : java?.partial ? (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                    <Icon name="Download" size={12} /> {java.percent}% downloaded — resume
                  </p>
                ) : (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    <Icon name="Info" size={12} /> Online only · install for offline
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {java?.installed ? (
                <>
                  <button onClick={verifyJava} disabled={busy} className="text-[11px] font-bold text-primary/80 hover:text-primary">
                    Verify files
                  </button>
                  <button onClick={repairJava} disabled={busy} className="text-[11px] font-bold text-amber-600/80 hover:text-amber-600">
                    Repair
                  </button>
                  <button onClick={removeJava} disabled={busy} className="text-[11px] font-bold text-rose-500/80 hover:text-rose-500">
                    Remove
                  </button>
                </>
              ) : (
                <button
                  onClick={installJava}
                  disabled={busy}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-foreground shadow-sm active:scale-95"
                >
                  <Icon name="Download" size={14} />
                  {busy ? "Working…" : java?.partial ? "Resume download" : "Install offline compiler"}
                </button>
              )}
            </div>
          </div>

          {(progress?.engineId === "java" || java?.partial) && !java?.installed && (
            <div className="mt-3 rounded-lg border border-black/5 bg-white p-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span className="truncate pr-2">
                  {progress?.phase === "verifying"
                    ? "Verifying files…"
                    : progress?.fileName
                      ? `Downloading ${progress.fileName}…`
                      : "Preparing…"}
                </span>
                <span>{Math.min(100, Math.round(javaPct))}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-150"
                  style={{ width: `${javaPct}%` }}
                />
              </div>
              {progress?.fileName && progress.phase === "downloading" && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {formatBytes(progress.engineDownloadedBytes)} /{" "}
                  {formatBytes(progress.engineTotalBytes)} ·{" "}
                  {progress.speedBytesPerSec
                    ? `${formatBytes(progress.speedBytesPerSec)}/s`
                    : ""}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <button
          onClick={checkUpdates}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-lg border border-black/5 bg-slate-50 px-2.5 py-1.5 font-bold text-primary/80 hover:text-primary"
        >
          <Icon name="RefreshCw" size={12} /> Check for updates
        </button>
        <button
          onClick={requestPersistence}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-lg border border-black/5 bg-slate-50 px-2.5 py-1.5 font-bold text-primary/80 hover:text-primary"
        >
          <Icon name="Lock" size={12} /> Request persistent storage
        </button>
        <button
          onClick={selfTest}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-lg border border-black/5 bg-slate-50 px-2.5 py-1.5 font-bold text-emerald-600 hover:text-emerald-700"
        >
          <Icon name="CheckCheck" size={12} /> Run offline self-test
        </button>
      </div>

      <p className="mt-3 border-t border-black/5 pt-3 text-[11px] leading-relaxed text-muted-foreground">
        {snap
          ? `Offline storage: ${formatBytes(snap.runtimeUsedBytes + snap.bundledUsedBytes)}` +
            (snap.available !== null
              ? ` · available: ${formatBytes(snap.available)}`
              : " · available: unknown") +
            (snap.persisted ? " · persistent ✓" : " · persistent —")
          : "Loading storage…"}
        {isDesktopApp()
          ? " · Desktop backend uses native g++ and a bundled Java runtime."
          : " · Install as an app for the best offline experience."}
      </p>
    </div>
  );
}