"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Icon } from "@/components/ui/icon";
import {
  getDraft,
  setDraft,
  getSavedPrograms,
  saveProgram,
  deleteProgram,
  DEFAULT_IDE_CODE,
  SavedProgram,
} from "@/lib/ideDraft";
import { useApp } from "@/hooks/useApp";
import { getLanguageConfig } from "@/lib/languages";

const CodeEditor = dynamic(
  () => import("@/components/editor/CodeEditor").then((mod) => mod.Editor),
  { ssr: false }
);

export default function IdePage() {
  const { language } = useApp();
  const config = getLanguageConfig(language);
  const [code, setCode] = useState<string>(config?.template ?? DEFAULT_IDE_CODE);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState<SavedProgram[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [showRecent, setShowRecent] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentLang = (language as string) || "cpp";
    setCode(getDraft(currentLang));
    setSaved(getSavedPrograms());
  }, [language]);

  useEffect(() => {
    if (mounted && language) {
      setDraft(code, language);
    }
  }, [code, mounted, language]);

  const handleSave = () => {
    setIsSaving(true);
    setSaveMsg(null);
    const name = window.prompt("Name this program (optional):", saved.length > 0 ? `Program ${saved.length + 1}` : "My first program");
    if (name !== null) {
      const next = saveProgram(name || `Program ${saved.length + 1}`, code);
      setSaved(next);
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(null), 2000);
    }
    setIsSaving(false);
  };

  const loadProgram = (prog: SavedProgram) => {
    setCode(prog.code);
    setShowRecent(false);
  };

  const removeProgram = (id: string) => {
    setSaved(deleteProgram(id));
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
          <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl">
            <Icon name="Code2" size={28} className="text-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white sticky top-14 md:top-16 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link href="/learn" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
              <Icon name="ChevronLeft" size={20} />
              <span className="text-sm font-medium">Learn</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  onClick={() => setShowRecent(!showRecent)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background text-xs font-bold text-foreground hover:bg-secondary transition-colors"
                >
                  <Icon name="Clock" size={14} />
                  Recent
                  {saved.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-secondary text-[10px] flex items-center justify-center">{saved.length}</span>
                  )}
                </button>
                {showRecent && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 py-1 z-50 max-h-72 overflow-auto">
                    {saved.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-slate-400 text-center">No saved programs yet</p>
                    ) : (
                      saved.map((prog) => (
                        <div key={prog.id} className="flex items-center gap-1 px-2 py-1">
                          <button
                            onClick={() => loadProgram(prog)}
                            className="flex-1 text-left px-2 py-1.5 rounded-lg hover:bg-background transition-colors"
                          >
                            <p className="text-xs font-semibold text-slate-700 truncate">{prog.name}</p>
                            <p className="text-[10px] text-slate-400">{new Date(prog.updatedAt).toLocaleString()}</p>
                          </button>
                          <button
                            onClick={() => removeProgram(prog.id)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 transition-colors"
                            aria-label="Delete"
                          >
                            <Icon name="Trash2" size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-xs font-bold text-foreground hover:bg-primary transition-colors shadow-lg disabled:opacity-50"
              >
                <Icon name={saveMsg ? "CheckCheck" : "Copy"} size={14} />
                {saveMsg || "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
            <Icon name="Terminal" size={24} className="text-accent" />
            {config?.label ?? "C++"} Playground
          </h1>
          <p className="text-sm text-slate-400 mt-1">Free editor — write, run, and save any {config?.label ?? "C++"} program.</p>
        </div>

        <div className="animate-fade-in-up stagger-1">
          <CodeEditor
            initialCode={code}
            onCodeChange={setCode}
            onRun={() => {}}
            onCheck={() => {}}
            problemId="ide"
            language={language}
          />
        </div>

        <button
          onClick={() => {
            const template = getLanguageConfig(language).template ?? DEFAULT_IDE_CODE;
            setCode(template);
            setDraft(template, language);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-slate-500 text-xs font-bold shadow-lg shadow-black/15 hover:text-rose-500 transition-colors"
        >
          <Icon name="RotateCcw" size={14} />
          Reset to Template
        </button>
      </div>
    </div>
  );
}