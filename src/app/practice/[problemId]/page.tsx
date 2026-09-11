"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { getStarterCode } from "@/data/problems";
import { getProblemDraft, setProblemDraft } from "@/lib/ideDraft";
import { LANGUAGES, LanguageId } from "@/lib/languages";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { LoadingState } from "@/components/ui/states";
import CodeEditor from "@/components/editor/CodeEditor";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const LANG_ORDER: LanguageId[] = ["cpp", "java", "python"];

const DIFF_STYLE: Record<string, string> = {
  beginner: "bg-secondary text-foreground",
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
};

export default function PracticeProblemPage() {
  const params = useParams<{ problemId: string }>();
  const { problems, progress, isUnlocked, updateProgress, isLoaded } = useApp();
  const { show } = useToast();

  const problem = problems.find((p) => p.id === params.problemId) ?? null;

  const [language, setLanguage] = useState<LanguageId>("cpp");
  const [code, setCode] = useState("");
  const [hasLoadedCode, setHasLoadedCode] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [justSolved, setJustSolved] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  const st = problem ? progress[problem.id] : undefined;
  const solved = st?.status === "solved";
  const unlocked = problem ? isUnlocked(problem.id) : false;

  // Timer while the page is open.
  useEffect(() => {
    const interval = window.setInterval(() => setTimeSpent((t) => t + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Load starter code / draft for this problem once.
  useEffect(() => {
    if (!problem || !isLoaded) return;
    const saved = getProblemDraft(problem.id, language);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode(saved);
    } else {
      setCode(getStarterCode(problem, language));
    }
    setHasLoadedCode(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id, language, isLoaded]);

  useEffect(() => {
    if (!problem || !hasLoadedCode) return;
    setProblemDraft(problem.id, language, code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]); // persists on every keystroke for this problem draft

  const resetCode = () => {
    if (!problem) return;
    setCode(getStarterCode(problem, language));
    setConfirmReset(false);
  };

  const onCheckResult = async (passed: boolean) => {
    if (passed && !solved) {
      await updateProgress(problem!.id, "solved", code, language);
      setCelebrate(true);
      setJustSolved(true);
      show({
        title: `Solved: ${problem!.title}`,
        description: `+${problem!.xpReward} XP earned.`,
        variant: "success",
      });
      window.setTimeout(() => setCelebrate(false), 2200);
    }
  };

  const changeLanguage = (lang: LanguageId) => {
    if (lang === language) return;
    setLanguage(lang);
    setHasLoadedCode(false);
    setHintsOpen(0);
  };

  if (!isLoaded) return <LoadingState label="Loading problem..." />;

  if (!problem) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-foreground">Problem not found</p>
          <Link href="/practice" className="mt-3 inline-block text-sm font-bold text-accent underline">
            Back to practice
          </Link>
        </div>
      </div>
    );
  }

  const mm = Math.floor(timeSpent / 60);
  const ss = timeSpent % 60;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Confetti overlay */}
      {celebrate && (
        <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-3 w-3 animate-confetti"
              style={
                {
                  left: `${6 + i * 4}%`,
                  backgroundColor: ["#F0C0C0", "#D0BDE0", "#f59e0b", "#34d399", "#fb7185"][i % 5],
                  animationDelay: `${i * 0.03}s`,
                  borderRadius: i % 3 === 0 ? "50%" : "2px",
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/practice"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          aria-label="Back to practice list"
        >
          <Icon name="ChevronLeft" size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            World {problem.worldOrder} · Lesson {problem.lessonOrder}
          </p>
          <h1 className="truncate text-lg font-extrabold text-foreground">
            {problem.title}
          </h1>
        </div>
        <Badge variant="secondary" className={cn(DIFF_STYLE[problem.difficulty])}>
          {problem.difficulty}
        </Badge>
      </div>

      {!unlocked ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-md shadow-black/5">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary text-muted-foreground">
            <Icon name="Lock" size={30} />
          </span>
          <h2 className="mt-4 text-lg font-extrabold text-foreground">Locked</h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            Complete the previous lesson to unlock this problem.
          </p>
          <Link
            href="/learn"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-foreground shadow-md"
          >
            <Icon name="BookOpen" size={16} /> Go to learning path
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {solved && (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-100 p-4">
              <Icon name="CheckCircle" size={22} className="text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Problem solved</p>
                <p className="text-xs text-emerald-700">
                  You earned its XP already. Try improving your solution!
                </p>
              </div>
            </div>
          )}

          {/* Problem statement */}
          <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground">{problem.description}</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-background p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Input
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{problem.input}</p>
              </div>
              <div className="rounded-xl bg-background p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Output
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{problem.output}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-border bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Example
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold text-foreground">Input</p>
                  <pre className="mt-1 rounded-lg bg-background p-2 font-mono text-sm text-foreground">
                    {problem.example.input || "(none)"}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Output</p>
                  <pre className="mt-1 rounded-lg bg-background p-2 font-mono text-sm text-foreground">
                    {problem.example.output}
                  </pre>
                </div>
              </div>
            </div>

            {problem.constraints.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Constraints
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                  {problem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Language tabs */}
          <div className="flex items-center gap-2">
            {LANG_ORDER.map((id) => (
              <button
                key={id}
                onClick={() => changeLanguage(id)}
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

          {/* Hints */}
          <div>
            <div className="flex items-center gap-2">
              <Icon name="Lightbulb" size={16} className="text-amber-500" />
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {hintsOpen === 0
                  ? "Stuck? Open a hint"
                  : `Hint ${hintsOpen} of ${problem.hints.length}`}
              </p>
            </div>
            <div className="mt-2 space-y-2">
              {problem.hints.slice(0, hitsOpenFor(hintsOpen)).map((hint, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 animate-fade-in-up"
                >
                  <p className="text-xs font-bold text-amber-700">
                    Hint {hint.level}: {hint.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{hint.content}</p>
                </div>
              ))}
              {hintsOpen < problem.hints.length && (
                <button
                  onClick={() => setHintsOpen(hintsOpen + 1)}
                  className="text-xs font-bold text-accent"
                >
                  Reveal hint {hintsOpen + 1}
                </button>
              )}
            </div>
          </div>

          {/* Editor */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Editor · {LANGUAGES[language].label}
              </p>
              <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                <span className="tabular-nums">
                  {mm}:{String(ss).padStart(2, "0")}
                </span>
                <button
                  onClick={() => setConfirmReset(true)}
                  className="flex items-center gap-1 font-bold text-accent"
                >
                  <Icon name="RotateCcw" size={13} /> Reset code
                </button>
              </div>
            </div>
            {hasLoadedCode && (
              <CodeEditor
                code={code}
                onCodeChange={setCode}
                language={language}
                testCases={problem.testCases}
                onCheckResult={onCheckResult}
                sourceLabel={`${problem.id} · ${LANGUAGES[language].label}`}
                minHeightClass="min-h-56"
              />
            )}
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-between rounded-2xl bg-white p-4 text-xs shadow-sm shadow-black/5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="Zap" size={14} className="text-accent" />
              <span>
                Reward: <span className="font-bold text-accent">+{problem.xpReward} XP</span>
              </span>
            </div>
            <div className="text-muted-foreground">
              Attempts: <span className="font-bold text-foreground">{st?.attempts ?? 0}</span>
            </div>
          </div>
        </div>
      )}

      {justSolved && (
        <Modal
          open={justSolved}
          onClose={() => setJustSolved(false)}
          title="Problem solved"
          description={`Nice work! You earned +${problem.xpReward} XP.`}
        >
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/learn"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-foreground shadow-md"
            >
              <Icon name="BookOpen" size={16} /> Continue learning
            </Link>
          </div>
        </Modal>
      )}

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset your code?"
        description="Your current code will be replaced with the starter code."
      >
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setConfirmReset(false)}
            className="inline-flex h-11 items-center rounded-xl border border-border bg-white px-5 text-sm font-bold text-foreground"
          >
            Keep my code
          </button>
          <button
            onClick={resetCode}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white shadow-md"
          >
            <Icon name="RotateCcw" size={16} /> Reset
          </button>
        </div>
      </Modal>
    </div>
  );
}

function hitsOpenFor(n: number): number {
  return Math.max(0, Math.min(4, n));
}