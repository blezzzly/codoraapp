import type { OfflineExecResult } from "@/lib/offlineExecutor";

export interface DesktopBridge {
  isDesktop: boolean;
  runJava: (code: string, input: string) => Promise<OfflineExecResult>;
  runCpp: (code: string, input: string) => Promise<OfflineExecResult>;
}

declare global {
  interface Window {
    codoraDesktop?: DesktopBridge;
  }
}

/** True when running inside the bundled Codora desktop app. */
export function isDesktopApp(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.codoraDesktop !== "undefined" &&
    Boolean(window.codoraDesktop.isDesktop)
  );
}

/** Run C++ entirely on the device using the desktop app's local g++ compiler. */
export async function runCppOnDesktop(
  code: string,
  input: string
): Promise<OfflineExecResult> {
  const bridge = isDesktopApp() ? window.codoraDesktop : undefined;
  if (!bridge || typeof bridge.runCpp !== "function") {
    return {
      output: "",
      success: false,
      error: "Full C++ compilation on-device is only available in the Codora desktop app.",
      engine: "unsupported",
    };
  }
  try {
    return await bridge.runCpp(code, input);
  } catch (err) {
    return {
      output: "",
      success: false,
      error: String((err as Error)?.message ?? err),
      engine: "local",
    };
  }
}

/** Run Java entirely on the device using the desktop app's local JDK. */
export async function runJavaOnDesktop(
  code: string,
  input: string
): Promise<OfflineExecResult> {
  const bridge = isDesktopApp() ? window.codoraDesktop : undefined;
  if (!bridge) {
    return {
      output: "",
      success: false,
      error: "Java execution on-device is only available in the Codora desktop app.",
      engine: "unsupported",
    };
  }
  try {
    return await bridge.runJava(code, input);
  } catch (err) {
    return {
      output: "",
      success: false,
      error: String((err as Error)?.message ?? err),
      engine: "local",
    };
  }
}