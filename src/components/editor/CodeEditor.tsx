"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useOnline } from "@/hooks/useOnline";
import { cn } from "@/lib/utils";
import { LANGUAGES, LanguageId } from "@/lib/languages";
import { getLanguageConfig } from "@/lib/languages";
import { explainCompileError } from "@/lib/explainError";
import {
  isOfflineCapable,
  normalizeOutputOffline,
  runOffline,
  type OfflineExecResult,
} from "@/lib/offlineExecutor";
import { isDesktopApp } from "@/lib/desktop";
import { canRunLocally, runLocally } from "@/lib/localRunner";
import { friendlyError } from "@/lib/beginnerErrors";
import { javaOfflineNote, currentBackend } from "@/lib/executionBackend";
import type { TestCase } from "@/types";

const JAVA_CLOUD_CONSENT_KEY = "codora-java-cloud-consent";

function javaCloudConsentGiven(): boolean {
  try {
    return localStorage.getItem(JAVA_CLOUD_CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

function grantJavaCloudConsent(): void {
  try {
    localStorage.setItem(JAVA_CLOUD_CONSENT_KEY, "1");
  } catch {
    /* ignore */
  }
}

export interface RunResult {
  output: string;
  success: boolean;
  waitingForInput: boolean;
  isError?: boolean;
  errorDetail?: string;
  explanation?: { hint: string; why: string; tryChecking: string; line?: number };
  localRun?: boolean;
  engineLabel?: string;
}

export interface CheckResult {
  passed: boolean;
  compileError?: string;
  explanation?: RunResult["explanation"];
  localRun?: boolean;
  results?: { index: number; passed: boolean; expectedOutput: string; actualOutput: string }[];
}

interface RemoteOutcome extends RunResult {
  networkError?: boolean;
}

async function runRemoteCode(
  code: string,
  language: LanguageId,
  input: string
): Promise<RemoteOutcome> {
  try {
    const res = await fetch("/api/run-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        input.trim() ? { code, language, input } : { code, language }
      ),
    });
    const data = await res.json().catch(() => null);
    if (res.status === 429) {
      return {
        output: "",
        success: false,
        waitingForInput: false,
        isError: true,
        errorDetail: "Too many requests. Please wait a moment and try again.",
      };
    }
    if (!data) {
      return {
        output: "",
        success: false,
        waitingForInput: false,
        isError: true,
        errorDetail: "The code service returned an empty response. Try again.",
      };
    }
    if (data.waitingForInput) {
      return {
        output: data.output ?? "",
        success: false,
        waitingForInput: true,
        isError: false,
      };
    }
    if (data.success) {
      return {
        output: data.output ?? "",
        success: true,
        waitingForInput: false,
        isError: false,
      };
    }
    const explanation = data.explanation
      ? {
          hint: String(data.explanation?.hint ?? ""),
          why: String(data.explanation?.why ?? ""),
          tryChecking: String(data.explanation?.tryChecking ?? ""),
          line: data.explanation?.line,
        }
      : explainCompileError(String(data.output ?? ""));
    return {
      output: data.output ?? "",
      success: false,
      waitingForInput: false,
      isError: true,
      errorDetail:
        typeof data.errorType === "string" ? data.errorType : undefined,
      explanation,
    };
  } catch (err) {
    if (err instanceof TypeError) {
      return {
        output: "",
        success: false,
        waitingForInput: false,
        isError: true,
        errorDetail: "Could not reach the code service.",
        networkError: true,
      };
    }
    return {
      output: "",
      success: false,
      waitingForInput: false,
      isError: true,
      errorDetail: "Something went wrong while running your code.",
    };
  }
}

function localRunOutcome(res: OfflineExecResult, language: LanguageId): RunResult {
  const engineLabel =
    res.engine === "pyodide"
      ? "Python runtime (Pyodide) — ran on this device"
      : res.engine === "clang-wasm"
        ? "Clang WASM compiler — compiled and ran on this device"
        : res.engine === "jscpp"
          ? "Light in-browser interpreter — install the full C++ compiler in Settings"
          : res.engine === "local"
            ? "Ran on this device"
            : undefined;
  if (res.success) {
    return {
      output: res.output,
      success: true,
      waitingForInput: false,
      isError: false,
      localRun: true,
      engineLabel,
    };
  }
  const message = res.output || res.error || "Unknown error";
  return {
    output: message,
    success: false,
    waitingForInput: false,
    isError: true,
    errorDetail: friendlyError(language, message),
    explanation: explainCompileError(message),
    localRun: true,
    engineLabel,
  };
}

async function checkRemoteCode(
  code: string,
  language: LanguageId,
  testCases: TestCase[]
): Promise<CheckResult & { networkError?: boolean }> {
  try {
    const res = await fetch("/api/check-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language, testCases }),
    });
    const data = await res.json().catch(() => null);
    if (res.status === 429) {
      return {
        passed: false,
        compileError: "Too many requests. Please wait a moment and try again.",
      };
    }
    if (!data) {
      return {
        passed: false,
        compileError: "The code service returned an empty response. Try again.",
      };
    }
    if (data.compileError) {
      return {
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
      };
    }
    const results = Array.isArray(data.results) ? data.results : [];
    const passed =
      results.length > 0 &&
      results.every((r: { passed: boolean }) => r.passed);
    return { passed, results };
  } catch (err) {
    if (err instanceof TypeError) {
      return {
        passed: false,
        compileError: "Could not reach the code service.",
        networkError: true,
      };
    }
    return {
      passed: false,
      compileError: "Something went wrong while checking your code.",
    };
  }
}

