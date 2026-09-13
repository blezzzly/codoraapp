import { isDesktopApp } from "@/lib/desktop";
import { isOfflineCapable } from "@/lib/offlineExecutor";
import { CLANG_VERSION_TEXT, CPP_STANDARD_TEXT, PYODIDE_VERSION_TEXT } from "@/lib/runtimeManager";

/**
 * ExecutionBackend: where code is actually compiled/run on this device.
 *
 * BrowserOfflineBackend — the installed PWA / plain browser. Everything runs in
 * Web Workers with WebAssembly runtimes fetched from the local service-worker
 * cache. No source code ever leaves the device.
 *   C++    -> Clang 8.0.1 compiled to WebAssembly (WASI) + wasm-ld + in-memory FS
 *             (falls back to the JSCPP interpreter, clearly labelled, until the
 *             Clang toolchain is installed in Settings).
 *   Python -> Pyodide 0.26.4 (CPython 3.12.1) compiled to WebAssembly.
 *   Java   -> No free JVM can run in a browser sandbox. On the PWA, Java only
 *             runs through an explicitly-consented online judge or on the
 *             desktop app. See javaOfflineNote.
 *
 * DesktopNativeBackend — the Electron app. Uses real native toolchains that are
 * better maintained than the WASM ones.
 *   C++    -> system g++ (falls back to the Clang-WASM path only if missing).
 *   Python -> Pyodide (same as browser, user programs are the target).
 *   Java   -> bundled Temurin JRE + Eclipse ecj compiler, or an installed JDK.
 */
export type ExecutionBackendKind = "browser" | "desktop";

export interface ExecutionBackend {
  kind: ExecutionBackendKind;
  cpp: "clang-wasm" | "g++" | "jscpp";
  python: "pyodide";
  java: "none" | "bundled-jre";
  cppCompiler: string;
  cppStandard: string;
  pythonRuntime: string;
  javaNote: string;
  /** Languages whose source is always compiled locally only. */
  localOnly: string[];
}

export const javaOfflineNote =
  "Java cannot run inside a browser: no free JVM exists that runs in the " +
  "browser sandbox. On this device Java uses the online judge only after you " +
  "explicitly allow it, or you can install the Codora desktop app which ships " +
  "an offline Java runtime.";

export function currentBackend(): ExecutionBackend {
  if (isDesktopApp()) {
    return {
      kind: "desktop",
      cpp: "g++",
      python: "pyodide",
      java: "bundled-jre",
      cppCompiler: "g++ (system)",
      cppStandard: "C++17",
      pythonRuntime: PYODIDE_VERSION_TEXT,
      javaNote:
        "Runs offline with the bundled Temurin JRE + Eclipse ecj compiler, or a system JDK.",
      localOnly: ["cpp", "python", "java"],
    };
  }
  return {
    kind: "browser",
    cpp: "clang-wasm",
    python: "pyodide",
    java: "none",
    cppCompiler: CLANG_VERSION_TEXT,
    cppStandard: CPP_STANDARD_TEXT,
    pythonRuntime: PYODIDE_VERSION_TEXT,
    javaNote: javaOfflineNote,
    localOnly: ["cpp", "python"].filter((l) => isOfflineCapable(l)),
  };
}