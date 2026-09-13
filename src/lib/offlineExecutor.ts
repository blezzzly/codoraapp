import type { LanguageId } from "@/lib/languages";
import { getCppEngine } from "@/lib/runtimeManager";

export type OfflineEngine =
  | "local"
  | "unsupported"
  | "clang-wasm"
  | "jscpp"
  | "pyodide";

export interface OfflineExecResult {
  output: string;
  success: boolean;
  error?: string;
  engine: OfflineEngine;
}

const CPP_JSCPP_WORKER_URL = "/vendor/jscpp/JSCPP.es5.min.js";
const CPP_CLANG_WORKER_URL = "/vendor/clang.worker.js";
const PYTHON_WORKER_URL = "/vendor/pyodide.worker.js";

// Last known C++ engine (set by the runtime manager; refreshed lazily here).
let cppEngineCache: "clang" | "jscpp" | null = null;

/** Tell the executor which on-device C++ engine to prefer. */
export function setCppEngine(engine: "clang" | "jscpp" | null): void {
  cppEngineCache = engine;
}

export function isOfflineCapable(language: string): boolean {
  return language === "cpp" || language === "python";
}

function cppWorkerUrl(): string {
  return cppEngineCache === "clang" ? CPP_CLANG_WORKER_URL : CPP_JSCPP_WORKER_URL;
}

export function getOfflineWorkerUrl(language: string): string | null {
  if (language === "cpp") return cppWorkerUrl();
  if (language === "python") return PYTHON_WORKER_URL;
  return null;
}

const workers = new Map<string, Worker>();
const pendingForWorker = new Map<Worker, (() => void)[]>();
let sequence = 0;

function getWorker(url: string): Worker {
  let worker = workers.get(url);
  if (!worker) {
    worker = new Worker(url);
    const w = worker;
    (w as Worker & { __codoraUrl?: string }).__codoraUrl = url;
    workers.set(url, w);
    pendingForWorker.set(w, []);
    w.onerror = () => {
      const fail = pendingForWorker.get(w);
      if (fail) {
        pendingForWorker.set(w, []);
        fail.forEach((reject) => reject());
      }
      workers.delete(url);
      try {
        w.terminate();
      } catch {
        /* ignore */
      }
    };
  }
  return worker;
}

const JSCPP_TIMEOUT_MS = 20000;
const PYTHON_TIMEOUT_MS = 60000;
const CPP_CLANG_TIMEOUT_MS = 120000;

function runInWorker(
  worker: Worker,
  code: string,
  input: string,
  timeoutMs: number
): Promise<OfflineExecResult> {
  return new Promise((resolve) => {
    const id = ++sequence;
    let output = "";
    let settled = false;
    let timedOut = false;

    const cleanup = () => {
      settled = true;
      clearTimeout(timer);
      worker.removeEventListener("message", onMessage);
      const pending = pendingForWorker.get(worker);
      if (pending) {
        const idx = pending.indexOf(handlePending);
        if (idx >= 0) pending.splice(idx, 1);
      }
      // An infinite loop scans forever inside the worker, so the stalled
      // instance is killed and replaced on the next run.
      if (timedOut) {
        const url = (worker as Worker & { __codoraUrl?: string }).__codoraUrl;
        if (url) workers.delete(url);
        try {
          worker.terminate();
        } catch {
          /* ignore */
        }
      }
    };

    const fail = (error: string, isTimeout = false) => {
      if (settled) return;
      timedOut = isTimeout;
      cleanup();
      resolve({ output, success: false, error, engine: "local" });
    };

    const finish = (result: OfflineExecResult) => {
      if (settled) return;
      cleanup();
      resolve(result);
    };

    const timer = setTimeout(() => {
      fail("Execution timed out.", true);
    }, timeoutMs);

    const handlePending = () => {
      fail(
        "The offline code engine could not start. Please reload the page and try again."
      );
    };

    const pending = pendingForWorker.get(worker);
    if (pending) pending.push(handlePending);

    const onMessage = (event: MessageEvent) => {
      const msg = event.data ?? {};
      if (msg.type === "stdio.write") {
        output += String(msg.data ?? "");
        return;
      }
      if (msg.id !== id) return;
      if (msg.err === 0) {
        finish({
          output: msg.output ?? output,
          success: true,
          engine: "local",
        });
      } else if (msg.err != null) {
        finish({
          output: msg.output ?? output,
          success: false,
          error: String(msg.msg ?? "Unknown execution error"),
          engine: "local",
        });
      }
    };

    worker.addEventListener("message", onMessage);
    worker.postMessage([id, "run", code, input ?? ""]);
  });
}

function engineForUrl(url: string): OfflineEngine {
  if (url === CPP_CLANG_WORKER_URL) return "clang-wasm";
  if (url === PYTHON_WORKER_URL) return "pyodide";
  return "jscpp";
}

/**
 * Execute source code entirely in the browser. Used when offline (or when the
 * remote judge is unreachable) for languages that have a local runtime.
 */
export async function runOffline(
  code: string,
  language: LanguageId | string,
  input?: string
): Promise<OfflineExecResult> {
  // C++ engine depends on whether the Clang toolchain was installed.
  if (language === "cpp" && cppEngineCache === null) {
    try {
      cppEngineCache = await getCppEngine();
    } catch {
      cppEngineCache = "jscpp";
    }
  }

  const url = getOfflineWorkerUrl(language);
  if (!url) {
    return {
      output: "",
      success: false,
      error: `${language} execution is not available offline.`,
      engine: "unsupported",
    };
  }

  const engine = engineForUrl(url);
  try {
    const worker = getWorker(url);
    const timeout =
      language === "python"
        ? PYTHON_TIMEOUT_MS
        : engine === "clang-wasm"
          ? CPP_CLANG_TIMEOUT_MS
          : JSCPP_TIMEOUT_MS;
    const result = await runInWorker(worker, code, input ?? "", timeout);
    // JSCPP is stricter than g++ about `return 0;`. g++ only warns and still
    // exits 0, so a missing return is not a real failure when we got output.
    if (
      engine === "jscpp" &&
      language === "cpp" &&
      !result.success &&
      result.output.trim() !== "" &&
      /you must return a value/i.test(result.error ?? "")
    ) {
      return { output: result.output, success: true, engine: "jscpp" };
    }
    return { ...result, engine };
  } catch (err) {
    return {
      output: "",
      success: false,
      error: String((err as Error)?.message ?? err),
      engine,
    };
  }
}

/** Mirrors the server-side normalizeOutput so offline checks match exactly. */
export function normalizeOutputOffline(output: string): string {
  return output.replace(/\r\n/g, "\n").trim();
}