async function checkLocalCode(
  code: string,
  language: LanguageId,
  testCases: TestCase[]
): Promise<CheckResult> {
  const results: CheckResult["results"] = [];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const res = await runLocally(code, language, tc.input);
    if (res.engine === "unsupported") {
      return {
        passed: false,
        compileError: friendlyError(language, res.error ?? "Not available on this device."),
        localRun: true,
      };
    }
    const actual = normalizeOutputOffline(res.output);
    const expected = normalizeOutputOffline(tc.expectedOutput);
    results.push({
      index: i,
      passed: res.success && actual === expected,
      expectedOutput: tc.expectedOutput,
      actualOutput: res.success ? res.output : `Error: ${res.error ?? ""}`,
    });
  }
  return {
    passed: results.length > 0 && results.every((r) => r.passed),
    results,
    localRun: true,
  };
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
  const [autoFocusInput, setAutoFocusInput] = useState(false);
  const [focused, setFocused] = useState(false);
  const [javaConsentPending, setJavaConsentPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = getLanguageConfig(language);
  const desktop = isDesktopApp();

  useEffect(() => {
    if (autoFocusInput) inputRef.current?.focus();
  }, [autoFocusInput]);

  const [prevLanguage, setPrevLanguage] = useState(language);
  if (prevLanguage !== language) {
    setPrevLanguage(language);
    setRunResult(null);
    setCheckResult(null);
  }

  const handleRun = useCallback(async () => {
    if (running) return;
    if (!code.trim()) {
      show({ title: "Write some code first", variant: "default" });
      return;
    }
    if (isDesktopApp()) {
      if (!canRunLocally(language)) {
        show({
          title: `Can't run ${LANGUAGES[language].label} in the desktop app`,
          description:
            "C++ and Python always work. Java needs a JDK installed on this computer.",
          variant: "destructive",
        });
        return;
      }
      setRunning(true);
      setRunResult(null);
      setAutoFocusInput(false);
      try {
        const local = await runLocally(code, language, input);
        setRunResult(localRunOutcome(local, language));
      } catch {
        setRunResult({
          output: "",
          success: false,
          waitingForInput: false,
          isError: true,
          errorDetail: "Something went wrong while running your code.",
        });
      } finally {
        setRunning(false);
      }
      return;
    }
    if (language === "java") {
      if (!online) {
        show({
          title: "Java can't run offline in a web browser",
          description: javaOfflineNote,
          variant: "destructive",
        });
        return;
      }
      if (!javaCloudConsentGiven()) {
        setJavaConsentPending(true);
        return;
      }
    }
    if (!online && !isOfflineCapable(language)) {
      show({
        title: `Can't run ${LANGUAGES[language].label} offline`,
        description:
          "Java needs an internet connection. C++ and Python run on your device.",
        variant: "destructive",
      });
      return;
    }
    setRunning(true);
    setRunResult(null);
    setAutoFocusInput(false);
    try {
      // Local-first: whenever code can run on this device, it does — even
      // while online. The remote judge is only a fallback or the
      // explicitly-consented Java path.
      if (isOfflineCapable(language)) {
        const local = await runLocally(code, language, input);
        if (local.engine !== "unsupported") {
          setRunResult(localRunOutcome(local, language));
          return;
        }
      }
      if (online) {
        const outcome = await runRemoteCode(code, language, input);
        setRunResult(outcome);
        if (outcome.waitingForInput) {
          setAutoFocusInput(true);
          show({
            title: "Program is waiting for input",
            description: "Type your input at the $ prompt below, then press Run.",
          });
        }
      } else {
        const local = await runOffline(code, language, input);
        setRunResult(localRunOutcome(local, language));
      }
    } catch {
      setRunResult({
        output: "",
        success: false,
        waitingForInput: false,
        isError: true,
        errorDetail: "Something went wrong while running your code.",
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
    if (isDesktopApp()) {
      if (!canRunLocally(language)) {
        show({
          title: `Can't check ${LANGUAGES[language].label} in the desktop app`,
          description:
            "C++ and Python always work. Java needs a JDK installed on this computer.",
          variant: "destructive",
        });
        return;
      }
      setChecking(true);
      setCheckResult(null);
      try {
        const result = await checkLocalCode(code, language, testCases);
        setCheckResult(result);
        onCheckResult?.(result.passed);
      } catch {
        setCheckResult({
          passed: false,
          compileError: "Something went wrong while checking your code.",
        });
        onCheckResult?.(false);
      } finally {
        setChecking(false);
      }
      return;
    }
    if (!online && !isOfflineCapable(language)) {
      show({
        title: `Can't check ${LANGUAGES[language].label} offline`,
        description:
          "Java needs an internet connection. C++ and Python run on your device.",
        variant: "destructive",
      });
      return;
    }
    setChecking(true);
    setCheckResult(null);
    try {
      // Local-first, same as Run: offline-capable languages are always checked
      // on-device; the online judge is only a fallback.
      if (isOfflineCapable(language)) {
        const result = await checkLocalCode(code, language, testCases);
        setCheckResult(result);
        onCheckResult?.(result.passed);
        return;
      }
      if (online) {
        const result = await checkRemoteCode(code, language, testCases);
        setCheckResult(result);
        onCheckResult?.(result.passed);
      } else {
        const result = await checkLocalCode(code, language, testCases);
        setCheckResult(result);
        onCheckResult?.(result.passed);
      }
    } catch {
      setCheckResult({
        passed: false,
        compileError: "Something went wrong while checking your code.",
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

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-[#2d2438] shadow-lg shadow-black/10 transition-colors duration-300",
        focused && "editor-typing-glow"
      )}
    >
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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "w-full resize-y bg-transparent p-4 font-mono text-[13.5px] leading-relaxed text-[#fce4ec] outline-none caret-primary placeholder:text-white/30 selection:bg-primary/30",
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

      {/* Console */}
      <div className="border-t border-white/10 bg-[#261e33]">
        <div className="flex items-center justify-between gap-3 px-3 pt-2.5">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary/70">
            <Icon name="Terminal" size={12} /> Console
            {running && (
              <span className="animate-pulse normal-case tracking-normal text-amber-300/90">
                running…
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {testCases && testCases.length > 0 && (
              <Button
                onClick={handleCheck}
                disabled={checking || running}
                variant="outline"
                className="h-8 px-3 text-xs"
              >
                <Icon
                  name={checking ? "RotateCw" : "CheckCircle"}
                  size={14}
                  className={checking ? "animate-spin" : ""}
                />
                {checking ? "Checking..." : "Check"}
              </Button>
            )}
            <Button onClick={handleRun} disabled={running} className="h-8 px-3 text-xs">
              <Icon
                name={running ? "RotateCw" : "Play"}
                size={14}
                className={running ? "animate-spin" : ""}
              />
              {running ? "Running..." : "Run"}
            </Button>
          </div>
        </div>
        <div className="p-3">
          <div className="rounded-xl border border-white/10 bg-[#1d1628] p-3">
          {runResult?.waitingForInput && (
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <Icon name="Keyboard" size={13} />
              Your program is waiting for input — type it at the $ prompt, then press Enter.
            </p>
          )}
          {(runResult || checkResult) && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary/70">
                  <Icon name="Terminal" size={13} /> Output
                  {(runResult?.localRun || checkResult?.localRun) && (
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold normal-case tracking-normal text-primary">
                      ran on your device
                    </span>
                  )}
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
          {runResult?.localRun && runResult.engineLabel && (
            <p className="mt-1 text-[11px] font-medium text-emerald-200/60">
              {runResult.engineLabel}
            </p>
          )}

          {(checkResult?.compileError || runResult?.isError) && (
            <div className="mt-2 space-y-2">
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-rose-500/20 bg-rose-950/40 p-3 font-mono text-[12px] leading-relaxed text-rose-300">
                {checkResult?.compileError || runResult?.errorDetail || runResult?.output}
              </pre>
              {runResult?.isError && runResult.output && runResult.output !== runResult.errorDetail && (
                <details className="rounded-xl border border-white/10 bg-black/20 p-2 text-[11px]">
                  <summary className="cursor-pointer select-none font-sans font-semibold text-primary/70">
                    Show technical compiler output
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-rose-200/70">
                    {runResult.output}
                  </pre>
                </details>
              )}
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
          </div>
          )}

          {(runResult || checkResult) && <div className="mt-3 border-t border-white/10" />}
          <div className={cn("flex items-center gap-2 font-mono text-[13px]", (runResult || checkResult) && "mt-2")}>
            <span
              className={cn(
                "shrink-0 font-bold text-emerald-300",
                runResult?.waitingForInput && "console-caret"
              )}
            >
              $
            </span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Program input (stdin)"
              placeholder={
                runResult?.waitingForInput
                  ? "Type your program's input here, then press Enter"
                  : "Type program input here, e.g. 5 3"
              }
              className="w-full bg-transparent text-[13px] text-[#fce4ec] outline-none placeholder:text-white/30 caret-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRun();
              }}
            />
          </div>
          {!(runResult || checkResult) && (
            <p className="mt-2 text-[11px] leading-relaxed text-primary/50">
              {desktop ? (
                <>
                  Desktop mode — C++, Python, and Java (with JDK) run directly
                  on this device, no internet needed.
                </>
              ) : online ? (
                <>
                  Press <span className="font-bold text-primary/80">Run</span> to execute your code —
                  output appears here, and if your program needs input (cin, input(), Scanner…), type
                  it at the $ prompt.
                </>
              ) : (
                <>
                  You&apos;re offline — your code and notes stay saved.{" "}
                  <span className="font-bold text-amber-300/80">Run</span> works for C++ and
                  Python right on your device. Java needs an internet connection.
                </>
              )}
            </p>
          )}
        </div>
        </div>
        </div>
      {javaConsentPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#241a33] p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              Java uses your internet connection
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#e8d5f5]">
              A web browser cannot run Java on its own — the browser&apos;s sandbox
              has no JVM. To run this Java code, Codora would send your source
              code to an online compiler over the internet.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#e8d5f5]">
              {currentBackend().javaNote}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setJavaConsentPending(false)} variant="ghost">
                Cancel
              </Button>
              <Button
                data-testid="use-online-compiler"
                onClick={() => {
                  grantJavaCloudConsent();
                  setJavaConsentPending(false);
                  handleRun();
                }}
              >
                Use Online Compiler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}