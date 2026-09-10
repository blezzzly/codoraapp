import * as path from "path";
import * as os from "os";
import { isSupportedLanguage } from "@/lib/languages";

export const MAX_CODE_LENGTH = 10000;
export const MAX_OUTPUT_LENGTH = 1024 * 1024;

const CPP_DANGEROUS_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /system\s*\(/, reason: "system() calls are not allowed" },
  { pattern: /popen\s*\(/, reason: "popen() calls are not allowed" },
  { pattern: /\bexec(ve|lp|cl)?\s*\(/, reason: "process execution is not allowed" },
  { pattern: /\bfork\s*\(/, reason: "fork() is not allowed" },
  { pattern: /\bfopen\s*\(/, reason: "file access is not allowed" },
  { pattern: /\bofstream\b/, reason: "file writes are not allowed" },
  { pattern: /\bifstream\b/, reason: "file reads are not allowed" },
  { pattern: /\bfstream\b/, reason: "file I/O is not allowed" },
  { pattern: /include\s*<\s*fstream\s*>/, reason: "fstream header is not allowed" },
  { pattern: /include\s*<\s*unistd\.h\s*>/, reason: "unistd.h header is not allowed" },
  { pattern: /include\s*<\s*sys\//, reason: "system headers are not allowed" },
  { pattern: /include\s*<\s*cstdlib\s*>/, reason: "cstdlib header is not allowed" },
  { pattern: /include\s*<\s*windows\.h\s*>/, reason: "windows.h header is not allowed" },
  { pattern: /include\s*<\s*thread\s*>/, reason: "threads are not allowed" },
  { pattern: /include\s*<\s*csignal\s*>/, reason: "signals are not allowed" },
  { pattern: /\bgetenv\s*\(/, reason: "environment access is not allowed" },
  { pattern: /\bsetenv\s*\(/, reason: "environment access is not allowed" },
  { pattern: /__asm__/, reason: "inline assembly is not allowed" },
  { pattern: /asm\s*\(/, reason: "inline assembly is not allowed" },
  { pattern: /\\[A-Za-z]:\\\\/, reason: "absolute paths are not allowed" },
  { pattern: /\/etc\//, reason: "system paths are not allowed" },
  { pattern: /\/bin\//, reason: "system paths are not allowed" },
  { pattern: /\/home\//, reason: "absolute paths are not allowed" },
  { pattern: /\bruid\s*\(/, reason: "user ID access is not allowed" },
  { pattern: /\bsetuid\b/, reason: "privilege escalation is not allowed" },
  { pattern: /\bsetgid\b/, reason: "privilege escalation is not allowed" },
  { pattern: /\bremove\s*\(/, reason: "file deletion is not allowed" },
  { pattern: /\brename\s*\(/, reason: "file operations are not allowed" },
];

const JAVA_DANGEROUS_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /Runtime\s*\.\s*getRuntime\s*\(/, reason: "runtime execution is not allowed" },
  { pattern: /\.\s*exec\s*\(/, reason: "process execution is not allowed" },
  { pattern: /ProcessBuilder\s*\(/, reason: "process execution is not allowed" },
  { pattern: /\bProcess\b/, reason: "process execution is not allowed" },
  { pattern: /java\.io\s*\.|import\s+java\s*\.\s*io/, reason: "file I/O is not allowed" },
  { pattern: /\bFile(Reader|Writer|InputStream|OutputStream)?\b/, reason: "file access is not allowed" },
  { pattern: /\bFiles\./, reason: "file access is not allowed" },
  { pattern: /\bSocket\b/, reason: "network access is not allowed" },
  { pattern: /java\.net\s*\.|import\s+java\s*\.\s*net/, reason: "network access is not allowed" },
  { pattern: /System\s*\.\s*(setProperty|getenv|exit)\s*\(/, reason: "system access is not allowed" },
  { pattern: /ClassLoader|System\.load/, reason: "native code loading is not allowed" },
  { pattern: /\\[A-Za-z]:\\\\/, reason: "absolute paths are not allowed" },
];

const PYTHON_DANGEROUS_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\bos\s*\.\s*(system|popen|spawn|exec)\s*\(/, reason: "process execution is not allowed" },
  { pattern: /subprocess\s*/, reason: "process execution is not allowed" },
  { pattern: /\bexec\s*\(/, reason: "code execution is not allowed" },
  { pattern: /\beval\s*\(/, reason: "code execution is not allowed" },
  { pattern: /__import__\s*\(/, reason: "dynamic imports are not allowed" },
  { pattern: /\bopen\s*\(/, reason: "file access is not allowed" },
  { pattern: /\bsocket\s*\./, reason: "network access is not allowed" },
  { pattern: /import\s+(urllib|requests?|ftplib|smtplib)/, reason: "network access is not allowed" },
  { pattern: /import\s+(ctypes|multiprocessing)/, reason: "system access is not allowed" },
  { pattern: /os\.environ/, reason: "environment access is not allowed" },
  { pattern: /\\[A-Za-z]:\\\\/, reason: "absolute paths are not allowed" },
];

const DANGEROUS_PATTERNS: Record<string, { pattern: RegExp; reason: string }[]> = {
  cpp: CPP_DANGEROUS_PATTERNS,
  c: CPP_DANGEROUS_PATTERNS,
  java: JAVA_DANGEROUS_PATTERNS,
  python: PYTHON_DANGEROUS_PATTERNS,
};

export function validateCode(code: string, language: string): { valid: boolean; error?: string } {
  if (typeof code !== "string") {
    return { valid: false, error: "Invalid request" };
  }

  if (code.length === 0) {
    return { valid: false, error: "No code provided" };
  }

  if (code.length > MAX_CODE_LENGTH) {
    return { valid: false, error: `Code too long (max ${MAX_CODE_LENGTH} characters)` };
  }

  if (!isSupportedLanguage(language)) {
    return {
      valid: false,
      error: `Unsupported language "${language}". Supported: C++, Java, Python.`,
    };
  }

  const patterns = DANGEROUS_PATTERNS[language] || [];
  for (const { pattern, reason } of patterns) {
    if (pattern.test(code)) {
      return { valid: false, error: `Security restriction: ${reason}` };
    }
  }

  return { valid: true };
}

export function sanitizeError(error: unknown): string {
  let msg = "";
  const err = error as { stderr?: unknown; message?: unknown };
  if (typeof err.stderr === "string") {
    msg = err.stderr.trim();
  } else if (typeof err.message === "string") {
    msg = err.message;
  }

  const tempPrefix = path.join(os.tmpdir(), "codora-");
  while (msg.includes(tempPrefix)) {
    const start = msg.indexOf(tempPrefix);
    const end = msg.indexOf(" ", start);
    const sliceEnd = end === -1 ? start + tempPrefix.length + 20 : end;
    msg = msg.slice(0, start) + "<temp>" + msg.slice(sliceEnd);
  }

  return msg || "Unknown error";
}