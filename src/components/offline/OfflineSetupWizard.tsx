"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  formatBytes,
  formatEta,
  formatSpeed,
  getEngine,
  type EngineId,
} from "@/lib/offlineRuntime/manifest";
import {
  offlineRuntime,
  type EngineInstallState,
  type InstallProgress,
  type RuntimeSnapshot,
} from "@/lib/offlineRuntime/manager";
import { setPref } from "@/lib/offlineRuntime/registry";

type WizardPhase =
  | "choose"
  | "checking"
  | "installing"
  | "interrupted"
  | "error"
  | "ready";

interface OfflineSetupWizardProps {
  onClose: () => void;
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-black/10", className)}>
      <div
        className="h-full rounded-full bg-emerald-500 transition-all duration-150 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const CHECKABLE: EngineId[] = ["cpp"];

export default function OfflineSetupWizard({ onClose }: OfflineSetupWizardProps) {
  const [phase, setPhase] = useState<WizardPhase>("checking");
  const [states, setStates] = useState<Record<EngineId, EngineInstallState> | null>(null);
  const [snap, setSnap] = useState<RuntimeSnapshot | null>(null);
  const [selected, setSelected] = useState<Record<EngineId, boolean>>({
    cpp: true,
    python: true,
    java: false,
  });
  const [progress, setProgress] = useState<InstallProgress | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (typeof indexedDB === "undefined") {
      setPhase("error");
      setInstallError("This browser does not support the storage this wizard needs.");
      return;
    }
    try {
      await offlineRuntime.ensureBundledRegistered();
      const next: Record<EngineId, EngineInstallState> = {} as never;
      for (const id of ["cpp", "python", "java"] as EngineId[]) {
        next[id] = await offlineRuntime.engineState(id);
      }
      setStates(next);
      setSnap(await offlineRuntime.snapshot());
      setPhase("choose");
    } catch {
      setPhase("error");
      setInstallError("Could not read your offline runtime registry.");
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(t);
  }, [refresh]);

  const selectedDownloadable = useMemo(
    () =>
      CHECKABLE.filter(
        (id) =>
          selected[id] &&
          !!states?.[id] &&
          !states[id].installed &&
          states[id].installable
      ),
    [selected, states]
  );

  const requiredBytes = useMemo(
    () =>
      selectedDownloadable.reduce((sum, id) => sum + (states?.[id]?.totalBytes ?? 0), 0) -
      (selectedDownloadable.length > 0
        ? selectedDownloadable.reduce((sum, id) => sum + (states?.[id]?.installedBytes ?? 0), 0)
        : 0),
    [selectedDownloadable, states]
  );

  const enoughStorage =
    snap === null || snap.available === null || snap.available === undefined || requiredBytes <= snap.available;

  const cppState = states?.cpp;
  const cppPartial = cppState?.partial && !cppState.installed;

  const continueWithoutSetup = useCallback(async () => {
    try {
      await setPref({ setupDismissed: true });
    } catch {
      /* localStorage not available — allow pass-through anyway */
    }
    onClose();
  }, [onClose]);

  const startInstall = useCallback(async () => {
    if (phase === "installing") return;
    if (selectedDownloadable.length === 0) {
      // Nothing left to download — either already installed or nothing chosen.
      await continueWithoutSetup();
      return;
    }
    if (snap && snap.available !== null && requiredBytes > snap.available) {
      setPhase("error");
      setInstallError(
        `Not enough browser storage. Codora needs ${formatBytes(requiredBytes)} but only ${formatBytes(snap.available)} is available. Free up space and try again.`
      );
      return;
    }
    controllerRef.current = new AbortController();
    setPhase("installing");
    setInstallError(null);
    setProgress(null);
    const ids = [...selectedDownloadable];
    const result = await offlineRuntime.install(ids, setProgress, {
      signal: controllerRef.current.signal,
    });
    if (result.ok) {
      await setPref({ setupDismissed: true });
      await refresh();
      setPhase("ready");
    } else if (result.canceled) {
      // Registry already persisted per-file progress; UI offers resume.
      await refresh();
      setPhase("interrupted");
      setInstallError(result.error ?? "Installation was interrupted.");
    } else {
      await refresh();
      setPhase("error");
      setInstallError(result.error ?? "Installation failed.");
    }
  }, [phase, selectedDownloadable, snap, requiredBytes, refresh, continueWithoutSetup]);

  const cancelInstall = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const toggle = useCallback((id: EngineId) => {
    if (!CHECKABLE.includes(id)) return;
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }, []);

  const selectedCount = Object.entries(selected).filter(([, on]) => on).length;

  const overallPct =
    progress && progress.overallTotalBytes > 0
      ? (progress.overallDownloadedBytes / progress.overallTotalBytes) * 100
      : phase === "ready"
        ? 100
        : 0;
  const enginePct =
    progress && progress.engineTotalBytes > 0
      ? (progress.engineDownloadedBytes / progress.engineTotalBytes) * 100
      : 0;

