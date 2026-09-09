import React, { useState, useCallback, useEffect, useRef } from "react";
import { loader } from "@monaco-editor/react";
import { useToast } from "@/hooks/use-toast";
import { Play, Check, Terminal as TerminalIcon } from "lucide-react";

let loaderConfigured = false;
function configureLoader() {
  if (loaderConfigured) return;
  try {
    loader.config({
      paths: {
        vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs",
      },
    });
    loaderConfigured = true;
  } catch {}
}

interface TestResult {
  passed: boolean;
  index: number;
  expectedOutput?: string;
  actualOutput?: string;
}

interface EditorProps {
  initialCode: string;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  onCheck: (results: TestResult[] | null) => void;
  problemId: string;
  testCases?: { input: string; expectedOutput: string }[];
  language?: string;
}

export function Editor({
  initialCode,
  onCodeChange,
  onRun,
  onCheck,
  problemId,
  testCases,
  language = "cpp",
}: EditorProps) {
  const [output, setOutput] = useState<string>("> Ready to run...");
  const [stdInput, setStdInput] = useState<string>("");
  const [explanation, setExplanation] = useState<{ hint: string; why: string; tryChecking: string; line?: number } | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [activeMonaco, setActiveMonaco] = useState<any>(null);
  const editorDivRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const onCodeChangeRef = useRef(onCodeChange);
  const { show } = useToast();

  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  useEffect(() => {
    configureLoader();
    let cancelled = false;
    let cancelInit: (() => void) | null = null;

    const initPromise = loader.init();
    initPromise
      .then((m) => {
        if (cancelled) return;
        setActiveMonaco(m);
      })
      .catch((err) => {
        if (err?.type === "cancelation" || err?.msg === "operation is manually canceled") {
          return;
        }
        if (!cancelled) {
          console.warn("Monaco initialization failed:", err);
        }
      });

    cancelInit = () => {
      cancelled = true;
      try {
        (initPromise as any).cancel?.();
      } catch {}
    };

    return () => {
      cancelInit?.();
    };
  }, []);

  useEffect(() => {
    if (!activeMonaco || !editorDivRef.current || editorRef.current) return;

    let editor: any = null;
    try {
      editor = activeMonaco.editor.create(editorDivRef.current, {
        value: initialCode,
        language,
        theme: "vs-dark",
        automaticLayout: true,
        fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
        fontSize: 14,
        scrollBeyondLastLine: false,
        readOnly: false,
        minimap: { enabled: false },
        lineNumbers: "on",
        renderLineHighlight: "gutter",
        contextmenu: false,
        padding: { top: 12, bottom: 12 },
        fontLigatures: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
      });
    } catch (err) {
      console.warn("Monaco editor create failed:", err);
      return;
    }

    const sub = editor.onDidChangeModelContent(() => {
      const code = editor.getValue() || "";
      onCodeChangeRef.current(code);
    });

    editorRef.current = editor;

    return () => {
      try {
        sub.dispose();
      } catch {}
      try {
        editor.dispose();
      } catch {}
      if (editorRef.current === editor) {
        editorRef.current = null;
      }
    };
  }, [activeMonaco, language]);

  const handleRun = useCallback(async () => {
    const code = editorRef.current?.getValue?.() || initialCode;
    if (!code || code.trim().length === 0) {
      setOutput("Error: No code to run");
      return;
    }

    setIsRunning(true);
    setOutput("Compiling...\n");

    try {
      const response = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, input: stdInput }),
      });

      const result = await response.json();
      setOutput(result.output || "(no output)");
      setExplanation(result.explanation || null);
      onRun();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setOutput(`Error: ${message || "Failed to run program"}`);
    } finally {
      setIsRunning(false);
    }
  }, [initialCode, language, onRun, stdInput]);

  const handleCheck = useCallback(async () => {
    if (!testCases || testCases.length === 0) {
      show({
        title: "No Tests Available",
        description: "Run the program to see output.",
      });
      return;
    }

    const code = editorRef.current?.getValue?.() || initialCode;
    if (!code || code.trim().length === 0) {
      setOutput("Error: No code to test");
      return;
    }

    setIsChecking(true);
    setTestResults([]);
    setOutput("Compiling...\nRunning tests...\n");

    try {
      const response = await fetch("/api/check-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, testCases, language }),
      });

      const result = await response.json();

      if (!result.success) {
        setOutput(`Compilation error:\n${result.compileError || "Unknown error"}`);
        setExplanation(result.explanation || null);
        onCheck(null);
        setIsChecking(false);
        return;
      }

      const results: TestResult[] = (result.results || []).map(
        (r: { passed: boolean; expectedOutput?: string; actualOutput?: string }, i: number) => ({
          passed: r.passed,
          index: i,
          expectedOutput: r.expectedOutput,
          actualOutput: r.actualOutput,
        })
      );

      setTestResults(results);

      const passedCount = results.filter((r) => r.passed).length;
      let outputText =
        results.length === 0
          ? "No tests were run."
          : `Ran ${results.length} tests.\n`;

      results.forEach((r) => {
        outputText += `\nTest ${r.index + 1}: ${r.passed ? "✓ PASS" : "✗ FAIL"}`;
        if (!r.passed && r.expectedOutput !== undefined) {
          outputText += `\n  expected: ${JSON.stringify(r.expectedOutput)}`;
          outputText += `\n  got:      ${JSON.stringify(r.actualOutput ?? "")}`;
        }
      });

      outputText += `\n\n${passedCount}/${results.length} passed.`;
      setOutput(outputText);
      setExplanation(null);

      onCheck(results);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setOutput(`Error: ${message || "Failed to run tests"}`);
      onCheck(null);
    } finally {
      setIsChecking(false);
    }
  }, [initialCode, testCases, language, onCheck, show]);

  return (
    <div className="editor-container">
      <div className="bg-[#181825] border-b border-[#313244] px-3 py-2 flex items-center gap-2">
        <button
          onClick={handleRun}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            isRunning
              ? "bg-gray-700 text-gray-400"
              : "bg-emerald-600 text-white hover:bg-emerald-500"
          }`}
          disabled={isRunning || isChecking}
        >
          <Play className="w-3 h-3 fill-current" />
          Run
        </button>
        <button
          onClick={handleCheck}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            isRunning || isChecking || !testCases || testCases.length === 0
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-amber-500 text-white hover:bg-amber-400"
          }`}
          disabled={isRunning || isChecking || !testCases || testCases.length === 0}
        >
          <Check className="w-3 h-3" />
          Submit
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            {language.toUpperCase()}
          </span>
        </div>
      </div>

      <div ref={editorDivRef} className="h-[280px] sm:h-[350px] w-full" />

      <div className="bg-[#181825] border-t border-[#313244] px-4 py-2">
        <div className="flex items-center gap-2 mb-1">
          <TerminalIcon className="w-3 h-3 text-gray-500" />
          <span className="text-gray-500 uppercase tracking-wider text-[10px]">Standard Input</span>
        </div>
        <textarea
          value={stdInput}
          onChange={(e) => setStdInput(e.target.value)}
          placeholder="Type the input your program reads here (used by cin)..."
          rows={2}
          className="w-full bg-[#11111b] text-gray-300 font-mono text-xs rounded-lg p-2 border border-[#313244] focus:outline-none focus:border-gray-500 resize-y"
        />
      </div>

      <div className="bg-[#181825] text-gray-300 px-4 py-3 font-mono text-xs min-h-[100px] max-h-[140px] overflow-auto border-t border-[#313244]">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#313244]">
          <TerminalIcon className="w-3 h-3 text-gray-500" />
          <span className="text-gray-500 uppercase tracking-wider text-[10px]">Output</span>
          {isRunning && (
            <div className="ml-auto flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500 text-[10px]">Running...</span>
            </div>
          )}
        </div>
        {explanation && (
          <div className="mb-3 p-3 rounded-lg bg-rose-950/60 border border-rose-500/30">
            <p className="text-rose-300 text-[11px] font-bold mb-1.5 uppercase tracking-wider">
              {explanation.line ? `Heads up (line ${explanation.line})` : "What happened?"}
            </p>
            <p className="text-gray-200 text-xs mb-1">{explanation.hint}</p>
            <p className="text-gray-400 text-[11px] mb-1"><span className="text-gray-300 font-semibold">Why? </span>{explanation.why}</p>
            <p className="text-gray-400 text-[11px]"><span className="text-gray-300 font-semibold">Try checking: </span>{explanation.tryChecking}</p>
          </div>
        )}
        <pre className="whitespace-pre-wrap">{output}</pre>
        {testResults.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#313244]">
            <p className="text-gray-500 mb-1 text-[10px] uppercase tracking-wider">Tests</p>
            {testResults.map((r, i) => (
              <p key={i} className={r.passed ? "text-emerald-400" : "text-rose-400"}>
                {r.passed ? "✓" : "✗"} Test {i + 1}: {r.passed ? "PASS" : "FAIL"}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
