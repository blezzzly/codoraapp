import { openDB, type IDBPDatabase } from "idb";
import { OFFLINE_MANIFEST_VERSION } from "@/lib/offlineRuntime/manifest";
import {
  getEngineRecord,
  getPrefs,
  getUsedBytes,
  setEngineRecord,
  setPref,
  setUsedBytes,
} from "@/lib/offlineRuntime/registry";

// Codora offline runtime manager.
//
// The Clang-WASM toolchain (~60MB) is the only thing that is NOT precached in
// the service worker by default. Users "install" it once while online:
//   - files are streamed into Cache Storage (codora-runtimes-v1) with progress,
//   - the service worker serves /vendor/clang/* from that cache afterwards,
//   - the editor switches from the light JSCPP mode to the real Clang engine.
//
// State (versions, storage, install time) lives in IndexedDB via `idb`.

export interface EngineFile {
  url: string;
  size: number;
  label: string;
}

export interface RuntimeState {
  cppClangInstalled: boolean;
  cppEngine: "clang" | "jscpp";
  installedAt?: string;
  storageUsedBytes: number;
  errors?: string[];
}

const DB_NAME = "codora-runtime-state";
const DB_VERSION = 1;
const STATE_KEY = "state";

export const RUNTIME_CACHE = "codora-runtimes-v1";

export const CLANG_VERSION_TEXT = "Clang 8.0.1 (LLVM) via WebAssembly/WASI";
export const CPP_STANDARD_TEXT = "C++17";
export const PYODIDE_VERSION_TEXT = "Pyodide 0.26.4 · Python 3.12";
export const PYTHON_NOTE =
  "The full Python standard library is included (offline from the very first run).";

export const CLANG_TOOLCHAIN: EngineFile[] = [
  { url: "/vendor/clang/clang", size: 31214472, label: "Clang compiler (WASM)" },
  { url: "/vendor/clang/lld", size: 19490094, label: "wasm-ld linker (WASM)" },
  { url: "/vendor/clang/memfs", size: 345442, label: "in-memory filesystem (WASM)" },
  { url: "/vendor/clang/sysroot.tar", size: 9297920, label: "C++ standard headers + libc/libc++" },
  { url: "/vendor/clang/libgcc-shim.o", size: 1384, label: "long-double support shim" },
  { url: "/vendor/clang/shared.js", size: 23973, label: "toolchain driver" },
  { url: "/vendor/clang/runner.js", size: 4991, label: "compiler runner" },
  { url: "/vendor/clang.worker.js", size: 2475, label: "worker bridge" },
];

export const CLANG_TOOLCHAIN_BYTES = CLANG_TOOLCHAIN.reduce((n, f) => n + f.size, 0);

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
      },
    });
  }
  return dbPromise;
}

async function readState(): Promise<RuntimeState> {
  const db = await getDb();
  const stored = (await db.get("meta", STATE_KEY)) as
    | Partial<RuntimeState>
    | undefined;
  return {
    cppClangInstalled: stored?.cppClangInstalled ?? false,
    cppEngine: stored?.cppEngine ?? "jscpp",
    installedAt: stored?.installedAt,
    storageUsedBytes: stored?.storageUsedBytes ?? 0,
    errors: stored?.errors,
  };
}

async function writeState(state: RuntimeState): Promise<void> {
  const db = await getDb();
  await db.put("meta", state, STATE_KEY);
}

export interface InstallProgress {
  doneBytes: number;
  totalBytes: number;
  file: string;
  phase: "downloading" | "builtin" | "done";
}

/**
 * Download the Clang toolchain into Cache Storage with progress.
 * Must be called while online. Returns { ok, error?, canceled? }.
 */
export async function installCppToolchain(
  onProgress?: (p: InstallProgress) => void,
  signal?: AbortSignal
): Promise<{ ok: boolean; error?: string; canceled?: boolean }> {
  const available = typeof caches !== "undefined";
  if (!available) {
    return { ok: false, error: "This browser does not support Cache Storage." };
  }

  const runtimes = await caches.open(RUNTIME_CACHE);
  let doneBytes = 0;
  const totalBytes = CLANG_TOOLCHAIN_BYTES;

  onProgress?.({ doneBytes: 0, totalBytes, file: "Preparing…", phase: "downloading" });

  // Drop stale entries first so a failed/partial install always restarts clean.
  await Promise.all(
    CLANG_TOOLCHAIN.map((f) => runtimes.delete(f.url).catch(() => {}))
  );

  for (const file of CLANG_TOOLCHAIN) {
    if (signal?.aborted) return { ok: false, canceled: true };
    onProgress?.({ doneBytes, totalBytes, file: file.label, phase: "downloading" });

    let res: Response;
    try {
      res = await fetch(file.url, { cache: "no-cache", signal });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      const aborted = signal?.aborted;
      return {
        ok: false,
        canceled: aborted,
        error: aborted
          ? "Download canceled."
          : `Could not download ${file.label}. Check your internet connection and try again. (${(err as Error)?.message})`,
      };
    }

    const reader = (res as Response).body!.getReader();
    const chunks: Uint8Array[] = [];
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        doneBytes += value.length;
        onProgress?.({ doneBytes, totalBytes, file: file.label, phase: "downloading" });
      }
    } catch {
      return {
        ok: false,
        canceled: signal?.aborted,
        error: `Connection dropped while downloading ${file.label}. Tap Download again to retry.`,
      };
    }

    try {
      await runtimes.put(
        file.url,
        new Response(new Blob(chunks as unknown as BlobPart[]), {
          headers: { "Content-Type": "application/octet-stream" },
        })
      );
    } catch (err) {
      return { ok: false, error: `Could not store ${file.label}: ${(err as Error)?.message}` };
    }
  }

  if (signal?.aborted) return { ok: false, canceled: true };

  const state: RuntimeState = {
    cppClangInstalled: true,
    cppEngine: "clang",
    installedAt: new Date().toISOString(),
    storageUsedBytes: totalBytes,
  };
  await writeState(state);
  // Keep the new OfflineRuntimeRegistry in sync (authoritative for the wizard).
  await setEngineRecord({
    id: "cpp",
    manifestVersion: OFFLINE_MANIFEST_VERSION,
    version: CLANG_VERSION_TEXT,
    installed: true,
    filesDone: CLANG_TOOLCHAIN.map((f) => f.url),
    installedAt: Date.now(),
  });
  await setUsedBytes((await getUsedBytes()) + totalBytes);
  const prefs = await getPrefs();
  await setPref({ ...prefs, cppEngine: "clang" });
  onProgress?.({ doneBytes: totalBytes, totalBytes, file: "Done", phase: "done" });
  return { ok: true };
}

