"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useApp } from "@/hooks/useApp";
import { getProblemById } from "@/data/problems";
import { Icon } from "@/components/ui/icon";

const DEFAULT_TEMPLATE = `#include <iostream>
using namespace std;

int main() {

//start your program here

}`;

const CodeEditor = dynamic(
  () => import("@/components/editor/CodeEditor").then(mod => mod.Editor),
  { ssr: false }
);

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

function CodeBlock({ code, language = "cpp" }: { code: string; language?: string }) {
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
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <Icon name={copied ? "CheckCheck" : "Copy"} size={14} />
          {copied ? "Copied!" : "Copy"}
        </button>
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

export default function ProblemPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params?.problemId as string;
  const { updateProgress, problems } = useApp();
  
  const [code, setCode] = useState<string>("");
  const [showHint, setShowHint] = useState<number>(0);
  const [testResults, setTestResults] = useState<{ passed: boolean; index: number }[]>([]);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  const problem = getProblemById(problemId);

  useEffect(() => {
    setMounted(true);
    if (problem) {
      setCode(DEFAULT_TEMPLATE);
    }
  }, [problem]);

  if (!mounted || !problem) {
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

  const handleCheck = async (results: { passed: boolean; index: number }[] | null) => {
    if (!problem) return;
    if (!results) return;

    setTestResults(results);
    const allPassed = results.length > 0 && results.every((r) => r.passed);

    if (allPassed) {
      await updateProgress(problem.id, "solved", code);
      setShowSuccess(true);

      const currentIndex = problems.findIndex((p) => p.id === problem.id);
      const nextProblem = problems[currentIndex + 1];

      setTimeout(() => {
        setShowSuccess(false);
        if (nextProblem) {
          router.push(`/learn/${nextProblem.id}`);
        } else {
          router.push("/learn");
        }
      }, 1800);
    } else {
      await updateProgress(problem.id, "in-progress", code);
    }
  };

  const difficultyStyle = getDifficultyColor(problem.difficulty);
  const passedCount = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;

  return (
    <div className="min-h-screen pb-24">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
          <div className="bg-secondary text-foreground px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <Icon name="Trophy" size={24} />
            <div>
              <p className="font-bold">All tests passed!</p>
              <p className="text-sm text-foreground/70">+{problem.xpReward} XP earned</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white sticky top-14 md:top-16 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/practice" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
              <Icon name="ChevronLeft" size={20} />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${difficultyStyle.bg} ${difficultyStyle.text}`}>
                {problem.difficulty}
              </span>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                <Icon name="Zap" size={16} />
                <span>{problem.xpReward}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Problem Header */}
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-3">
            <Icon name="Code" size={20} className="text-accent" />
            <span className="text-sm font-semibold text-foreground">Problem {problem.lessonOrder}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-700 mb-2">{problem.title}</h1>
          <p className="text-slate-400 max-w-md mx-auto">{problem.description}</p>
        </div>

        {/* Problem Statement */}
        <div className="animate-fade-in-up stagger-1">
          <div className="bg-white rounded-3xl p-6 shadow-lg shadow-black/15">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-secondary text-foreground flex items-center justify-center text-xs font-bold">1</span>
                  Input
                </h3>
                <p className="text-slate-700">{problem.input}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-secondary text-foreground flex items-center justify-center text-xs font-bold">2</span>
                  Output
                </h3>
                <p className="text-slate-700">{problem.output}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Example */}
        <div className="animate-fade-in-up stagger-2">
          <div className="bg-background rounded-3xl p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="Sparkles" size={16} className="text-accent" />
              Example
            </h3>
            <div className="bg-white rounded-2xl p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 mb-1">Input</p>
                  <p className="font-mono bg-slate-50 p-2 rounded-lg">{problem.example.input || "(none)"}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Output</p>
                  <p className="font-mono bg-background p-2 rounded-lg text-foreground font-semibold">{problem.example.output}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Constraints */}
        {problem.constraints.length > 0 && (
          <div className="animate-fade-in-up stagger-3">
            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-black/15">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Constraints</h3>
              <ul className="space-y-2">
                {problem.constraints.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-accent mt-1">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Hints */}
        {showHint > 0 && (
          <div className="animate-fade-in-up space-y-2">
            {problem.hints.slice(0, showHint).map((hint, index) => (
              <div key={index} className="bg-background rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Lightbulb" size={16} className="text-accent" />
                  <span className="text-sm font-bold text-foreground">{hint.title}</span>
                </div>
                <p className="text-sm text-foreground">{hint.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Hint Button */}
        {showHint < problem.hints.length && (
          <div className="animate-fade-in-up">
            <button
              onClick={() => setShowHint(showHint + 1)}
              className="w-full py-3 bg-background/60 rounded-2xl text-foreground hover:bg-secondary transition-colors text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Icon name="Lightbulb" size={16} />
              Show Hint {showHint + 1} of {problem.hints.length}
            </button>
          </div>
        )}

        {/* Code Editor */}
        <div className="animate-fade-in-up stagger-4">
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b-2 border-secondary flex items-center gap-2">
              <Icon name="Code2" size={16} className="text-accent" />
              <span className="text-sm font-semibold text-slate-700">{problem.filename}</span>
            </div>
            <CodeEditor
              initialCode={code}
              onCodeChange={setCode}
              onRun={() => {}}
              onCheck={handleCheck}
              problemId={problem.id}
              testCases={problem.testCases}
            />
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="animate-fade-in-up">
            <div className={`rounded-2xl p-5 ${
              passedCount === totalTests
                ? "bg-background"
                : "bg-amber-50"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${passedCount === totalTests ? "text-foreground" : "text-amber-700"}`}>
                  Test Results
                </h3>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  passedCount === totalTests
                    ? "bg-secondary text-foreground"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {passedCount} / {totalTests} passed
                </span>
              </div>
              <div className="space-y-2">
                {testResults.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      r.passed ? "bg-secondary" : "bg-amber-100"
                    }`}
                  >
                    {r.passed ? (
                      <Icon name="Check" size={20} className="text-foreground" />
                    ) : (
                      <Icon name="X" size={20} className="text-amber-600" />
                    )}
                    <span className={`text-sm font-semibold ${r.passed ? "text-foreground" : "text-amber-700"}`}>
                      Test {i + 1}: {r.passed ? "Passed" : "Failed"}
                    </span>
                  </div>
                ))}
              </div>
              {passedCount === totalTests && (
                <div className="mt-4 pt-4 border-t border-primary text-center">
                  <p className="text-foreground font-bold">Great job! You earned {problem.xpReward} XP!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 animate-fade-in-up">
          <Link href="/practice" className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors">
            <Icon name="ChevronLeft" size={20} />
            <span className="text-sm font-medium">All Problems</span>
          </Link>
          <span className="text-xs text-slate-400 text-right">
            Pass all tests to move to
            <br />
            the next lesson
          </span>
        </div>
      </div>
    </div>
  );
}