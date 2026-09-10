"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/hooks/useApp";
import { getProblemById } from "@/data/problems";
import { Icon } from "@/components/ui/icon";
import { buildProblemLesson } from "@/content";
import type { QuizQuestion } from "@/types";

function getDifficultyColor(difficulty: string) {
  const colors: Record<string, { bg: string; text: string }> = {
    beginner: { bg: "bg-secondary", text: "text-foreground" },
    easy: { bg: "bg-secondary", text: "text-foreground" },
    medium: { bg: "bg-amber-100", text: "text-amber-700" },
    hard: { bg: "bg-orange-100", text: "text-orange-700" },
    challenge: { bg: "bg-rose-100", text: "text-rose-700" },
  };
  return colors[difficulty] || colors.beginner;
}

function CodeBlock({ code, onRun, language = "cpp" }: { code: string; onRun?: () => void; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  return (
    <div className="code-block">
      <div className="code-header">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-accent" />
          </div>
          <span className="text-xs text-gray-400 ml-2">{language.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-3">
          {onRun && (
            <button
              onClick={onRun}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-bold transition-colors"
            >
              <Icon name="Play" size={14} />
              Run Example
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <Icon name={copied ? "CheckCheck" : "Copy"} size={14} />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <div className="code-content">
        {lines.map((line, i) => (
          <div key={i} className="code-line">
            <span className="code-line-number">{i + 1}</span>
            <span className="text-gray-200 whitespace-pre">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniQuiz({ questions }: { questions: QuizQuestion[] }) {
  const [selected, setSelected] = useState<(number | null)[]>(() =>
    Array(questions?.length ?? 0).fill(null)
  );
  if (!questions || questions.length === 0) return null;

  const handleSelect = (qIndex: number, optionIndex: number) => {
    setSelected((prev) => {
      const next = [...prev];
      next[qIndex] = optionIndex;
      return next;
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg shadow-black/15">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Icon name="Brain" size={16} className="text-accent" />
        Mini Quiz
      </h3>
      <div className="space-y-5">
        {questions.map((q, qIndex) => {
          const picked = selected[qIndex];
          const isAnswered = picked !== null;
          const isCorrect = isAnswered && picked === q.answerIndex;
          return (
            <div key={qIndex}>
              <p className="text-sm font-semibold text-slate-700 mb-2 whitespace-pre-line">{q.question}</p>
              <div className="space-y-1.5">
                {q.options.map((opt, oIndex) => {
                  let style = "border-secondary/60 text-slate-600 hover:border-foreground";
                  if (isAnswered) {
                    if (oIndex === q.answerIndex) {
                      style = "border-secondary bg-secondary text-foreground";
                    } else if (oIndex === picked) {
                      style = "border-rose-300 bg-rose-50 text-rose-600";
                    } else {
                      style = "border-secondary/60 text-slate-400";
                    }
                  }
                  return (
                    <button
                      key={oIndex}
                      onClick={() => !isAnswered && handleSelect(qIndex, oIndex)}
                      className={`flex items-center gap-2 w-full text-left px-3.5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${style} ${isAnswered ? "cursor-default" : "hover:-translate-y-0.5 active:scale-[0.99]"}`}
                    >
                      <span className="w-5 h-5 shrink-0 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-bold">
                        {"ABCD"[oIndex]}
                      </span>
                      <span className="whitespace-pre-line">{opt}</span>
                      {isAnswered && oIndex === q.answerIndex && <Icon name="Check" size={16} className="ml-auto text-foreground" />}
                      {isAnswered && oIndex === picked && oIndex !== q.answerIndex && <Icon name="X" size={16} className="ml-auto text-rose-500" />}
                    </button>
                  );
                })}
              </div>
              {isAnswered && (
                <p className={`mt-2 text-xs font-medium ${isCorrect ? "text-slate-700" : "text-rose-600"}`}>
                  {isCorrect ? "Correct! " : ""}
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LessonPage() {
  const params = useParams();
  const problemId = params?.problemId as string;
  const { progress, language } = useApp();
  const [mounted, setMounted] = useState(false);

  const problem = getProblemById(problemId);
  const content = problem ? buildProblemLesson(problem) : undefined;
  const [exampleOutput, setExampleOutput] = useState<string | null>(null);
  const [runningExample, setRunningExample] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
          <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl">
            <Icon name="GraduationCap" size={28} className="text-foreground" />
          </div>
        </div>
      </div>
    );
  }

  const difficultyStyle = getDifficultyColor(problem.difficulty);
  const isSolved = progress[problem.id]?.status === "solved";

  const runExample = async () => {
    if (!content) return;
    setRunningExample(true);
    setExampleOutput(null);
    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: content.example.code, language }),
      });
      const result = await res.json();
      setExampleOutput(result.output || "(no output)");
    } catch {
      setExampleOutput("Error running example");
    } finally {
      setRunningExample(false);
    }
  };

  const overviewBlocks = content
    ? [
        { icon: "Info", label: "What is it?", text: content.whatIsThis },
        { icon: "Lightbulb", label: "Why use it?", text: content.whyDoWeUseIt },
        { icon: "Brain", label: "How to think", text: content.howToThinkAboutIt },
        { icon: "Target", label: "When to use it", text: content.whenToUseIt },
      ]
    : [];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white sticky top-14 md:top-16 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/learn" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
              <Icon name="ChevronLeft" size={20} />
              <span className="text-sm font-medium">Learning Path</span>
            </Link>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${difficultyStyle.bg} ${difficultyStyle.text}`}>
              {problem.difficulty}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Lesson Header */}
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-2">
            <Icon name="BookOpen" size={20} className="text-accent" />
            <span className="text-sm font-semibold text-foreground">Lesson {String(problem.lessonOrder).padStart(2, "0")}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-700 mb-2">{problem.title}</h1>
          <p className="text-slate-400 max-w-md mx-auto">{problem.description}</p>
          {content && (
            <div className="mt-3 inline-flex flex-wrap justify-center gap-2">
              {problem.concepts.map((concept) => (
                <span key={concept} className="px-3 py-1 rounded-full bg-secondary text-foreground text-xs font-semibold uppercase tracking-wide">
                  {concept}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Concept Overview */}
        {content && (
          <div className="animate-fade-in-up stagger-1">
            <div className="bg-white rounded-3xl p-6 shadow-lg shadow-black/15">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Icon name="Sparkles" size={16} className="text-accent" />
                Concept Overview
              </h3>
              <div className="space-y-4">
                {overviewBlocks.map((block, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-xl bg-background flex items-center justify-center mt-0.5">
                      <Icon name={block.icon} size={15} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{block.label}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{block.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Key Concepts */}
        {content && content.keyConcepts.length > 0 && (
          <div className="animate-fade-in-up stagger-2">
            <div className="bg-background rounded-3xl p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Icon name="Binary" size={16} className="text-accent" />
                Key Ideas
              </h3>
              <div className="space-y-3">
                {content.keyConcepts.map((concept, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-lg shadow-black/15">
                    <p className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary text-foreground text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                      {concept.title}
                    </p>
                    <p className="text-sm text-slate-500">{concept.explanation}</p>
                    {concept.code && (
                      <p className="mt-2 font-mono text-xs bg-background rounded-lg p-2.5 text-slate-600 whitespace-pre-wrap">{concept.code}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Example */}
        {content && (
          <div className="animate-fade-in-up stagger-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="Terminal" size={16} className="text-accent" />
              Example
            </h3>
            <p className="text-sm text-slate-500 mb-3">{content.example.explanation}</p>
            <CodeBlock code={content.example.code} onRun={runExample} language={language} />
            {runningExample && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
                Running...
              </div>
            )}
            {exampleOutput !== null && !runningExample && (
              <div className="mt-3 bg-[#181825] text-gray-300 rounded-xl p-3 font-mono text-xs overflow-x-auto">
                <span className="text-gray-500 mr-2">Output:</span>
                {exampleOutput}
              </div>
            )}
            {content.example.output && !exampleOutput && (
              <div className="mt-3 bg-[#181825] text-gray-300 rounded-xl p-3 font-mono text-xs overflow-x-auto">
                <span className="text-gray-500 mr-2">Expected output:</span>
                {content.example.output}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {content && content.notes.length > 0 && (
          <div className="animate-fade-in-up stagger-4">
            <div className="bg-white rounded-3xl p-6 shadow-lg shadow-black/15">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Icon name="BookOpen" size={16} className="text-accent" />
                Important Notes
              </h3>
              <ul className="space-y-2.5">
                {content.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-accent mt-1"><Icon name="ArrowRight" size={14} /></span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Common Mistakes */}
        {content && content.commonMistakes.length > 0 && (
          <div className="animate-fade-in-up stagger-5">
            <div className="bg-amber-50 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Icon name="AlertTriangle" size={16} className="text-amber-500" />
                Common Mistakes
              </h3>
              <div className="space-y-3">
                {content.commonMistakes.map((mistake, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-lg shadow-black/10">
                    <p className="text-sm text-rose-600 font-medium flex items-start gap-2">
                      <Icon name="X" size={16} className="mt-0.5 shrink-0" />
                      {mistake.mistake}
                    </p>
                    <p className="text-sm text-slate-600 mt-2 flex items-start gap-2">
                      <span className="w-4 h-4 mt-0.5 shrink-0 rounded-full bg-secondary flex items-center justify-center"><Icon name="Check" size={10} className="text-foreground" /></span>
                      {mistake.fix}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mini Quiz */}
        {content && content.quiz.length > 0 && (
          <div className="animate-fade-in-up stagger-6">
            <MiniQuiz questions={content.quiz} />
          </div>
        )}

        {/* Student Task */}
        {content && (
          <div className="animate-fade-in-up stagger-6">
            <div className="bg-secondary/60 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
                <Icon name="Target" size={16} className="text-accent" />
                Your Task
              </h3>
              <p className="text-sm text-foreground/80">{content.studentTask}</p>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="animate-fade-in-up stagger-7">
          <Link
            href={`/practice/${problem.id}`}
            className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-secondary text-foreground rounded-2xl font-bold hover:bg-primary transition-colors shadow-lg shadow-black/20 btn-press"
          >
            <Icon name={isSolved ? "RotateCcw" : "Code"} size={20} />
            {isSolved ? "Practice Again" : "Try It in Practice"}
            <Icon name="ChevronRight" size={20} />
          </Link>
          <p className="text-center text-xs text-slate-400 mt-3">
            Earn {problem.xpReward} XP when you solve this in Practice
          </p>
        </div>
      </div>
    </div>
  );
}