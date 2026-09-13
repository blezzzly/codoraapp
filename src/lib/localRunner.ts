import {
  isOfflineCapable,
  runOffline,
  type OfflineExecResult,
} from "@/lib/offlineExecutor";
import { isDesktopApp, runJavaOnDesktop } from "@/lib/desktop";

/** True when this language can run entirely on the device right now. */
export function canRunLocally(language: string): boolean {
  return isOfflineCapable(language) || (language === "java" && isDesktopApp());
}

/**
 * Run code with the on-device engine regardless of network state.
 * C++ and Python use the bundled in-browser runtimes (JSCPP / Pyodide);
 * Java uses the desktop app's local JDK when available.
 */
export async function runLocally(
  code: string,
  language: string,
  input?: string
): Promise<OfflineExecResult> {
  if (isOfflineCapable(language)) {
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