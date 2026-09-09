import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

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

function compilerArgs(sourceFile: string, executablePath: string): string[] {
  return [
    "-O2",
    "-std=c++17",
    "-Wall",
    "-Wextra",
    "-static",
    "-D_FORTIFY_SOURCE=2",
    "-fstack-protector-all",
    sourceFile,
    "-o",
    executablePath,
  ];
}

export async function writeSource(code: string): Promise<{ tempDir: string; sourceFile: string; executablePath: string }> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codora-"));
  const sourceFile = path.join(tempDir, "main.cpp");
  const executablePath = path.join(tempDir, "main");
  await fs.promises.writeFile(sourceFile, code, "utf-8");
  return { tempDir, sourceFile, executablePath };
}

export async function compile(sourceFile: string, executablePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("g++", compilerArgs(sourceFile, executablePath), {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        child.kill("SIGKILL");
        reject(new Error("Compilation timeout"));
      }
    }, COMPILE_TIMEOUT_MS);
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (d: string) => {
      stderr += d;
    });
    child.on("error", (err) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        reject(err);
      }
    });
    child.on("close", (code) => {
      if (done) {
        clearTimeout(timer);
        return;
      }
      done = true;
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        const err = new Error(stderr || `g++ exited with code ${code}`) as Error & { stderr: string };
        err.stderr = stderr;
        reject(err);
      }
    });
  });
}

export async function runWithInput(
  executablePath: string,
  cwd: string,
  input: string,
  timeoutMs: number = RUN_TIMEOUT_MS,
  keepStdinOpen: boolean = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(executablePath, [], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd,
    });
    let stdout = "";
    let stderr = "";
    let done = false;

    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        try {
          child.kill("SIGKILL");
        } catch {}
        const err = new Error("Execution timeout") as Error & { partialOutput?: string };
        err.partialOutput = stdout;
        reject(err);
      }
    }, timeoutMs);

    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (d: string) => {
      stdout += d;
      if (stdout.length > MAX_OUTPUT_LENGTH && !done) {
        done = true;
        try {
          child.kill("SIGKILL");
        } catch {}
        reject(new Error("Output too large"));
      }
    });
    child.stderr?.on("data", (d: string) => {
      stderr += d;
      if (stderr.length > MAX_OUTPUT_LENGTH && !done) {
        done = true;
        try {
          child.kill("SIGKILL");
        } catch {}
        reject(new Error("Output too large"));
      }
    });
    child.on("error", (err) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        reject(err);
      }
    });
    child.on("close", (code) => {
      if (done) {
        clearTimeout(timer);
        return;
      }
      done = true;
      clearTimeout(timer);
      const combined = stderr || stdout || "";
      if (code !== 0 && combined.length === 0) {
        reject(new Error(`Process exited with code ${code}`));
      } else {
        resolve(combined);
      }
    });

    try {
      if (!keepStdinOpen && input.length > 0) {
        child.stdin?.write(input);
      }
      if (!keepStdinOpen) {
        child.stdin?.end();
      }
    } catch (err) {
      if (!done) {
        done = true;
        clearTimeout(timer);
        reject(err as Error);
      }
    }
  });
}

export function normalizeOutput(output: string): string {
  return output.replace(/\r\n/g, "\n").trim();
}

export function cleanupDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
}