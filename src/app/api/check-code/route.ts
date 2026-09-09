import { NextRequest, NextResponse } from "next/server";
import { writeSource, compile, runWithInput, normalizeOutput, cleanupDir, TestCaseResult } from "@/lib/codeExecutor";
import { validateCode, sanitizeError } from "@/lib/codeValidation";
import { explainCompileError } from "@/lib/explainError";

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface CheckCodeRequest {
  code: string;
  language?: string;
  testCases?: TestCase[];
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;
const MAX_TEST_CASES = 20;
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

function validateTestCases(testCases: TestCase[] | undefined): { valid: boolean; error?: string } {
  if (!testCases || !Array.isArray(testCases)) {
    return { valid: false, error: "No test cases provided" };
  }
  if (testCases.length === 0) {
    return { valid: false, error: "No test cases provided" };
  }
  if (testCases.length > MAX_TEST_CASES) {
    return { valid: false, error: `Too many test cases (max ${MAX_TEST_CASES})` };
  }
  for (const tc of testCases) {
    if (typeof tc?.input !== "string" || typeof tc?.expectedOutput !== "string") {
      return { valid: false, error: "Invalid test case format" };
    }
    if (tc.input.length > 10000 || tc.expectedOutput.length > 10000) {
      return { valid: false, error: "Test case too large" };
    }
  }
  return { valid: true };
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

    const body = (await request.json()) as CheckCodeRequest;
    const { code, language = "cpp", testCases } = body;

    const codeCheck = validateCode(code, language);
    if (!codeCheck.valid) {
      return NextResponse.json({ compileError: codeCheck.error, success: false });
    }

    const testCheck = validateTestCases(testCases);
    if (!testCheck.valid) {
      return NextResponse.json({ compileError: testCheck.error, success: false });
    }

    const { tempDir, sourceFile, executablePath } = await writeSource(code);

    try {
      await compile(sourceFile, executablePath);

      const results: TestCaseResult[] = [];
      for (let i = 0; i < (testCases?.length ?? 0); i++) {
        const tc = testCases![i];
        try {
          const rawOutput = await runWithInput(executablePath, tempDir, tc.input);
          const actual = normalizeOutput(rawOutput);
          const expected = normalizeOutput(tc.expectedOutput);
          results.push({
            index: i,
            passed: actual === expected,
            expectedOutput: tc.expectedOutput,
            actualOutput: rawOutput,
          });
        } catch (runError) {
          results.push({
            index: i,
            passed: false,
            expectedOutput: tc.expectedOutput,
            actualOutput: `Runtime error: ${sanitizeError(runError)}`,
          });
        }
      }

      return NextResponse.json({ results, success: true });
    } catch (compileError) {
      const message = sanitizeError(compileError);
      return NextResponse.json(
        { compileError: message, explanation: explainCompileError(message), success: false },
        { status: 200 }
      );
    } finally {
      cleanupDir(tempDir);
    }
  } catch (error) {
    const safeMessage = sanitizeError(error);
    return NextResponse.json(
      { compileError: safeMessage || "Internal server error", success: false },
      { status: 500 }
    );
  }
}