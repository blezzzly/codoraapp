export type LanguageId = "cpp" | "java" | "python";

export interface LanguageConfig {
  id: LanguageId;
  label: string;
  icon: string;
  compilerId: string;
  userArguments: string;
  template: string;
  readsInput: RegExp;
}

export const DEFAULT_LANGUAGE: LanguageId = "cpp";

export const LANGUAGES: Record<LanguageId, LanguageConfig> = {
  cpp: {
    id: "cpp",
    label: "C++",
    icon: "Code",
    compilerId: "g132",
    userArguments: "-std=c++17 -O2",
    template: `#include <iostream>
using namespace std;

int main() {

} // end of main`,
    readsInput:
      /\bcin\b|\bcin\s*>>|\bstd::cin\b|\bscanf\b|\bgetline\b|\bstd::getline\b|\bgets\b|\bgetchar\b/,
  },
  java: {
    id: "java",
    label: "Java",
    icon: "Coffee",
    compilerId: "java2102",
    userArguments: "",
    template: `import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);

    }
}`,
    readsInput: /\bScanner\b|System\.in|nextInt\s*\(|nextLine\s*\(|nextDouble\s*\(|next\s*\(/,
  },
  python: {
    id: "python",
    label: "Python",
    icon: "Terminal",
    compilerId: "python312",
    userArguments: "",
    template: `#start your program here
`,
    readsInput: /\binput\s*\(/,
  },
};

export function getLanguageConfig(id: string | undefined | null): LanguageConfig {
  if (id && id in LANGUAGES) {
    return LANGUAGES[id as LanguageId];
  }
  return LANGUAGES[DEFAULT_LANGUAGE];
}

export function isSupportedLanguage(id: string | undefined | null): boolean {
  return !!id && id in LANGUAGES;
}

export function getLanguageLabel(id: string | undefined | null): string {
  return getLanguageConfig(id).label;
}

const CPP_TOKENS: Record<LanguageId, Array<{ re: RegExp; to: string }>> = {
  cpp: [],
  java: [
    { re: /\bstd::\s*cout\b/g, to: "System.out" },
    { re: /\bstd::\s*cin\b/g, to: "the Scanner" },
    { re: /\bstd::\s*endl\b/g, to: "System.out.print" },
    { re: /\bcout\b/g, to: "System.out" },
    { re: /\bcin\b/g, to: "the Scanner" },
  ],
  python: [
    { re: /\bstd::\s*cout\b/g, to: "print()" },
    { re: /\bstd::\s*cin\b/g, to: "input()" },
    { re: /\bstd::\s*endl\b/g, to: "print()" },
    { re: /\bcout\b/g, to: "print()" },
    { re: /\bcin\b/g, to: "input()" },
  ],
};

export function localizeCppText(text: string, langId: LanguageId): string {
  if (langId === "cpp") return text;
  let out = text;
  for (const token of CPP_TOKENS[langId]) out = out.replace(token.re, token.to);
  return out;
}

const FILE_EXT: Record<LanguageId, string> = {
  cpp: ".cpp",
  java: ".java",
  python: ".py",
};

export function localizeFilename(filename: string, langId: LanguageId): string {
  if (langId === "cpp") return filename;
  const base = filename.replace(/\.\w+$/, "");
  return `${base}${FILE_EXT[langId]}`;
}