"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { buildProblemLesson } from "@/content";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { LoadingState } from "@/components/ui/states";
import { useToast } from "@/hooks/use-toast";
import { saveNote, getNotes, getQuizAnswers, saveQuizAnswers } from "@/lib/database";
import { localizeFilename } from "@/lib/languages";
import { isOfflineCapable, runOffline } from "@/lib/offlineExecutor";
import { isDesktopApp } from "@/lib/desktop";
import { canRunLocally, runLocally } from "@/lib/localRunner";
import { friendlyError } from "@/lib/beginnerErrors";
import type { LanguageId } from "@/lib/languages";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types";

function DIFF_STYLE(difficulty: string): string {
  const map: Record<string, string> = {
    beginner: "bg-secondary text-foreground",
    easy: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    hard: "bg-rose-100 text-rose-700",
  };
  return map[difficulty] ?? "bg-secondary text-foreground";
}

function Quiz({
  problemId,
  language,
  quiz,
}: {
  problemId: string;
  language: LanguageId;
  quiz: QuizQuestion[];
}) {
  const storageKey = `${problemId}:${language}`;
  const saved =
    typeof window !== "undefined" ? getQuizAnswers()[storageKey] : undefined;
  const [answers, setAnswers] = useState<Record<number, number>>(
    saved?.answers ?? {}
  );
  const [revealed, setRevealed] = useState<Set<number>>(
    new Set(saved?.revealed ?? [])
  );

  if (quiz.length === 0) return null;

  const pick = (qIndex: number, optIndex: number) => {
    const nextAnswers = { ...answers, [qIndex]: optIndex };
    const nextRevealed = new Set(revealed).add(qIndex);
    setAnswers(nextAnswers);
    setRevealed(nextRevealed);
    saveQuizAnswers(storageKey, nextAnswers, [...nextRevealed]);
  };

  return (
    <div className="space-y-6">
      {quiz.map((q, qi) => {
        const chosen = answers[qi];
        const isRevealed = revealed.has(qi);
        const correct = chosen === q.answerIndex;

        return (
          <div key={qi} className="rounded-2xl bg-white p-4 shadow-md shadow-black/5">
            <h4 className="text-sm font-bold text-foreground">
              {qi + 1}. {q.question}
            </h4>
            <div className="mt-3 grid gap-2">
              {q.options.map((opt, oi) => {
                const isChosen = chosen === oi;
                const isAnswer = oi === q.answerIndex;
                return (
                  <button
                    key={oi}
                    disabled={isRevealed}
                    onClick={() => pick(qi, oi)}
                    className={cn(
                      "option-card flex items-center gap-2.5 rounded-xl border border-border bg-white px-3.5 py-2.5 text-left text-sm font-semibold text-foreground/80",
                      isRevealed && isAnswer && "correct",
                      isRevealed && isChosen && !isAnswer && "wrong",
                      !isRevealed && "hover:border-primary"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold",
                        isRevealed && isAnswer
                          ? "bg-emerald-500 text-white"
                          : isRevealed && isChosen && !isAnswer
                            ? "bg-rose-500 text-white"
                            : "bg-secondary text-foreground"
                      )}
                    >
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
            {isRevealed && (
              <div
                className={cn(
                  "mt-3 rounded-xl p-3 text-xs leading-relaxed",
                  correct ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                )}
              >
                <p className="font-bold">{correct ? "Correct" : "Not quite"}</p>
                <p className="mt-0.5 opacity-90">{q.explanation}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function LearnLessonPage() {
  const params = useParams<{ problemId: string }>();
  const { problems, isUnlocked, progress, isLoaded, language } = useApp();
  const { show } = useToast();

  const problem = problems.find((p) => p.id === params.problemId) ?? null;
  const [noteDraft, setNoteDraft] = useState<string>("");
  const [runningExample, setRunningExample] = useState(false);
  const [exampleOutput, setExampleOutput] = useState<string | null>(null);
  const [exampleError, setExampleError] = useState<string | null>(null);

  useEffect(() => {
    if (!problem) return;
    const notes = getNotes();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNoteDraft(notes[`lesson:${problem.id}`] ?? "");
  }, [problem]);

  if (!isLoaded) return <LoadingState label="Loading lesson..." />;

  if (!problem) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-foreground">Lesson not found</p>
          <Link href="/learn" className="mt-3 inline-block text-sm font-bold text-accent underline">
            Back to learning path
          </Link>
        </div>
      </div>
    );
  }

  const lesson = buildProblemLesson(problem, language);
  const unlocked = isUnlocked(problem.id);
  const solved = progress[problem.id]?.status === "solved";
  const previous = problems[problems.findIndex((p) => p.id === problem.id) - 1];
  const hasNotes = (getNotes()["lesson:" + problem.id] ?? "").trim().length > 0;

  const runExample = async () => {
    setRunningExample(true);
    setExampleOutput(null);
    setExampleError(null);
    try {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      if (isDesktopApp()) {
        if (!canRunLocally(language)) {
          setExampleError(
            "Java is not available in the desktop app unless a JDK is installed on this computer."
          );
          return;
        }
        const local = await runLocally(lesson.example.code, language, problem.example?.input ?? "");
        if (!local.success) {
          setExampleError(friendlyError(language, local.error ?? "Could not run the example."));
          return;
        }
        setExampleOutput(local.output === "" ? "(no output)" : local.output);
        return;
      }
      if (offline && !isOfflineCapable(language)) {
        setExampleError(
          "Java examples need an internet connection. C++ and Python run offline."
        );
        return;
      }
      let output = "";
      if (offline) {
        const local = await runOffline(lesson.example.code, language, problem.example?.input ?? "");
        if (!local.success) {
          setExampleError(friendlyError(language, local.error ?? "Could not run the example offline."));
          return;
        }
        output = local.output;
      } else {
        const res = await fetch("/api/run-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: lesson.example.code,
            language,
            input: problem.example?.input ?? "",
          }),
        });
        const data = await res.json().catch(() => null);
        if (data?.success) {
          output = data.output ?? "";
        } else {
          setExampleError(String(data?.output ?? "Could not run the example."));
          return;
        }
      }
      setExampleOutput(output === "" ? "(no output)" : output);
    } catch {
      setExampleError(
        "Could not run the example. C++ and Python run offline; Java needs an internet connection."
      );
    } finally {
      setRunningExample(false);
    }
  };

  const saveMyNote = () => {
    saveNote(`lesson:${problem.id}`, noteDraft);
    show({
      title: noteDraft.trim() ? "Note saved" : "Note removed",
      variant: "success",
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/learn"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          aria-label="Back to learning path"
        >
          <Icon name="ChevronLeft" size={20} />
        </Link>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            World {problem.worldOrder} · Lesson {problem.lessonOrder}
          </p>
          <h1 className="truncate text-lg font-extrabold text-foreground">
            {problem.title}
          </h1>
        </div>
        <Badge variant="secondary" className={cn("ml-auto shrink-0", DIFF_STYLE(problem.difficulty))}>
          {problem.difficulty}
        </Badge>
      </div>

      {!unlocked ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-md shadow-black/5">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary text-muted-foreground">
            <Icon name="Lock" size={30} />
          </span>
          <h2 className="mt-4 text-lg font-extrabold text-foreground">
            This lesson is locked
          </h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            Complete{" "}
            <span className="font-bold text-accent">{previous?.title}</span> to
            unlock this lesson.
          </p>
          <Link
            href={`/learn/${previous?.id}`}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-foreground shadow-md"
          >
            Go to previous lesson <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in-up">
          {/* Status banner */}
          {solved ? (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-100 p-4">
              <Icon name="CheckCircle" size={22} className="text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Lesson completed</p>
                <p className="text-xs text-emerald-700">
                  You solved this problem and earned {problem.xpReward} XP.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-primary/30 p-4">
              <Icon name="Lightbulb" size={22} className="text-foreground" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  Complete the practice problem to finish this lesson
                </p>
                <p className="text-xs text-muted-foreground">
                  Earn +{problem.xpReward} XP and unlock the next lesson.
                </p>
              </div>
            </div>
          )}

          {/* Lesson content */}
          <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
            <Section
              icon="Info"
              title="What is this?"
              body={lesson.whatIsThis}
            />
            <Section
              icon="Brain"
              title="Why do we use it?"
              body={lesson.whyDoWeUseIt}
            />
            <Section
              icon="Compass"
              title="How to think about it"
              body={lesson.howToThinkAboutIt}
            />
            <Section
              icon="Lightbulb"
              title="When to use it"
              body={lesson.whenToUseIt}
            />
          </div>

          {/* Key concepts */}
          {lesson.keyConcepts.length > 0 && (
            <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="List" size={18} className="text-accent" />
                <h3 className="text-base font-bold text-foreground">Key concepts</h3>
              </div>
              <div className="space-y-2">
                {lesson.keyConcepts.map((c, i) => (
                  <div key={i} className="rounded-xl bg-background p-3">
                    <p className="text-sm font-bold text-foreground">{c.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{c.explanation}</p>
                    {c.code && (
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-[#2d2438] p-3 font-mono text-xs text-[#fce4ec]">
                        {c.code}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Example */}
          <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="Code" size={18} className="text-accent" />
                <h3 className="text-base font-bold text-foreground">Working example</h3>
              </div>
              <Link
                href={`/ide?problem=${problem.id}&mode=solution&lang=${language}`}
                className="text-xs font-bold text-accent underline"
              >
                Open in IDE
              </Link>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">{lesson.example.explanation}</p>
            <CodeBlock
              code={lesson.example.code}
              language={language}
              title={localizeFilename(problem.filename, language)}
              onRun={runExample}
              running={runningExample}
            />
            {exampleOutput !== null && (
              <div className="mt-3 rounded-xl bg-background p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Output
                </p>
                <pre className="mt-1 font-mono text-sm text-foreground">{exampleOutput}</pre>
              </div>
            )}
            {exampleError && (
              <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                {exampleError}
              </div>
            )}
          </div>

          {/* Notes */}
          {lesson.notes.length > 0 && (
            <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="NotebookPen" size={18} className="text-accent" />
                <h3 className="text-base font-bold text-foreground">Quick notes</h3>
              </div>
              <ul className="space-y-1.5">
                {lesson.notes.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Icon name="Check" size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common mistakes */}
          {lesson.commonMistakes.length > 0 && (
            <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="AlertTriangle" size={18} className="text-amber-500" />
                <h3 className="text-base font-bold text-foreground">Watch out</h3>
              </div>
              <div className="space-y-2">
                {lesson.commonMistakes.map((m, i) => (
                  <div key={i} className="rounded-xl border border-rose-100 bg-rose-50/60 p-3">
                    <p className="text-sm font-bold text-rose-700">✗ {m.mistake}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">→ {m.fix}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz */}
          {lesson.quiz.length > 0 && (
            <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="Brain" size={18} className="text-accent" />
                <h3 className="text-base font-bold text-foreground">Check yourself</h3>
              </div>
              <Quiz problemId={problem.id} language={language} quiz={lesson.quiz} />
            </div>
          )}

          {/* My note */}
          <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon
                  name="Bookmark"
                  size={18}
                  className={hasNotes ? "text-accent" : "text-muted-foreground"}
                />
                <h3 className="text-base font-bold text-foreground">My notes</h3>
              </div>
              <button
                onClick={saveMyNote}
                className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-foreground"
              >
                Save note
              </button>
            </div>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Write what you learned... (saved on this device)"
              rows={3}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          {/* CTA */}
          <div className="rounded-3xl bg-white p-5 shadow-md shadow-black/5">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-foreground shadow-lg">
                <Icon name="Target" size={28} />
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-foreground">
                  {solved ? "Practice again" : "Ready to practice?"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Solve {problem.title} to earn +{problem.xpReward} XP.
                </p>
              </div>
              <Link
                href={`/practice/${problem.id}?lang=${language}`}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-7 text-sm font-bold text-foreground shadow-lg shadow-black/10 transition-all hover:brightness-[0.97]"
              >
                <Icon name="Play" size={17} /> Start practice
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1 flex items-center gap-2">
        <Icon name={icon} size={17} className="text-accent" />
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-foreground">
          {title}
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}