  if (phase === "checking" || !states || !snap) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 text-sm font-semibold text-foreground shadow-xl">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Checking offline engines…
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/40 text-foreground">
            <Icon name="Cpu" size={22} />
          </span>
          <div className="flex-1">
            <p className="text-lg font-extrabold text-foreground">Set up Codora Offline</p>
            <p className="text-xs leading-snug text-muted-foreground">
              Download coding engines once and code even without an internet
              connection. Everything is stored in the PWA — nothing lands in your
              Downloads folder.
            </p>
          </div>
          {phase === "choose" && (
            <button
              onClick={continueWithoutSetup}
              aria-label="Close"
              className="rounded-lg p-1 text-muted-foreground hover:bg-black/5"
            >
              <Icon name="X" size={18} />
            </button>
          )}
        </div>

        {/* Language selection */}
        {phase === "choose" && (
          <div className="mt-4 space-y-2.5">
            <LanguageRow
              icon="FileCode"
              title="C++"
              subtitle="Clang WASM + standard C++ libraries (STL)"
              size={getEngine("cpp").totalBytes}
              checked={selected.cpp}
              disabled={!CHECKABLE.includes("cpp")}
              onToggle={() => toggle("cpp")}
              installed={cppState?.installed}
              badge={cppState?.installed ? "Installed" : undefined}
            />
            <LanguageRow
              icon="FileCode"
              title="Python"
              subtitle="Pyodide runtime + Python standard library"
              size={getEngine("python").totalBytes}
              checked={selected.python}
              disabled
              onToggle={() => {}}
              installed
              badge="Included with the app"
            />
            <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-black/10 bg-slate-50 p-3">
              <Icon name="Lock" size={18} className="mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-bold text-foreground">Java</p>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Browser offline execution is unavailable. Java runs through{" "}
                  <span className="font-semibold">online execution with your explicit
                  consent</span> or the <span className="font-semibold">Codora desktop app</span>{" "}
                  with a bundled JRE.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Selected + storage summary */}
        {phase === "choose" && (
          <div className="mt-4 rounded-xl border border-black/5 bg-slate-50 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">Selected:</span>{" "}
              {selectedCount} language{selectedCount === 1 ? "" : "s"} ·{" "}
              <span className="font-bold text-foreground">Estimated download:</span>{" "}
              {formatBytes(requiredBytes)}
            </p>
            <p>
              <span className="font-bold text-foreground">Required storage:</span>{" "}
              {formatBytes(requiredBytes)} ·{" "}
              <span className="font-bold text-foreground">Available:</span>{" "}
              {snap.available === null ? "unknown" : formatBytes(snap.available)}
              {enoughStorage ? (
                <span className="ml-1 inline-flex items-center gap-0.5 font-bold text-emerald-600">
                  <Icon name="Check" size={12} /> enough
                </span>
              ) : (
                <span className="ml-1 inline-flex items-center gap-0.5 font-bold text-rose-500">
                  <Icon name="X" size={12} /> not enough
                </span>
              )}
            </p>
            {!enoughStorage && (
              <p className="mt-1 text-rose-600">
                Free up browser storage before installing. No large download will
                be started while it clearly cannot fit.
              </p>
            )}
            {snap.persisted && (
              <p className="mt-1 inline-flex items-center gap-1 font-semibold text-emerald-600">
                <Icon name="CheckCheck" size={12} /> Persistent storage granted — runtimes survive
                browser cleanup.
              </p>
            )}
          </div>
        )}

        {/* Install / continue actions */}
        {phase === "choose" && (
          <div className="mt-4 space-y-2">
            <button
              onClick={startInstall}
              disabled={selectedDownloadable.length > 0 && !enoughStorage}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-foreground shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              <Icon name="CloudDownload" size={18} />
              {cppPartial && !cppState.installed
                ? `Resume installation (${cppState.percent}%)`
                : selectedDownloadable.length === 0
                  ? "Continue"
                  : "Install Offline"}
            </button>
            <button
              onClick={continueWithoutSetup}
              className="w-full py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Continue without offline setup
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              You can install the offline engines anytime from Settings → Offline
              environment.
            </p>
          </div>
        )}

        {/* Installing */}
        {(phase === "installing" || phase === "interrupted") && progress && (
          <div className="mt-4 space-y-4">
            <div className="text-sm font-extrabold text-foreground">
              Setting up your offline environment
            </div>

            {/* Overall */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span>Overall</span>
                <span>{Math.round(overallPct)}% complete</span>
              </div>
              <ProgressBar value={overallPct} className="mt-1" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatBytes(progress.overallDownloadedBytes)} /{" "}
                {formatBytes(progress.overallTotalBytes)}
              </p>
            </div>

            {/* Active engine */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span>C++</span>
                <span>
                  {enginePct >= 100 ? "✓ Installed" : `${Math.round(enginePct)}%`}
                </span>
              </div>
              <ProgressBar value={enginePct} className="mt-1" />
              {progress.phase === "verifying" ? (
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Verifying files…
                </p>
              ) : (
                progress.fileName && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Downloading: <span className="font-semibold text-foreground">{progress.fileName}</span>
                  </p>
                )
              )}
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                <p>
                  Speed:{" "}
                  <span className="font-semibold text-foreground">
                    {formatSpeed(progress.speedBytesPerSec ?? 0)}
                  </span>
                </p>
                <p>
                  Time left:{" "}
                  <span className="font-semibold text-foreground">
                    {formatEta(progress.etaSeconds ?? -1)}
                  </span>
                </p>
              </div>
            </div>

            {/* Python / Java rows */}
            <div className="space-y-2">
              <ProgressRow
                title="Python"
                value={100}
                status="Included ✓"
                tone="emerald"
              />
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                <span>Java</span>
                <span>Online / Desktop only</span>
              </div>
            </div>
          </div>
        )}

        {phase === "interrupted" && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-bold text-amber-700">Offline installation interrupted</p>
            <p className="mt-0.5 text-[11px] leading-snug text-amber-700/90">{installError}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={startInstall}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 text-xs font-bold text-white active:scale-95"
              >
                <Icon name="RotateCcw" size={14} /> Resume installation
              </button>
              <button
                onClick={cancelInstall}
                className="h-9 rounded-xl border border-black/10 bg-white px-3 text-xs font-bold text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-sm font-bold text-rose-700">Installation could not complete</p>
            <p className="mt-0.5 text-[11px] leading-snug text-rose-700/90">{installError}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={startInstall}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 text-xs font-bold text-white active:scale-95"
              >
                <Icon name="RotateCcw" size={14} /> Retry
              </button>
              <button
                onClick={continueWithoutSetup}
                className="h-9 rounded-xl border border-black/10 bg-white px-3 text-xs font-bold text-foreground"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Ready */}
        {phase === "ready" && (
          <div className="mt-4">
            <div className="rounded-2xl bg-emerald-50 p-4 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Icon name="CheckCircle" size={26} />
              </span>
              <p className="mt-2 text-base font-extrabold text-emerald-700">
                You&apos;re ready to code offline!
              </p>
              <div className="mt-3 space-y-1.5 text-left text-[12px] font-semibold text-foreground">
                <p className="flex items-center gap-2">
                  <Icon name="Check" size={14} className="text-emerald-600" /> C++ · Clang WASM 8.0.1
                </p>
                <p className="flex items-center gap-2">
                  <Icon name="Check" size={14} className="text-emerald-600" /> Python · Pyodide 0.26.4
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Icon name="Lock" size={14} /> Java · Online / Desktop only
                </p>
                <p className="flex items-center gap-2 pt-1 text-muted-foreground">
                  <Icon name="Cpu" size={14} /> Installed offline storage:{" "}
                  {formatBytes((snap.runtimeUsedBytes ?? 0) + snap.bundledUsedBytes)}
                </p>
              </div>
            </div>
            <button
              onClick={continueWithoutSetup}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-foreground shadow-sm active:scale-[0.99]"
            >
              <Icon name="Wifi" size={18} /> Start Coding
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LanguageRow({
  icon,
  title,
  subtitle,
  size,
  checked,
  disabled,
  onToggle,
  installed,
  badge,
}: {
  icon: string;
  title: string;
  subtitle: string;
  size: number;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  installed?: boolean;
  badge?: string;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-colors",
        checked
          ? "border-primary/40 bg-primary/5"
          : "border-black/5 bg-slate-50",
        disabled && !installed ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          checked ? "border-primary bg-primary text-foreground" : "border-black/25 bg-white"
        )}
      >
        {checked && <Icon name="Check" size={13} />}
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <Icon name={icon as never} size={16} className="text-primary" /> {title}
        </span>
        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
          {subtitle}
        </span>
        {installed ? (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            <Icon name="Check" size={11} /> {badge ?? "Installed"}
          </span>
        ) : (
          <span className="mt-1 inline-block text-[11px] font-semibold text-muted-foreground">
            {formatBytes(size)} to download
          </span>
        )}
      </span>
    </button>
  );
}

function ProgressRow({
  title,
  value,
  status,
  tone,
}: {
  title: string;
  value: number;
  status: string;
  tone: "emerald" | "muted";
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
        <span>{title}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1",
            tone === "emerald" ? "text-emerald-600" : "text-muted-foreground"
          )}
        >
          {tone === "emerald" && <Icon name="Check" size={12} />} {status}
        </span>
      </div>
      {tone === "emerald" && <ProgressBar value={value} className="mt-1" />}
    </div>
  );
}