import React, { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Play, Check, Terminal as TerminalIcon } from "lucide-react";

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
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>("> Ready to run...");
  const [waitingForInput, setWaitingForInput] = useState<boolean>(false);
  const [consoleInput, setConsoleInput] = useState<string>("");
  const [explanation, setExplanation] = useState<{ hint: string; why: string; tryChecking: string; line?: number } | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const consoleInputRef = useRef<HTMLInputElement>(null);
  const waitingRef = useRef("");
  const { show } = useToast();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [code]);

  const handleCodeChange = (value: string) => {
    setCode(value);
    onCodeChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = code.substring(0, start) + "  " + code.substring(end);
      setCode(newValue);
      onCodeChange(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleRun = useCallback(async () => {
    if (!code || code.trim().length === 0) {
      setOutput("Error: No code to run");
      return;
    }

    setWaitingForInput(false);
    setConsoleInput("");
    setIsRunning(true);
    setOutput("Compiling...\n");

    try {
      const response = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      const result = await response.json();

      if (result.waitingForInput) {
        const partial = typeof result.output === "string" ? result.output : "";
        waitingRef.current = partial.endsWith("\n") ? partial : `${partial}\n`;
        setOutput(waitingRef.current || "Program is waiting for input.\n");
        setWaitingForInput(true);
        setTimeout(() => consoleInputRef.current?.focus(), 50);
        setIsRunning(false);
        return;
      }

      setOutput(result.output || "(no output)");
      setExplanation(result.explanation || null);
      onRun();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setOutput(
        typeof navigator !== "undefined" && !navigator.onLine
          ? "You're offline. Connect to the internet to run your code."
          : `Error: ${message || "Failed to run program"}`
      );
    } finally {
      setIsRunning(false);
    }
  }, [code, language, onRun]);

  const submitConsoleInput = useCallback(async () => {
    const value = consoleInput.trim();
    setWaitingForInput(false);
    setConsoleInput("");
    setIsRunning(true);
    setOutput(`${waitingRef.current}${value ? `> ${value}\n` : ""}Running...\n`);

    try {
      const response = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, input: value }),
      });

      const result = await response.json();
      if (result.waitingForInput) {
        const partial = typeof result.output === "string" ? result.output : "";
        waitingRef.current = partial.endsWith("\n") ? partial : `${partial}\n`;
        setOutput(waitingRef.current);
        setWaitingForInput(true);
        setTimeout(() => consoleInputRef.current?.focus(), 50);
        return;
      }
      setOutput(result.output || "(no output)");
      setExplanation(result.explanation || null);
      onRun();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setOutput(
        typeof navigator !== "undefined" && !navigator.onLine
          ? "You're offline. Connect to the internet to run your code."
          : `Error: ${message || "Failed to run program"}`
      );
    } finally {
      setIsRunning(false);
    }
  }, [code, language, onRun, consoleInput]);

  const handleCheck = useCallback(async () => {
    if (!testCases || testCases.length === 0) {
      show({
        title: "No Tests Available",
        description: "Run the program to see output.",
      });
      return;
    }

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
      setOutput(
        typeof navigator !== "undefined" && !navigator.onLine
          ? "You're offline. Connect to the internet to run your code."
          : `Error: ${message || "Failed to run tests"}`
      );
      onCheck(null);
    } finally {
      setIsChecking(false);
    }
  }, [code, testCases, language, onCheck, show]);

  const lineCount = code.split("\n").length;

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

      <div className="flex h-[280px] sm:h-[350px] w-full bg-[#1e1e2e]">
        <div className="flex-shrink-0 bg-[#181825] text-gray-600 text-right px-2 py-3 font-mono text-xs leading-[1.5] select-none border-r border-[#313244] overflow-hidden">
          {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
            <div key={i} className="h-[1.5em]">{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 bg-[#1e1e2e] text-[#cdd6f4] font-mono text-sm leading-[1.5] p-3 resize-none focus:outline-none placeholder-gray-600 overflow-auto"
          placeholder="Type your C++ code here..."
        />
      </div>

      <div className="bg-[#181825] text-gray-300 px-4 py-3 font-mono text-xs min-h-[100px] max-h-[160px] overflow-auto border-t border-[#313244]">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#313244]">
          <TerminalIcon className="w-3 h-3 text-gray-500" />
          <span className="text-gray-500 uppercase tracking-wider text-[10px]">Output</span>
          {isRunning && (
            <div className="ml-auto flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500 text-[10px]">Running...</span>
            </div>
          )}
          {waitingForInput && !isRunning && (
            <div className="ml-auto flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 text-[10px]">Waiting for input</span>
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
        {waitingForInput && !isRunning && (
          <div className="mt-2 pt-2 border-t border-[#313244] flex items-center gap-2">
            <span className="text-emerald-400 font-bold">{'>'}</span>
            <input
              ref={consoleInputRef}
              value={consoleInput}
              onChange={(e) => setConsoleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitConsoleInput();
                }
              }}
              placeholder="Type your input here, then Enter..."
              className="flex-1 bg-[#11111b] text-gray-200 font-mono text-xs rounded-lg px-2 py-1.5 border border-[#313244] focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={submitConsoleInput}
              disabled={isRunning || isChecking}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        )}
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