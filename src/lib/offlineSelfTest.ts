"use client";

import { runOffline, type OfflineExecResult } from "@/lib/offlineExecutor";
import { offlineRuntime } from "@/lib/offlineRuntime/manager";

export interface OfflineEngineSelfCheck {
  installed: boolean;
  verified: boolean;
  run?: OfflineExecResult;
}

export interface OfflineSelfTestResult {
  ok: boolean;
  cpp: OfflineEngineSelfCheck;
  python: OfflineEngineSelfCheck;
  java: OfflineEngineSelfCheck;
  errors: string[];
}

const CPP_PROBE = `#include <iostream>
int main() {
  std::cout << "cpp-offline-ok";
  return 0;
}`;

const PY_PROBE = `print("py-offline-ok")`;

/**
 * End-to-end offline check using the EXACT executor path the editor uses:
 * engine registry → SHA-256 file verification → real worker compile+run.
 * This is what a mobile PWA user runs to confirm "Run" works with no network.
 */
export async function runOfflineSelfTest(): Promise<OfflineSelfTestResult> {
  const errors: string[] = [];
  const result: OfflineSelfTestResult = {
    ok: false,
    cpp: { installed: false, verified: false },
    python: { installed: false, verified: false },
    java: { installed: false, verified: false },
    errors,
  };

  try {
    const cppState = await offlineRuntime.engineState("cpp");
    result.cpp.installed = cppState.installed;
    if (cppState.installed) {
      try {
        result.cpp.verified = (await offlineRuntime.verify("cpp")).ok;
      } catch (e) {
        result.cpp.verified = false;
        errors.push(`C++ verify: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    errors.push(`C++ registry: ${(e as Error).message}`);
  }

  if (result.cpp.installed) {
    try {
      const r = await runOffline(CPP_PROBE, "cpp");
      result.cpp.run = r;
      if (!r.success || !r.output.includes("cpp-offline-ok")) {
        errors.push(`C++ probe: ${r.error ?? r.output}`);
      }
    } catch (e) {
      errors.push(`C++ run: ${(e as Error).message}`);
    }
  }

  try {
    const pyState = await offlineRuntime.engineState("python");
    result.python.installed = pyState.installed;
    if (pyState.installed) {
      try {
        result.python.verified = (await offlineRuntime.verify("python")).ok;
      } catch (e) {
        result.python.verified = false;
        errors.push(`Python verify: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    errors.push(`Python registry: ${(e as Error).message}`);
  }

  if (result.python.installed) {
    try {
      const r = await runOffline(PY_PROBE, "python");
      result.python.run = r;
      if (!r.success || !r.output.includes("py-offline-ok")) {
        errors.push(`Python probe: ${r.error ?? r.output}`);
      }
    } catch (e) {
      errors.push(`Python run: ${(e as Error).message}`);
    }
  }

  // Java is not offline-capable in the browser (no JVM), so there is nothing
  // to verify here: Java runs through the consented online judge or the
  // desktop app's local JDK instead.

  result.ok =
    result.cpp.installed && result.python.installed && errors.length === 0;
  return result;
}