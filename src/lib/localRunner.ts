import {
  isOfflineCapable,
  runOffline,
  type OfflineExecResult,
} from "@/lib/offlineExecutor";
import { isDesktopApp, runCppOnDesktop, runJavaOnDesktop } from "@/lib/desktop";

/** True when this language can run entirely on the device right now. */
export function canRunLocally(language: string): boolean {
  return isOfflineCapable(language) || (language === "java" && isDesktopApp());
}

/**
 * Run code with the on-device engine regardless of network state.
 * C++ tries the desktop app's full g++ compiler first, then falls back to the
 * bundled JSCPP interpreter. Python uses the bundled Pyodide runtime; Java
 * uses the desktop app's local JDK (bundled or installed).
 */
export async function runLocally(
  code: string,
  language: string,
  input?: string
): Promise<OfflineExecResult> {
  if (language === "cpp") {
    if (isDesktopApp()) {
      const res = await runCppOnDesktop(code, input ?? "");
      if (res.engine !== "unsupported") return res;
    }
    return runOffline(code, language, input ?? "");
  }
  if (language === "python") {
    return runOffline(code, language, input ?? "");
  }
  if (language === "java") {
    return runJavaOnDesktop(code, input ?? "");
  }
  return {
    output: "",
    success: false,
    error: `${language} execution is not available on this device.`,
    engine: "unsupported",
  };
}