"use client";

import React, { useRef, useState, useCallback } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useOnline } from "@/hooks/useOnline";
import { cn } from "@/lib/utils";
import { LANGUAGES, LanguageId } from "@/lib/languages";
import { getLanguageConfig } from "@/lib/languages";
import { explainCompileError } from "@/lib/explainError";
import type { TestCase } from "@/types";

export interface RunResult {
  output: string;
  success: boolean;
  waitingForInput: boolean;
  isError?: boolean;
  errorDetail?: string;
  explanation?: { hint: string; why: string; tryChecking: string; line?: number };
}

export interface CheckResult {
  passed: boolean;
  compileError?: string;
  explanation?: RunResult["explanation"];
  results?: { index: number; passed: boolean; expectedOutput: string; actualOutput: string }[];
}

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  language: LanguageId;
  testCases?: TestCase[];
  onCheckResult?: (result: boolean) => void;
  sourceLabel?: string;
  minHeightClass?: string;
}

export default function CodeEditor({
  code,
  onCodeChange,
  language,
  testCases,
  onCheckResult,
  sourceLabel,
  minHeightClass = "min-h-64",
}: CodeEditorProps) {
  const online = useOnline();
  const { show } = useToast();
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const config = getLanguageConfig(language);

  const [prevLanguage, setPrevLanguage] = useState(language);
  if (prevLanguage !== language) {
    setPrevLanguage(language);
    setRunResult(null);
    setCheckResult(null);
  }

  const ensureOnline = (): boolean => {
    if (!online) {
      show({
        title: "You're offline",
        description: "Code execution requires an internet connection.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleRun = useCallback(async () => {
    if (running) return;
    if (!ensureOnline()) return;
    if (!code.trim()) {
      show({ title: "Write some code first", variant: "default" });
      return;
    }
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, input }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 429) {
        setRunResult({
          output: "",
          success: false,
          waitingForInput: false,
          isError: true,
          errorDetail: "Too many requests. Please wait a moment and try again.",
        });
        return;
      }
      if (!data) {
        setRunResult({
          output: "",
          success: false,
          waitingForInput: false,
          isError: true,
          errorDetail: "The code service returned an empty response. Try again.",
        });
        return;
      }
      if (data.success) {
        setRunResult({
          output: data.output ?? "",
          success: true,
          waitingForInput: !!data.waitingForInput,
          isError: false,
        });
        if (data.waitingForInput) {
          show({
            title: "Your program is waiting for input",
            description:
              "Type something in the Input box, then press Run again.",
          });
        }
      } else {
        const explanation = data.explanation
          ? {
              hint: String(data.explanation?.hint ?? ""),
              why: String(data.explanation?.why ?? ""),
              tryChecking: String(data.explanation?.tryChecking ?? ""),
              line: data.explanation?.line,
            }
          : explainCompileError(String(data.output ?? ""));
        setRunResult({
          output: data.output ?? "",
          success: false,
          waitingForInput: false,
          isError: true,
          errorDetail:
            typeof data.errorType === "string" ? data.errorType : undefined,
          explanation,
        });
      }
    } catch (err) {
      setRunResult({
        output: "",
        success: false,
        waitingForInput: false,
        isError: true,
        errorDetail:
          err instanceof TypeError
            ? "Could not reach the code service."
            : "Something went wrong while running your code.",
      });
    } finally {
      setRunning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language, input, running, online]);

  const handleCheck = useCallback(async () => {
    if (checking) return;
    if (!testCases || testCases.length === 0) return;
    if (!code.trim()) {
      show({ title: "Write some code first", variant: "default" });
      return;
    }
    if (!ensureOnline()) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch("/api/check-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, testCases }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 429) {
        setCheckResult({
          passed: false,
          compileError:
            "Too many requests. Please wait a moment and try again.",
        });
        onCheckResult?.(false);
        return;
      }
      if (!data) {
        setCheckResult({
          passed: false,
          compileError: "The code service returned an empty response. Try again.",
        });
        onCheckResult?.(false);
        return;
      }
      if (data.compileError) {
        setCheckResult({
          passed: false,
          compileError: String(data.compileError),
          explanation: data.explanation
            ? {
                hint: String(data.explanation?.hint ?? ""),
                why: String(data.explanation?.why ?? ""),
                tryChecking: String(data.explanation?.tryChecking ?? ""),
                line: data.explanation?.line,
              }
            : undefined,
        });
        onCheckResult?.(false);
        return;
      }
      const results = Array.isArray(data.results) ? data.results : [];
      const passed = results.length > 0 && results.every((r: { passed: boolean }) => r.passed);
      setCheckResult({ passed, results });
      onCheckResult?.(passed);
    } catch (err) {
      setCheckResult({
        passed: false,
        compileError:
          err instanceof TypeError
            ? "Could not reach the code service."
            : "Something went wrong while checking your code.",
      });
      onCheckResult?.(false);
    } finally {
      setChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language, testCases, checking, online]);

  const reset = useCallback(() => {
    onCodeChange(config.template);
    setRunResult(null);
    setCheckResult(null);
  }, [config.template, onCodeChange]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      show({ title: "Code copied to clipboard", variant: "success" });
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      show({ title: "Could not copy the code", variant: "destructive" });
    }
  }, [code, show]);

  const readsInput = config.readsInput.test(code);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#2d2438] shadow-lg shadow-black/10">
      {/* Editor header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#35294a] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon name="Code2" size={15} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary/90">
            {sourceLabel ?? `${LANGUAGES[language].label} Editor`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={copy}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold text-primary/90 transition-colors hover:bg-white/10"
          >
            <Icon name={copied ? "Check" : "Copy"} size={13} />
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={reset}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold text-primary/90 transition-colors hover:bg-white/10"
          >
            <Icon name="RotateCcw" size={13} />
            Reset
          </button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        aria-label="Code editor"
        className={cn(
          "w-full resize-y bg-transparent p-4 font-mono text-[13.5px] leading-relaxed text-[#fce4ec] outline-none placeholder:text-white/30 selection:bg-primary/30",
          minHeightClass
        )}
        placeholder={`// ${LANGUAGES[language].label} code goes here`}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleRun();
          }
          if (e.key === "Tab") {
            e.preventDefault();
            const el = e.currentTarget;
            const start = el.selectionStart;
            const end = el.selectionEnd;
            const next = code.slice(0, start) + "    " + code.slice(end);
            onCodeChange(next);
            window.requestAnimationFrame(() => {
              el.selectionStart = el.selectionEnd = start + 4;
            });
          }
        }}
      />

      {/* Input + actions */}
      <div className="border-t border-white/10 bg-[#261e33] p-3">
        <label className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-primary/70">
          <span className="flex items-center gap-1.5">
            <Icon name="ArrowDown" size={12} /> Input
          </span>
          {readsInput && (
            <span className="normal-case tracking-normal text-amber-300/90">
              Your code expects input
            </span>
          )}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Program input (stdin)"
            placeholder="Type program input here, e.g. 5 3"
            className="h-10 flex-1 rounded-xl border border-white/10 bg-[#1d1628] px-3 text-[13px] text-[#fce4ec] outline-none placeholder:text-white/30 focus:border-primary/50"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRun();
            }}
          />
          <Button onClick={handleRun} disabled={running} className="h-10 sm:w-auto">
            <Icon
              name={running ? "RotateCw" : "Play"}
              size={16}
              className={running ? "animate-spin" : ""}
            />
            {running ? "Running..." : "Run"}
          </Button>
          {testCases && testCases.length > 0 && (
            <Button
              onClick={handleCheck}
              disabled={checking || running}
              variant={testCases.length > 0 ? "outline" : "ghost"}
              className="h-10 sm:w-auto"
            >
              <Icon
                name={checking ? "RotateCw" : "CheckCircle"}
                size={16}
                className={checking ? "animate-spin" : ""}
              />
              {checking ? "Checking..." : "Check"}
            </Button>
          )}
        </div>
      </div>

      {/* Output section */}
      {(runResult || checkResult) && (
        <div className="border-t border-white/10 bg-[#1d1628] p-4 animate-fade-in-up">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary/70">
              <Icon name="Terminal" size={13} /> Output
            </span>
            <button
              onClick={() => {
                setRunResult(null);
                setCheckResult(null);
              }}
              className="text-[11px] font-bold text-primary/70 hover:text-primary"
            >
              Clear
            </button>
          </div>

          {checkResult && !checkResult.compileError && (
            <div className="mb-3 space-y-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold",
                  checkResult.passed
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-rose-500/15 text-rose-300"
                )}
              >
                <Icon name={checkResult.passed ? "CheckCircle" : "XCircle"} size={18} />
                {checkResult.passed
                  ? "All test cases passed"
                  : "Some test cases failed"}
              </div>
              {(checkResult.results ?? []).map((r) => (
                <div
                  key={r.index}
                  className="rounded-xl border border-white/10 bg-[#261e33] p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "font-bold",
                        r.passed ? "text-emerald-300" : "text-rose-300"
                      )}
                    >
                      {r.passed ? "Passed" : "Failed"} — Test {r.index + 1}
                    </span>
                    <Icon
                      name={r.passed ? "Check" : "X"}
                      size={14}
                      className={r.passed ? "text-emerald-300" : "text-rose-300"}
                    />
                  </div>
                  {!r.passed && (
                    <div className="mt-2 space-y-1 text-primary/80">
                      <p>Expected: {r.expectedOutput}</p>
                      <p>Got: {r.actualOutput === "" ? "(empty output)" : r.actualOutput}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {runResult && (
            <pre
              className={cn(
                "max-h-60 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-[#261e33] p-3 font-mono text-[12.5px] leading-relaxed",
                runResult.isError ? "text-rose-300" : "text-[#fce4ec]"
              )}
            >
              {runResult.output === "" && runResult.success && !runResult.waitingForInput
                ? "(no output)"
                : runResult.output}
            </pre>
          )}

          {(checkResult?.compileError || runResult?.isError) && (
            <div className="mt-2 space-y-2">
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-rose-500/20 bg-rose-950/40 p-3 font-mono text-[12px] leading-relaxed text-rose-300">
                {checkResult?.compileError || runResult?.errorDetail || runResult?.output}
              </pre>
              {(checkResult?.explanation || runResult?.explanation) && (
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs leading-relaxed text-primary-foreground">
                  {(() => {
                    const ex = checkResult?.explanation ?? runResult?.explanation;
                    if (!ex) return null;
                    return (
                      <>
                        <p className="font-bold flex items-center gap-1.5">
                          <Icon name="Lightbulb" size={14} /> {ex.hint}
                        </p>
                        <p className="mt-1 opacity-90">{ex.why}</p>
                        <p className="mt-1 opacity-90">Check: {ex.tryChecking}</p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {runResult?.waitingForInput && (
            <p className="mt-2 text-xs font-semibold text-amber-300">
              Your program may be waiting for input. Enter something in the Input
              box and run it again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}