export interface VerifyResult {
  installed: boolean;
  totalBytes: number;
  presentBytes: number;
  missing: EngineFile[];
}

/** Check every toolchain file is present in the runtime cache and readable. */
export async function verifyCppToolchain(): Promise<VerifyResult> {
  const runtimes = await caches.open(RUNTIME_CACHE);
  const missing: EngineFile[] = [];
  let presentBytes = 0;
  for (const f of CLANG_TOOLCHAIN) {
    const hit = await runtimes.match(f.url);
    if (!hit || !hit.ok) {
      missing.push(f);
    } else {
      presentBytes += f.size;
    }
  }
  return {
    installed: missing.length === 0,
    totalBytes: CLANG_TOOLCHAIN_BYTES,
    presentBytes,
    missing,
  };
}

/** Remove the Clang toolchain from Cache Storage and reset state. */
export async function clearCppToolchain(): Promise<void> {
  const runtimes = await caches.open(RUNTIME_CACHE);
  await Promise.all(CLANG_TOOLCHAIN.map((f) => runtimes.delete(f.url).catch(() => {})));
  await writeState({ cppClangInstalled: false, cppEngine: "jscpp", storageUsedBytes: 0 });
  await setEngineRecord({
    id: "cpp",
    manifestVersion: OFFLINE_MANIFEST_VERSION,
    version: null,
    installed: false,
    filesDone: [],
    installedAt: null,
  });
  await setUsedBytes(Math.max(0, (await getUsedBytes()) - CLANG_TOOLCHAIN_BYTES));
  const prefs = await getPrefs();
  await setPref({ ...prefs, cppEngine: "jscpp" });
}

/** Current best C++ engine for the installed PWA. */
export async function getCppEngine(): Promise<"clang" | "jscpp"> {
  const regPrefs = await getPrefs();
  if (regPrefs.cppEngine === "clang") return "clang";
  // Legacy engines installed before the registry existed.
  const legacyRecord = await getEngineRecord("cpp");
  if (legacyRecord?.installed) return "clang";
  const state = await readState();
  if (state.cppEngine === "clang") return "clang";
  const verify = await verifyCppToolchainImpl();
  return verify.installed ? "clang" : "jscpp";
}

async function verifyCppToolchainImpl(): Promise<{ installed: boolean }> {
  try {
    const v = await verifyCppToolchain();
    return { installed: v.installed };
  } catch {
    return { installed: false };
  }
}

/** Report storage usage of the runtime cache + whole-site estimate. */
export async function runtimeStorageUsage(): Promise<{
  runtimeBytes: number;
  siteUsage?: number;
  siteQuota?: number;
}> {
  const v = await verifyCppToolchain();
  const navigatorClient = globalThis.navigator as unknown as {
    storage?: { estimate?: () => Promise<{ usage?: number; quota?: number }> };
  };
  let est: { usage?: number; quota?: number } | undefined;
  if (navigatorClient.storage?.estimate) {
    try {
      est = await navigatorClient.storage.estimate();
    } catch {}
  }
  return {
    runtimeBytes: v.presentBytes,
    siteUsage: est?.usage,
    siteQuota: est?.quota,
  };
}

export { readState, writeState };

/**
 * Auto-install used by the editor when a C++ program is run and the Clang
 * toolchain is not available yet. Only one install runs at a time. Progress is
 * broadcast as a `codora:cpp-install-progress` CustomEvent on `window`.
 */
let installInFlight: Promise<{ ok: boolean; canceled?: boolean; error?: string }> | null =
  null;

function broadcastProgress(p: InstallProgress): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("codora:cpp-install-progress", { detail: p }));
}

export function installProgressEventName(): string {
  return "codora:cpp-install-progress";
}

export function autoInstallCppToolchain(): Promise<{
  ok: boolean;
  canceled?: boolean;
  error?: string;
}> {
  if (installInFlight) return installInFlight;
  installInFlight = installCppToolchain((p) => broadcastProgress(p))
    .then((res) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("codora:cpp-install-progress", {
            detail: {
              doneBytes: res.ok ? CLANG_TOOLCHAIN_BYTES : 0,
              totalBytes: CLANG_TOOLCHAIN_BYTES,
              file: res.ok ? "Done" : "Failed",
              phase: "done",
              ok: res.ok,
              error: res.error,
            } as InstallProgress & { ok?: boolean; error?: string },
          })
        );
      }
      return res;
    })
    .finally(() => {
      installInFlight = null;
    });
  return installInFlight;
}

/** True when we can attempt a first C++ run with the whole toolchain. */
export function canAutoInstallCpp(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}