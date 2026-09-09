export interface ErrorExplanation {
  hint: string;
  why: string;
  tryChecking: string;
  line?: number;
}

const RULES: { pattern: RegExp; explanation: (m: RegExpMatchArray) => ErrorExplanation }[] = [
  {
    pattern: /expected ['";{\}\]),]+ before ['"]?(.+?)['"]?/,
    explanation: (m) => ({
      hint: `You are missing a ";" before "${m[1]?.trim() || "this token"}."`,
      why: "In C++, statements end with a semicolon ( ; ), like a period at the end of a sentence.",
      tryChecking: "The line directly above where the error points. Add ; at the end of that statement.",
    }),
  },
  {
    pattern: /expected (initializer )?before ['"]?(.+?)['"]?/,
    explanation: (m) => ({
      hint: `Something is missing before "${m[2]?.trim() || "what the compiler expected"}."`,
      why: "The compiler hit an unexpected place in your code — often an extra or missing character.",
      tryChecking: "Look at the highlighted line for missing ; { } ( ) or misplaced quotes.",
    }),
  },
  {
    pattern: /['"](.+?)['"] was not declared in this scope/,
    explanation: (m) => ({
      hint: `"${m[1].trim()}" is not recognized in this part of your code.`,
      why: "The name wasn't declared before you used it. C++ reads top to bottom, so the name must exist earlier.",
      tryChecking: "The line using " + m[1].trim() + ". Create the variable/function before it, or check the spelling.",
    }),
  },
  {
    pattern: /undeclared identifier ['"](.+?)['"]/,
    explanation: (m) => ({
      hint: `You used "${m[1].trim()}" but never declared it.`,
      why: "Every variable must be created (declared) before you can use it.",
      tryChecking: "The line with " + m[1].trim() + ". Add a declaration like: int " + m[1].trim() + "; at the top.",
    }),
  },
  {
    pattern: /expected ';' after (class|struct) definition/,
    explanation: () => ({
      hint: "You forgot the semicolon after your class or struct definition.",
      why: "A class/struct ends with }; — the semicolon is part of the definition.",
      tryChecking: "The closing brace } of your class/struct. Write }; instead of }.",
    }),
  },
  {
    pattern: /no matching function for call to ['"](.+?)['"]|has no member named ['"](.+?)['"]/,
    explanation: () => ({
      hint: "You are calling something that does not exist on this object.",
      why: "The function or variable doesn't exist, or the name is misspelled.",
      tryChecking: "The function/member name. Compare it to how you defined or declared it.",
    }),
  },
  {
    pattern: /expected unqualified-id/,
    explanation: () => ({
      hint: "There is unexpected code where the compiler expected a new statement.",
      why: "This often happens when a function or block has an extra closing brace } or a missing one earlier.",
      tryChecking: "Count your braces { } — especially around the error line.",
    }),
  },
  {
    pattern: /[\"']?main[\"']? must return ['\"]?int['\"]?/,
    explanation: () => ({
      hint: "main must be declared as int main().",
      why: "The C++ standard requires int main() as the starting point.",
      tryChecking: "Your main line. Write int main() instead of void main().",
    }),
  },
  {
    pattern: /redefinition of ['"](.+?)['"]|conflicting declaration/,
    explanation: (m) => ({
      hint: `"${m[1].trim()}" is declared more than once in the same place.`,
      why: "You can only create a name once in the same scope.",
      tryChecking: "The line where " + m[1].trim() + " is declared — remove the duplicate.",
    }),
  },
  {
    pattern: /use of undeclared identifier ['"](.+?)['"]/,
    explanation: (m) => ({
      hint: `"${m[1].trim()}" is used before it was declared.`,
      why: "Names must be declared before use (C++ reads from top to bottom).",
      tryChecking: "The line using " + m[1].trim() + ". Declare it above, or fix a typo in the name.",
    }),
  },
  {
    pattern: /expected expression/,
    explanation: () => ({
      hint: "The compiler expected a value or expression but found something else.",
      why: "Often caused by a missing operator, an incomplete line, or stray punctuation.",
      tryChecking: "The highlighted line — look for missing operators, commas, or closing brackets.",
    }),
  },
  {
    pattern: /invalid operands to binary expression|<.+>.* is not defined|no match for ['\"]operator|no viable overloaded ['\"]=['\"]/,
    explanation: () => ({
      hint: "You are using an operator (like + or =) on values that don't work together.",
      why: "Types must match — e.g., adding an int and a string doesn't work directly.",
      tryChecking: "The types of the values. Convert one type or fix the variable types.",
    }),
  },
  {
    pattern: /expected declaration before ['\"](.+?)['\"]|expected [a-z]+ at end of input/,
    explanation: () => ({
      hint: "The compiler reached the end without finishing your code.",
      why: "A block like main() is missing its closing brace }.",
      tryChecking: "The end of your program. Add the missing } to close main or your function.",
    }),
  },
  {
    pattern: /this file requires compiler and library support for the ISO C\+\+ 2011 standard/,
    explanation: () => ({
      hint: "Your code uses a modern C++ feature, but the program settings are older.",
      why: "Some newer syntax needs a modern C++ standard.",
      tryChecking: "Simplify the syntax or use features from earlier C++ versions.",
    }),
  },
];

const DEFAULT_EXPLANATION: ErrorExplanation = {
  hint: "Your code has an error in this area.",
  why: "The compiler could not understand part of your code and stopped.",
  tryChecking: "Read the highlighted line carefully — check for missing ; , { } , ( ) , quotes, or a typo.",
};

function extractLine(errorText: string): number | undefined {
  const m = errorText.match(/(?:main\.cpp|line):(\d+)/i) || errorText.match(/\b(\d{1,4})\s*[:|]?\s*(?:error|warning)/i);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : undefined;
}

export function explainCompileError(stderr: string): ErrorExplanation {
  const firstError = stderr.split("\n").find((line) => line.toLowerCase().includes("error"));
  const target = firstError || stderr;

  for (const rule of RULES) {
    const match = target.match(rule.pattern);
    if (match) {
      return {
        ...rule.explanation(match),
        line: extractLine(target),
      };
    }
  }

  return { ...DEFAULT_EXPLANATION, line: extractLine(target) };
}