"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useOnline } from "@/hooks/useOnline";
import { useRuntimeStatus } from "@/hooks/useRuntimeStatus";
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
import { installProgressEventName } from "@/lib/runtimeManager";
import {
  wordAtCaret,
  getCompletions,
  formatCode,
  type CompletionItem,
} from "@/lib/codeSmart";
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
  /** True when the on-device engine itself could not start (not a code error). */
  startupFailure?: boolean;
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
  const engineLabel = res.success
    ? res.engine === "pyodide"
      ? "Python runtime (Pyodide) — ran on this device"
      : res.engine === "clang-wasm"
        ? "Clang WASM compiler — compiled and ran on this device"
        : res.engine === "jscpp"
          ? "Light in-browser interpreter — ran on this device"
          : res.engine === "local"
            ? "Ran on this device"
            : undefined
    : res.engine === "pyodide"
      ? "Python runtime (Pyodide) — on this device"
      : res.engine === "clang-wasm"
        ? "Clang WASM compiler — on this device"
        : res.engine === "jscpp"
          ? "Light in-browser interpreter — on this device"
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
  let startupFailure = false;
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
    if (res.startupFailure) startupFailure = true;
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
    startupFailure: startupFailure || undefined,
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
  const [javaConsentAction, setJavaConsentAction] = useState<"run" | "check">("run");
  const [activePane, setActivePane] = useState<"compiler" | "console">("compiler");
  const [suggestions, setSuggestions] = useState<CompletionItem[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [suggestionPos, setSuggestionPos] = useState<{ top: number; left: number } | null>(null);
  const suggestionWordRef = useRef<{ word: string; start: number } | null>(null);
  const installingCppRef = useRef(false);

  // Surface the automatic C++ compiler download (first online C++ run).
  useEffect(() => {
    const evName = installProgressEventName();
    const onProg = (event: Event) => {
      const d = (event as CustomEvent).detail as
        | { phase: string; ok?: boolean; error?: string }
        | undefined;
      if (!d) return;
      if (d.phase === "downloading" && !installingCppRef.current) {
        installingCppRef.current = true;
        show({
          title: "Installing the full offline C++ compiler…",
          description: "One-time download (≈60 MB). Your code will run automatically when it's ready.",
        });
      } else if (d.phase === "done" && installingCppRef.current) {
        installingCppRef.current = false;
        show({
          title: d.ok
            ? "C++ compiler ready — running your code"
            : "Offline C++ compiler not ready yet",
          description: d.ok
            ? "From now on every C++ program compiles with the real Clang compiler."
            : d.error ?? "Check your connection and press Run again.",
          variant: d.ok ? "success" : "destructive",
        });
      }
    };
    window.addEventListener(evName, onProg);
    return () => window.removeEventListener(evName, onProg);
  }, [show]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = getLanguageConfig(language);
  const desktop = isDesktopApp();

  useEffect(() => {
    if (autoFocusInput && activePane === "console") inputRef.current?.focus();
  }, [autoFocusInput, activePane]);

  // When a program is left waiting for input, focus the terminal prompt the
  // moment the user lands on the console pane.
  useEffect(() => {
    if (activePane === "console" && runResult?.waitingForInput) {
      inputRef.current?.focus();
    }
  }, [activePane, runResult?.waitingForInput]);

  // ---- Code suggestions (auto code while typing) ----
  const editorWrapRef = useRef<HTMLDivElement>(null);

  const closeSuggestions = useCallback(() => {
    setSuggestions([]);
    setSuggestionIndex(0);
    setSuggestionPos(null);
  }, []);

  const updateSuggestions = useCallback(
    (value: string, caret: number) => {
      const word = wordAtCaret(value, caret);
      if (!word.word) {
        closeSuggestions();
        return;
      }
      const items = getCompletions(language, word.word);
      if (items.length === 0) {
        closeSuggestions();
        return;
      }
      const wrap = editorWrapRef.current;
      const wrapW = wrap?.clientWidth ?? 320;
      const wrapH = wrap?.clientHeight ?? 300;
      const beforeCaret = value.slice(0, caret);
      const lineIdx = beforeCaret.split("\n").length - 1;
      const lastNl = beforeCaret.lastIndexOf("\n");
      const col = caret - lastNl - 1;
      const LINE_H = 22;
      const CHAR_W = 8.2;
      const PAD = 16;
      const top = Math.min(lineIdx * LINE_H + PAD + 2, Math.max(8, wrapH - 180));
      const left = Math.min(col * CHAR_W + PAD, Math.max(8, wrapW - 264));
      suggestionWordRef.current = word;
      setSuggestions(items);
      setSuggestionIndex(0);
      setSuggestionPos({ top, left });
    },
    [language, closeSuggestions]
  );

  const acceptSuggestion = useCallback(
    (index?: number) => {
      const word = suggestionWordRef.current;
      const el = textareaRef.current;
      const idx = index ?? suggestionIndex;
      if (!word || !el || suggestions.length === 0 || idx >= suggestions.length) {
        closeSuggestions();
        return;
      }
      const item = suggestions[idx];
      const caret = el.selectionStart;
      const from = Math.min(word.start, caret);
      const next = code.slice(0, from) + item.insert + code.slice(caret);
      onCodeChange(next);
      closeSuggestions();
      window.requestAnimationFrame(() => {
        const el2 = textareaRef.current;
        if (!el2) return;
        const pos = from + item.insert.length;
        el2.focus();
        el2.selectionStart = el2.selectionEnd = pos;
      });
    },
    [code, suggestions, suggestionIndex, onCodeChange, closeSuggestions]
  );

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onCodeChange(e.target.value);
      updateSuggestions(e.target.value, e.target.selectionStart);
    },
    [onCodeChange, updateSuggestions]
  );

  const formatOnShiftEnter = useCallback(
    (el: HTMLTextAreaElement) => {
      closeSuggestions();
      const caret = el.selectionStart;
      const originalLineIdx = code.slice(0, caret).split("\n").length - 1;
      const withNewline = code.slice(0, caret) + "\n" + code.slice(caret);
      const formatted = formatCode(language, withNewline);
      onCodeChange(formatted);
      const lines = formatted.split("\n");
      const target = Math.min(originalLineIdx + 1, Math.max(0, lines.length - 1));
      let newCaret = 0;
      for (let i = 0; i < target; i++) newCaret += lines[i].length + 1;
      newCaret += lines[target].length;
      window.requestAnimationFrame(() => {
        const el2 = textareaRef.current;
        if (!el2) return;
        el2.focus();
        el2.selectionStart = el2.selectionEnd = newCaret;
      });
    },
    [code, language, onCodeChange]
  );

  // Auto-grow the editor so the whole code is visible without inner scrolling.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const minPx = parseFloat(getComputedStyle(el).minHeight) || 0;
    el.style.height = "auto";
    const target = Math.max(minPx, el.scrollHeight);
    const raf = window.requestAnimationFrame(() => {
      const el2 = textareaRef.current;
      if (!el2) return;
      el2.style.height = `${target}px`;
    });
    return () => window.cancelAnimationFrame(raf);
  }, [code, language, activePane]);

  const [prevLanguage, setPrevLanguage] = useState(language);
  if (prevLanguage !== language) {
    setPrevLanguage(language);
    setRunResult(null);
    setCheckResult(null);
    closeSuggestions();
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
      setActivePane("console");
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
        setJavaConsentAction("run");
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
    setActivePane("console");
    try {
      // Local-first: whenever code can run on this device, it does — even
      // while online. The remote judge is only a fallback or the
      // explicitly-consented Java path.
      let bestLocal: OfflineExecResult | null = null;
      if (isOfflineCapable(language)) {
        bestLocal = await runLocally(code, language, input);
        // Use the on-device result unless the engine itself could not start
        // (not a code error) and the online judge is available as a fallback.
        if (
          bestLocal.engine !== "unsupported" &&
          !(online && bestLocal.startupFailure)
        ) {
          setRunResult(localRunOutcome(bestLocal, language));
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
      } else if (bestLocal && bestLocal.engine !== "unsupported") {
        // Offline and the on-device engine failed: reuse its result instead of
        // re-running the same broken worker.
        setRunResult(localRunOutcome(bestLocal, language));
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
      setActivePane("console");
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
    if (language === "java" && online && !javaCloudConsentGiven()) {
      setJavaConsentAction("check");
      setJavaConsentPending(true);
      return;
    }
    setChecking(true);
    setCheckResult(null);
    setActivePane("console");
    try {
      // Local-first, same as Run: offline-capable languages are usually checked
      // on-device; the online judge is only a fallback (e.g. when the
      // on-device engine itself could not start while online).
      let bestLocal: CheckResult | null = null;
      if (isOfflineCapable(language)) {
        bestLocal = await checkLocalCode(code, language, testCases);
        if (!(online && bestLocal.startupFailure)) {
          setCheckResult(bestLocal);
          onCheckResult?.(bestLocal.passed);
          return;
        }
      }
      if (online) {
        const result = await checkRemoteCode(code, language, testCases);
        setCheckResult(result);
        onCheckResult?.(result.passed);
      } else if (bestLocal) {
        // Offline and the on-device engine failed: reuse its result instead of
        // re-running the same broken worker.
        setCheckResult(bestLocal);
        onCheckResult?.(bestLocal.passed);
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
      {/* Pane tabs */}
      <div className="flex items-center gap-1 border-b border-white/10 bg-[#35294a] px-3 pt-1.5">
        <button
          type="button"
          onClick={() => setActivePane("compiler")}
          className={cn(
            "flex h-9 items-center gap-1.5 border-b-2 px-3 text-xs font-bold transition-colors",
            activePane === "compiler"
              ? "border-primary text-primary"
              : "border-transparent text-primary/60 hover:text-primary/90"
          )}
        >
          <Icon name="FileCode" size={13} /> Compiler
        </button>
        <button
          type="button"
          onClick={() => setActivePane("console")}
          className={cn(
            "flex h-9 items-center gap-1.5 border-b-2 px-3 text-xs font-bold transition-colors",
            activePane === "console"
              ? "border-primary text-primary"
              : "border-transparent text-primary/60 hover:text-primary/90"
          )}
        >
          <Icon name="Terminal" size={13} /> Console
          {running && (
            <span className="ml-0.5 animate-pulse text-[10px] font-bold normal-case text-amber-300/90">
              running…
            </span>
          )}
        </button>
      </div>

      {activePane === "compiler" && (
        <>
      {/* Editor header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#35294a] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon name="Code2" size={15} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary/90">
            {sourceLabel ?? `${LANGUAGES[language].label} Editor`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {testCases && testCases.length > 0 && (
            <Button
              onClick={handleCheck}
              disabled={checking || running}
              variant="outline"
              className="h-9 px-3 text-xs"
            >
              <Icon
                name={checking ? "RotateCw" : "CheckCircle"}
                size={14}
                className={checking ? "animate-spin" : ""}
              />
              {checking ? "Checking..." : "Check"}
            </Button>
          )}
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
          <button
            onClick={handleRun}
            disabled={running}
            aria-label="Run code"
            className={cn(
              "ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-foreground shadow-lg shadow-black/25 transition-all active:scale-95",
              running && "opacity-80"
            )}
          >
            <Icon
              name={running ? "RotateCw" : "Play"}
              size={17}
              className={running ? "animate-spin" : "ml-0.5"}
            />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div ref={editorWrapRef} className="relative">
      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleCodeChange}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        aria-label="Code editor"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "w-full resize-none overflow-hidden bg-transparent p-4 font-mono text-[13.5px] leading-relaxed text-[#fce4ec] outline-none caret-primary transition-[height] duration-150 ease-out placeholder:text-white/30 selection:bg-primary/30",
          minHeightClass
        )}
        placeholder={`// ${LANGUAGES[language].label} code goes here`}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault();
            formatOnShiftEnter(e.currentTarget);
            return;
          }
          if (suggestions.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSuggestionIndex((i) => (i + 1) % suggestions.length);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSuggestionIndex(
                (i) => (i - 1 + suggestions.length) % suggestions.length
              );
              return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              acceptSuggestion();
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              closeSuggestions();
              return;
            }
          }
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleRun();
            return;
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

      {suggestionPos && suggestions.length > 0 && (
        <div
          className="absolute z-20 w-64 max-w-[80vw] overflow-hidden rounded-xl border border-border bg-[#241a33] shadow-2xl shadow-black/50"
          style={{
            top: suggestionPos.top,
            left: suggestionPos.left,
            animation: "fadeInUp 0.15s ease-out",
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {suggestions.map((s, i) => (
            <button
              key={`${s.label}-${i}`}
              type="button"
              onMouseEnter={() => setSuggestionIndex(i)}
              onClick={() => acceptSuggestion(i)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                i === suggestionIndex
                  ? "bg-primary/25 text-primary"
                  : "text-white/80 hover:bg-white/5"
              )}
            >
              <Icon
                name={s.kind === "keyword" ? "Hash" : "Zap"}
                size={12}
                className={s.kind === "keyword" ? "text-primary/60" : "text-amber-300/80"}
              />
              <span className="truncate font-mono font-semibold">{s.label}</span>
              {s.kind === "snippet" && s.detail && (
                <span className="ml-auto truncate text-[10px] text-white/40">
                  {s.detail}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      </div>

      </>
      )}

      {activePane === "console" && (
        <>
      {/* Console */}
      <div className="bg-[#261e33]">
        <div className="flex items-center justify-between gap-3 px-3 pt-2.5">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary/70">
            <Icon name="Terminal" size={12} /> Console
            {running && (
              <span className="animate-pulse normal-case tracking-normal text-amber-300/90">
                running…
              </span>
            )}
          </span>
        </div>
        <RuntimeStatusChips />
        <div className="p-3">
          <div className="rounded-xl border border-white/10 bg-[#0d0a13] p-3">
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
                "max-h-60 overflow-auto whitespace-pre-wrap rounded border border-transparent p-3 font-mono text-[12.5px] leading-relaxed",
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
              className="w-full bg-transparent text-[13px] text-[#fce4ec] outline-none caret-primary"
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
        </>
      )}
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
                  if (javaConsentAction === "check") {
                    handleCheck();
                  } else {
                    handleRun();
                  }
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

function RuntimeStatusChips() {
  const online = useOnline();
  const rt = useRuntimeStatus();

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/45">
      <span className="inline-flex items-center gap-1">
        <Icon
          name={online ? "Wifi" : "WifiOff"}
          size={11}
          className={online ? "text-emerald-400" : "text-amber-300"}
        />
        {online ? "Online" : "Offline"}
      </span>
      <span className="inline-flex items-center gap-1">
        C++
        {rt.cpp === "installed" ? (
          <span className="flex items-center gap-0.5 text-emerald-400">
            <Icon name="Check" size={11} /> local Clang
          </span>
        ) : rt.cpp === "partial" ? (
          <span className="text-sky-300">resume install</span>
        ) : (
          <span className="text-amber-300">light mode</span>
        )}
      </span>
      <span className="inline-flex items-center gap-1">
        Python
        {rt.python === "installed" ? (
          <span className="flex items-center gap-0.5 text-emerald-400">
            <Icon name="Check" size={11} /> local
          </span>
        ) : (
          <span className="text-amber-300">pending</span>
        )}
      </span>
      <span className="inline-flex items-center gap-1">
        Java
        <span className="text-white/40">consent only</span>
      </span>
      {rt.persisted && (
        <span className="inline-flex items-center gap-1">
          <Icon name="Lock" size={11} className="text-primary/70" /> storage persisted
        </span>
      )}
    </div>
  );
}