import { NextRequest, NextResponse } from "next/server";
import { writeSource, compile, runWithInput, cleanupDir } from "@/lib/codeExecutor";
import { validateCode, sanitizeError } from "@/lib/codeValidation";
import { explainCompileError } from "@/lib/explainError";

interface RunCodeRequest {
  code: string;
  language?: string;
  input?: string;
}

const MAX_INPUT_LENGTH = 10000;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;
const ipRequests = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequests.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { output: "Error: Too many requests. Please slow down.", success: false },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { code, language = "cpp", input = "" } = body as RunCodeRequest;

    const check = validateCode(code, language);
    if (!check.valid) {
      return NextResponse.json({ output: `Error: ${check.error}`, success: false });
    }

    if (typeof input !== "string" || input.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { output: `Error: Input too large (max ${MAX_INPUT_LENGTH} characters)`, success: false },
        { status: 200 }
      );
    }

    const { tempDir, sourceFile, executablePath } = await writeSource(code);

    try {
      await compile(sourceFile, executablePath);

      try {
        const output = await runWithInput(executablePath, tempDir, input);
        return NextResponse.json({ output: output || "(no output)", success: true });
      } catch (runError) {
        return NextResponse.json(
          { output: `Error: ${sanitizeError(runError)}`, success: false },
          { status: 200 }
        );
      }
    } catch (compileError) {
      const message = sanitizeError(compileError);
      return NextResponse.json(
        { output: `Error: ${message}`, explanation: explainCompileError(message), success: false },
        { status: 200 }
      );
    } finally {
      cleanupDir(tempDir);
    }
  } catch (error) {
    const safeMessage = sanitizeError(error);
    return NextResponse.json(
      { output: `Error: ${safeMessage || "Internal server error"}`, success: false },
      { status: 500 }
    );
  }
}