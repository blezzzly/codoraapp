import * as path from "path";
import { getLanguageConfig, LanguageId } from "@/lib/languages";

export const COMPILE_TIMEOUT_MS = 10000;
export const RUN_TIMEOUT_MS = 5000;
export const INPUT_PROBE_TIMEOUT_MS = 4000;
export const MAX_OUTPUT_LENGTH = 1024 * 1024;

export interface TestCaseResult {
  index: number;
  passed: boolean;
  expectedOutput: string;
  actualOutput: string;
}

const BASE_URL = process.env.CODORA_JUDGE_URL || "https://godbolt.org/api";

interface OutputLine {
  text: string;
}

interface ExecResult {
  code: number;
  didExecute: boolean;
  timedOut: boolean;
  stdout: OutputLine[];
  stderr: OutputLine[];
}

interface CompileResult {
  code: number;
  stdout: OutputLine[];
  stderr: OutputLine[];
  execResult?: ExecResult;
}

interface SourceEntry {
  code: string;
  language: LanguageId;
}

const sourceCache = new Map<string, SourceEntry>();

function linesToString(lines: OutputLine[] | undefined): string {
  if (!lines || lines.length === 0) return "";
  return lines.map((l) => l.text).join("");
}

function normalizeJavaSource(code: string): string {
  return code.replace(/\bpublic\s+class\b/g, "class");
}

function normalizeSourceForCompiler(code: string, language: LanguageId): string {
  if (language === "java") {
    return normalizeJavaSource(code);
  }
  return code;
}

const COMMUNICATION_TIMEOUT_MS = 30000;

async function requestJudge(
  source: string,
  compilerId: string,
  userArguments: string,
  input: string,
  execute: boolean
): Promise<CompileResult> {
  const payload = {
    source,
    options: {
      userArguments,
      executeParameters: {
        stdin: input,
        args: [],
      },
      filters: { execute },
    },
  };

  const res = await fetch(`${BASE_URL}/compiler/${compilerId}/compile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(COMMUNICATION_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Code execution service error (${res.status}): ${text.slice(0, 500)}`
    );
  }

  return (await res.json()) as CompileResult;
}

export async function writeSource(code: string, language: LanguageId = "cpp"): Promise<{
  tempDir: string;
  sourceFile: string;
  executablePath: string;
}> {
  const tempDir = `remote-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const config = getLanguageConfig(language);
  const ext: Record<LanguageId, string> = {
    cpp: "cpp",
    java: "java",
    python: "py",
  };
  sourceCache.set(tempDir, { code, language });
  return {
    tempDir,
    sourceFile: path.join(tempDir, `main.${ext[language as LanguageId] || ext.cpp}`),
    executablePath: path.join(tempDir, "main"),
  };
}

export async function compile(sourceFile: string, executablePath: string): Promise<void> {
  const tempDir = path.dirname(sourceFile);
  const entry = sourceCache.get(tempDir);
  if (!entry) {
    throw new Error("No source code found for this compilation");
  }

  const config = getLanguageConfig(entry.language);
  const source = normalizeSourceForCompiler(entry.code, entry.language);
  const result = await requestJudge(
    source,
    config.compilerId,
    config.userArguments,
    "",
    false
  );

  if (result.code !== 0) {
    const stderr = linesToString(result.stderr) || "Compilation failed";
    const err = new Error(stderr) as Error & { stderr: string };
    err.stderr = stderr;
    throw err;
  }
}

export async function runWithInput(
  executablePath: string,
  cwd: string,
  input: string,
  timeoutMs: number = RUN_TIMEOUT_MS,
  keepStdinOpen: boolean = false
): Promise<string> {
  const entry = sourceCache.get(cwd);
  if (!entry) {
    throw new Error("No source code found for this run");
  }

  const config = getLanguageConfig(entry.language);
  const source = normalizeSourceForCompiler(entry.code, entry.language);
  const result = await requestJudge(
    source,
    config.compilerId,
    config.userArguments,
    input,
    true
  );

  if (result.code !== 0) {
    const stderr = linesToString(result.stderr) || "Compilation failed";
    const err = new Error(stderr) as Error & { stderr: string };
    err.stderr = stderr;
    throw err;
  }

  const exec = result.execResult;
  if (exec?.timedOut) {
    const err = new Error("Execution timeout") as Error & { partialOutput?: string };
    err.partialOutput = linesToString(exec.stdout);
    throw err;
  }

  if (
    exec &&
    exec.code !== 0 &&
    linesToString(exec.stdout).length === 0 &&
    linesToString(exec.stderr).length === 0
  ) {
    throw new Error(`Process exited with code ${exec.code}`);
  }

  return (
    linesToString(exec?.stdout) ||
    linesToString(exec?.stderr) ||
    "(no output)"
  );
}

export function normalizeOutput(output: string): string {
  return output.replace(/\r\n/g, "\n").trim();
}

export function cleanupDir(dir: string): void {
  sourceCache.delete(dir);
}