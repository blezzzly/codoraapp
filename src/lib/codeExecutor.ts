import * as path from "path";

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
const COMPILER_ID = process.env.CODORA_JUDGE_COMPILER || "g132";

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

const sourceCodeCache = new Map<string, string>();

function linesToString(lines: OutputLine[] | undefined): string {
  if (!lines || lines.length === 0) return "";
  return lines.map((l) => l.text).join("");
}

async function requestJudge(
  code: string,
  input: string,
  execute: boolean,
  timeoutMs: number
): Promise<CompileResult> {
  const payload = {
    source: code,
    options: {
      userArguments: "-std=c++17 -O2",
      executeParameters: {
        stdin: input,
        args: [],
      },
      filters: { execute },
    },
  };

  const res = await fetch(`${BASE_URL}/compiler/${COMPILER_ID}/compile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(Math.max(timeoutMs + 5000, 30000)),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Code execution service error (${res.status}): ${text.slice(0, 500)}`);
  }

  return (await res.json()) as CompileResult;
}

export async function writeSource(code: string): Promise<{
  tempDir: string;
  sourceFile: string;
  executablePath: string;
}> {
  const tempDir = `remote-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sourceCodeCache.set(tempDir, code);
  return { tempDir, sourceFile: path.join(tempDir, "main.cpp"), executablePath: path.join(tempDir, "main") };
}

export async function compile(sourceFile: string, executablePath: string): Promise<void> {
  const tempDir = path.dirname(sourceFile);
  const code = sourceCodeCache.get(tempDir);
  if (typeof code !== "string") {
    throw new Error("No source code found for this compilation");
  }

  const result = await requestJudge(code, "", false, COMPILE_TIMEOUT_MS);
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
  const code = sourceCodeCache.get(cwd);
  if (typeof code !== "string") {
    throw new Error("No source code found for this run");
  }

  const result = await requestJudge(code, input, true, timeoutMs);

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

  if (exec && exec.code !== 0 && linesToString(exec.stdout).length === 0 && linesToString(exec.stderr).length === 0) {
    throw new Error(`Process exited with code ${exec.code}`);
  }

  return linesToString(exec?.stdout) || linesToString(exec?.stderr) || "(no output)";
}

export function normalizeOutput(output: string): string {
  return output.replace(/\r\n/g, "\n").trim();
}

export function cleanupDir(dir: string): void {
  sourceCodeCache.delete(dir);
}