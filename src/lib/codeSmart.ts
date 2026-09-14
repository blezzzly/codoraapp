import type { LanguageId } from "@/lib/languages";

export interface CompletionItem {
  label: string;
  insert: string;
  detail?: string;
  kind: "keyword" | "snippet";
}

export interface WordAtCaret {
  word: string;
  start: number;
}

const CPP_KEYWORDS = [
  "auto", "bool", "break", "case", "catch", "char", "class", "const",
  "continue", "default", "delete", "do", "double", "else", "enum", "false",
  "float", "for", "friend", "if", "include", "int", "long", "main", "namespace",
  "new", "nullptr", "operator", "private", "protected", "public", "return",
  "short", "sizeof", "static", "std", "string", "struct", "switch", "template",
  "this", "throw", "true", "try", "typedef", "using", "vector", "void", "while",
];

const JAVA_KEYWORDS = [
  "abstract", "break", "byte", "case", "catch", "char", "class", "continue",
  "default", "do", "double", "else", "enum", "extends", "false", "final",
  "finally", "float", "for", "if", "implements", "import", "instanceof", "int",
  "interface", "long", "main", "new", "null", "package", "private", "protected",
  "public", "return", "short", "static", "super", "switch", "synchronized",
  "this", "throw", "throws", "true", "try", "void", "while", "String", "System",
  "Integer", "Double", "Boolean", "List", "ArrayList", "Map", "HashMap",
  "Scanner",
];

const PY_KEYWORDS = [
  "and", "as", "assert", "async", "await", "break", "class", "continue",
  "def", "del", "elif", "else", "except", "False", "finally", "for", "from",
  "global", "if", "import", "in", "is", "lambda", "None", "nonlocal", "not",
  "or", "pass", "print", "raise", "return", "self", "True", "try", "while",
  "with", "yield", "range", "len", "str", "int", "float", "input", "list",
  "dict", "set", "tuple",
];

interface Snippet {
  trigger: string;
  label: string;
  insert: string;
  detail: string;
}

const SNIPPETS: Record<LanguageId, Snippet[]> = {
  cpp: [
    {
      trigger: "main",
      label: "main",
      insert: "int main() {\n    \n    return 0;\n}",
      detail: "int main() { … }",
    },
    {
      trigger: "cout",
      label: "cout",
      insert: "std::cout <<  << std::endl;",
      detail: "std::cout <<  << std::endl",
    },
    {
      trigger: "cin",
      label: "cin",
      insert: "std::cin >> ;",
      detail: "std::cin >> input",
    },
    {
      trigger: "for",
      label: "for",
      insert: "for (int i = 0; i < n; i++) {\n    \n}",
      detail: "for (int i = 0; …)",
    },
    {
      trigger: "while",
      label: "while",
      insert: "while (condition) {\n    \n}",
      detail: "while (…) { … }",
    },
    {
      trigger: "if",
      label: "if",
      insert: "if (condition) {\n    \n}",
      detail: "if (…) { … }",
    },
    {
      trigger: "class",
      label: "class",
      insert: "class Name {\npublic:\n    Name() {}\n};",
      detail: "class Name { … };",
    },
    {
      trigger: "include",
      label: "include",
      insert: "#include <iostream>",
      detail: "#include <…>",
    },
  ],
  java: [
    {
      trigger: "psvm",
      label: "psvm",
      insert: "public static void main(String[] args) {\n    \n}",
      detail: "public static void main(String[] args)",
    },
    {
      trigger: "main",
      label: "main",
      insert: "public static void main(String[] args) {\n    \n}",
      detail: "public static void main(String[] args)",
    },
    {
      trigger: "sout",
      label: "sout",
      insert: "System.out.println();",
      detail: "System.out.println()",
    },
    {
      trigger: "scan",
      label: "scan",
      insert: "Scanner scanner = new Scanner(System.in);",
      detail: "new Scanner(System.in)",
    },
    {
      trigger: "for",
      label: "for",
      insert: "for (int i = 0; i < n; i++) {\n    \n}",
      detail: "for (int i = 0; …)",
    },
    {
      trigger: "if",
      label: "if",
      insert: "if (condition) {\n    \n}",
      detail: "if (…) { … }",
    },
    {
      trigger: "class",
      label: "class",
      insert: "public class Main {\n    public static void main(String[] args) {\n        \n    }\n}",
      detail: "public class Main { … }",
    },
  ],
  python: [
    {
      trigger: "def",
      label: "def",
      insert: "def function_name():\n    ",
      detail: "def function_name():",
    },
    {
      trigger: "for",
      label: "for",
      insert: "for i in range(n):\n    ",
      detail: "for i in range(…):",
    },
    {
      trigger: "while",
      label: "while",
      insert: "while condition:\n    ",
      detail: "while condition:",
    },
    {
      trigger: "if",
      label: "if",
      insert: "if condition:\n    ",
      detail: "if condition:",
    },
    {
      trigger: "print",
      label: "print",
      insert: "print()",
      detail: "print(…)",
    },
    {
      trigger: "main",
      label: "main",
      insert:
        'if __name__ == "__main__":\n    main()',
      detail: "main() entry point",
    },
  ],
};

