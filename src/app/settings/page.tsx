"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/page-header";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/hooks/use-toast";
import { LANGUAGES, LanguageId } from "@/lib/languages";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { cn } from "@/lib/utils";

const LANG_ORDER: LanguageId[] = ["cpp", "java", "python"];

export default function SettingsPage() {
  const {
    profile,
    language,
    setLanguage,
    updateDailyGoal,
    exportData,
    importData,
    resetAllData,
    refreshData,
  } = useApp();
  const { show } = useToast();
  const { canInstall, promptInstall } = useInstallPrompt();

  const [confirmReset, setConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Reset import feedback when leaving.
  useEffect(() => {
    return () => setImportStatus(null);
  }, []);

  const handleExport = () => {
    const bundle = exportData();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codora-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    show({ title: "Backup downloaded", variant: "success" });
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const result = importData(parsed);
        setImportStatus({
          ok: result.ok,
          message: result.ok ? "Your data was imported and the app reloaded." : result.error ?? "Could not import that file.",
        });
        if (result.ok) {
          refreshData();
          show({ title: "Data imported", variant: "success" });
        } else {
          show({ title: "Import failed", description: result.error, variant: "destructive" });
        }
      } catch {
        setImportStatus({ ok: false, message: "That file isn't valid Codora data." });
        show({ title: "Import failed", description: "That file isn't valid Codora data.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetAllData();
    setConfirmReset(false);
    show({ title: "All data reset", description: "You're back to a fresh start.", variant: "success" });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <PageHeader icon="Settings" title="Settings" subtitle="Language, backups, and more" />

      {/* Preferences */}
      <section>
        <SectionHeader icon="SlidersHorizontal" title="Preferences" />
        <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">Default language</p>
              <p className="text-xs text-muted-foreground">
                Used by the Code Playground and draft templates.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {LANG_ORDER.map((id) => (
                <button
                  key={id}
                  onClick={() => setLanguage(id)}
                  className={cn(
                    "flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors",
                    id === language
                      ? "bg-primary text-foreground shadow-md shadow-black/10"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={id === language}
                >
                  <Icon name={LANGUAGES[id].icon} size={14} />
                  {LANGUAGES[id].label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          <div>
            <p className="text-sm font-bold text-foreground">Daily goal</p>
            <p className="text-xs text-muted-foreground mb-3">
              How many problems you aim to solve per day.
            </p>
            <div className="flex items-center gap-2">
              {[3, 5, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    updateDailyGoal(n);
                    show({ title: `Daily goal set to ${n}`, variant: "success" });
                  }}
                  className={cn(
                    "flex-1 rounded-xl py-3 text-sm font-extrabold transition-all tabular-nums",
                    profile.dailyGoal === n
                      ? "bg-primary text-foreground shadow-md shadow-black/10"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={profile.dailyGoal === n}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Install / offline */}
      <section>
        <SectionHeader icon="Smartphone" title="On-device" />
        <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/40 text-foreground">
                <Icon name="WifiOff" size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Offline support</p>
                <p className="text-xs text-muted-foreground">
                  Lessons, progress, and the code editor are saved on this device.
                  C++ and Python compile and run right on your device with no
                  internet — even from the very first run.
                </p>
              </div>
            </div>
          </div>
          {canInstall && (
            <button
              onClick={promptInstall}
              className="mt-4 flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-foreground shadow-md"
            >
              <Icon name="Download" size={16} /> Install as an app
            </button>
          )}
        </div>
      </section>

      {/* Backup */}
      <section>
        <SectionHeader icon="Database" title="Backup & restore" />
        <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">Export your data</p>
              <p className="text-xs text-muted-foreground">
                Download a JSON backup of progress, code, and settings.
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex h-10 items-center gap-2 rounded-xl bg-secondary px-4 text-xs font-bold text-foreground"
            >
              <Icon name="Download" size={15} /> Export
            </button>
          </div>

          <div className="h-px bg-border" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">Restore a backup</p>
              <p className="text-xs text-muted-foreground">
                Replace current data with an exported file.
              </p>
            </div>
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary">
              <Icon name="Upload" size={15} /> Choose file
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImport(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {importStatus && (
            <div
              className={cn(
                "rounded-xl p-3 text-xs font-semibold",
                importStatus.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              )}
            >
              {importStatus.message}
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section>
        <SectionHeader icon="Info" title="About" />
        <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-foreground">
              <Icon name="Sparkles" size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">Codora</p>
              <p className="text-xs text-muted-foreground">
                Learn C++ through practice · v1.0 · runs in your browser
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span className="rounded-xl bg-background p-3">
              <span className="font-bold text-foreground">Worlds:</span> 3 · 20 lessons
            </span>
            <span className="rounded-xl bg-background p-3">
              <span className="font-bold text-foreground">Languages:</span> C++, Java, Python
            </span>
          </div>
          <Link
            href="/community"
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary"
          >
            <Icon name="Users" size={15} /> Community & feedback
          </Link>
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <SectionHeader icon="AlertTriangle" title="Danger zone" />
        <div className="rounded-3xl border border-rose-200 bg-white p-5 shadow-md shadow-black/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-foreground">Reset everything</p>
              <p className="text-xs text-muted-foreground">
                Deletes all progress, XP, saved code, and settings from this
                device. This can&apos;t be undone.
              </p>
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white shadow-md opacity-90"
            >
              <Icon name="Trash2" size={15} /> Reset
            </button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleReset}
        title="Reset all data?"
        description="Your progress, XP, saved programs, and settings will be permanently deleted from this device."
        confirmLabel="Reset everything"
        destructive
      />
    </div>
  );
}