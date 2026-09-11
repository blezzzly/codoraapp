"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { LANGUAGES, LanguageId } from "@/lib/languages";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/states";
import CodeEditor from "@/components/editor/CodeEditor";
import {
  getDraft,
  setDraft,
  getSavedPrograms,
  saveProgram,
  renameProgram,
  deleteProgram,
  hasProblemDraft,
  getProblemDraft,
  SavedProgram,
} from "@/lib/ideDraft";
import { getProblemById, getStarterCode, getSolutionCode } from "@/data/problems";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const LANG_ORDER: LanguageId[] = ["cpp", "java", "python"];

export default function IdePage() {
  const { language: appLanguage, problems, isLoaded } = useApp();
  const searchParams = useSearchParams();
  const { show } = useToast();

  const [language, setLanguage] = useState<LanguageId>("cpp");
  const [code, setCode] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [programName, setProgramName] = useState("");
  const [programs, setPrograms] = useState<SavedProgram[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState("");

  // Initialize from query params (e.g. ?problem=problem-001&mode=solution or ?code=...).
  useEffect(() => {
    if (!isLoaded) return;
    const initialLang = searchParams.getAll("lang")[0] as LanguageId | undefined;
    const startLang =
      initialLang && initialLang in LANGUAGES ? initialLang : appLanguage;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguage(startLang);

    const problemId = searchParams.getAll("problem")[0];
    const mode = searchParams.getAll("mode")[0];
    const explicitCode = searchParams.getAll("code")[0];

    if (explicitCode) {
      setCode(explicitCode);
      setProgramName("");
    } else if (problemId) {
      const problem = problems.find((p) => p.id === problemId);
      if (problem) {
        const c = mode === "solution"
          ? getSolutionCode(problem, startLang)
          : getProblemDraftOrStarter(problem.id, startLang);
        setCode(c);
        setProgramName(`${problem.title} · ${startLang.toUpperCase()}`);
      } else {
        setCode(getDraft(startLang));
      }
    } else {
      setCode(getDraft(startLang));
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, searchParams]);

  // Refresh saved list whenever it changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrograms(getSavedPrograms());
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setDraft(code, language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language]);

  const persist = (newPrograms: SavedProgram[], name?: string) => {
    setPrograms(newPrograms);
    if (name !== undefined) setProgramName(name);
  };

  const doSave = () => {
    const trimmed = programName.trim();
    const next = saveProgram(trimmed || "My program", code, language);
    persist(next, trimmed || "My program");
    setShowSaveModal(false);
    show({ title: "Program saved", variant: "success" });
  };

  const openProgram = (p: SavedProgram) => {
    setLanguage(p.language);
    setCode(p.code);
    setProgramName(p.name);
    setShowOpenModal(false);
  };

  const removeProgram = (id: string) => {
    const next = deleteProgram(id);
    persist(next);
    if (renamingId === id) setRenamingId(null);
  };

  const commitRename = (id: string) => {
    if (renamingName.trim()) {
      const next = renameProgram(id, renamingName.trim());
      persist(next);
    }
    setRenamingId(null);
  };

  const insertTemplate = () => {
    const next = LANGUAGES[language].template;
    setCode(next);
  };

  if (!isLoaded || !loaded) return <LoadingState label="Loading IDE..." />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <PageHeader
        icon="Terminal"
        title="Code Playground"
        subtitle="A free editor for C++, Java, and Python"
        action={
          <div className="hidden items-center gap-2 sm:flex">
            <Button variant="outline" size="sm" onClick={insertTemplate}>
              <Icon name="FilePlus2" size={14} /> Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowOpenModal(true)}>
              <Icon name="FolderOpen" size={14} /> Open
            </Button>
            <Button size="sm" onClick={() => setShowSaveModal(true)}>
              <Icon name="Save" size={14} /> Save
            </Button>
          </div>
        }
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {LANG_ORDER.map((id) => (
            <button
              key={id}
              onClick={() => {
                setLanguage(id);
                setProgramName("");
              }}
              className={cn(
                "flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors",
                id === language
                  ? "bg-primary text-foreground shadow-md shadow-black/10"
                  : "bg-white text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon name={LANGUAGES[id].icon} size={15} />
              {LANGUAGES[id].label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {programName ? (
            <span className="font-bold text-foreground">{programName}</span>
          ) : (
            "Untitled"
          )}
          {code.trim().length > 0 && <> · {code.trim().split(/\s+/).length} words</>}
        </p>
      </div>

      <div className="mt-4">
        <CodeEditor
          code={code}
          onCodeChange={setCode}
          language={language}
          sourceLabel={`IDE · ${LANGUAGES[language].label}`}
          minHeightClass="min-h-[22rem]"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/learn"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          <Icon name="BookOpen" size={15} />
          Still learning? Start the course
        </Link>
        <div className="flex items-center gap-2 sm:hidden">
          <Button variant="outline" size="sm" onClick={() => setShowOpenModal(true)}>
            <Icon name="FolderOpen" size={14} /> Open
          </Button>
          <Button size="sm" onClick={() => setShowSaveModal(true)}>
            <Icon name="Save" size={14} /> Save
          </Button>
        </div>
      </div>

      {/* Save modal */}
      <Modal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save your program"
        description={`Saving as ${LANGUAGES[language].label}`}
      >
        <label htmlFor="program-name" className="mb-1 block text-xs font-bold text-muted-foreground">
          Program name
        </label>
        <input
          id="program-name"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") doSave();
          }}
          placeholder="My program"
          autoFocus
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={() => setShowSaveModal(false)}
            className="inline-flex h-11 items-center rounded-xl border border-border bg-white px-5 text-sm font-bold text-foreground"
          >
            Cancel
          </button>
          <Button onClick={doSave} disabled={!code.trim()}>
            <Icon name="Save" size={16} /> Save
          </Button>
        </div>
      </Modal>

      {/* Open modal */}
      <Modal
        open={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        title="Saved programs"
        description={
          programs.length === 0
            ? "Nothing saved yet. Write some code and hit Save."
            : undefined
        }
        className="max-w-lg"
      >
        {programs.length > 0 && (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {programs.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-accent">
                  <Icon name={LANGUAGES[p.language].icon} size={18} />
                </span>
                {renamingId === p.id ? (
                  <input
                    value={renamingName}
                    onChange={(e) => setRenamingName(e.target.value)}
                    onBlur={() => commitRename(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(p.id);
                    }}
                    autoFocus
                    className="h-9 flex-1 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                  />
                ) : (
                  <button
                    onClick={() => openProgram(p)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-bold text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {LANGUAGES[p.language].label} · {new Date(p.updatedAt).toLocaleString()}
                    </p>
                  </button>
                )}
                {renamingId === p.id ? (
                  <button
                    onClick={() => commitRename(p.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-foreground"
                  >
                    <Icon name="Check" size={16} />
                  </button>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => {
                        setRenamingId(p.id);
                        setRenamingName(p.name);
                      }}
                      aria-label={`Rename ${p.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-background"
                    >
                      <Icon name="Pencil" size={16} />
                    </button>
                    <button
                      onClick={() => removeProgram(p.id)}
                      aria-label={`Delete ${p.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {programs.length === 0 && (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Saved programs appear here and are backed up with your data.
            </p>
          </div>
        )}
        <div className="mt-5 flex items-center justify-end">
          <button
            onClick={() => setShowOpenModal(false)}
            className="inline-flex h-11 items-center rounded-xl border border-border bg-white px-5 text-sm font-bold text-foreground"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}

function getProblemDraftOrStarter(
  problemId: string,
  lang: LanguageId
): string {
  if (hasProblemDraft(problemId, lang)) return getProblemDraft(problemId, lang);
  const problem = getProblemById(problemId);
  return getStarterCode(problem, lang);
}