/** Word (identifier) directly before the caret, with its start offset. */
export function wordAtCaret(value: string, caret: number): WordAtCaret {
  let start = caret;
  while (start > 0 && /[A-Za-z0-9_#]/.test(value[start - 1])) start--;
  return { word: value.slice(start, caret), start };
}

export function getCompletions(
  language: LanguageId,
  prefix: string,
  code?: string
): CompletionItem[] {
  if (!prefix) return [];
  // Allow `#inc` to complete to `#include` in C++.
  const p = prefix.toLowerCase().replace(/^#/, "");
  const items: CompletionItem[] = [];
  const usesUsingNamespaceStd =
    language === "cpp" &&
    typeof code === "string" &&
    /\busing namespace std;/.test(code);

  const keywordList =
    language === "python" ? PY_KEYWORDS : language === "java" ? JAVA_KEYWORDS : CPP_KEYWORDS;
  const snippetLabels = new Set<string>();
  for (const s of SNIPPETS[language]) {
    if (s.trigger.toLowerCase().startsWith(p)) {
      snippetLabels.add(s.label);
      let insert = s.insert;
      let detail = s.detail;
      if (language === "cpp" && s.trigger === "cout") {
        insert = usesUsingNamespaceStd
          ? "cout <<  << endl;"
          : "std::cout <<  << std::endl;";
        detail = insert;
      } else if (language === "cpp" && s.trigger === "cin") {
        insert = usesUsingNamespaceStd ? "cin >> ;" : "std::cin >> ;";
        detail = insert;
      }
      items.push({
        label: s.label,
        insert,
        detail,
        kind: "snippet",
      });
    }
  }
  for (const kw of keywordList) {
    if (snippetLabels.has(kw)) continue;
    if (kw.toLowerCase().startsWith(p)) {
      items.push({ label: kw, insert: kw, kind: "keyword" });
    }
  }

  items.sort((a, b) => {
    const ac = a.label.charAt(0) === prefix.charAt(0) ? 0 : 1;
    const bc = b.label.charAt(0) === prefix.charAt(0) ? 0 : 1;
    if (ac !== bc) return ac - bc;
    return a.label.length - b.label.length;
  });

  return items.slice(0, 8);
}

function countChar(str: string, ch: string): number {
  let n = 0;
  for (const c of str) if (c === ch) n++;
  return n;
}

/** Prettier-style re-indenter for brace languages (C++, Java). */
function formatBrace(code: string): string {
  const lines = code.replace(/\t/g, "    ").split("\n");
  const out: string[] = [];
  let indent = 0;
  let inString = false;
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }
    if (countChar(trimmed, '"') % 2 === 1) inString = !inString;
    if (!inString) {
      let level = indent;
      if (/^[})]/.test(trimmed)) level = Math.max(0, indent - 1);
      const opens = countChar(trimmed, "{");
      const closes = countChar(trimmed, "}");
      indent = Math.max(0, indent + opens - closes);
      out.push("    ".repeat(level) + trimmed);
    } else {
      out.push(trimmed);
    }
  }
  return out.join("\n");
}

/** Prettier-style re-indenter for Python (indentation-driven blocks). */
function formatPython(code: string): string {
  const lines = code.replace(/\t/g, "    ").split("\n");
  const out: string[] = [];
  let indent = 0;
  let inString = false;
  const DEDENT_LINE = /^(return|break|continue|pass|raise|yield)\b/;
  const DEDENT_BLOCK = /^(else|elif|except|finally)\b.*:$/;
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }
    if (countChar(trimmed, '"') % 2 === 1 || countChar(trimmed, "'") % 2 === 1) {
      inString = !inString;
    }
    if (!inString) {
      let level = indent;
      if (DEDENT_LINE.test(trimmed) || DEDENT_BLOCK.test(trimmed)) {
        level = Math.max(0, indent - 1);
      }
      if (trimmed.startsWith("#")) level = Math.max(0, indent - 1);
      out.push("    ".repeat(level) + trimmed);
      if (trimmed.endsWith(":")) indent += 1;
    } else {
      out.push(trimmed);
    }
  }
  return out.join("\n");
}

/** Light, local "prettier": aligns indentation line-by-line for the language. */
export function formatCode(language: LanguageId, code: string): string {
  if (language === "python") return formatPython(code);
  return formatBrace(code);
}