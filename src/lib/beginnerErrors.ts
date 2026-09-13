// Beginner-friendly error messages.
//
// Raw compiler/runtime messages are full of scary symbols. This layer turns
// them into short, plain sentences a total beginner can act on. It is used for
// the on-device runtimes (JSCPP, Pyodide, and the desktop's Java bridge).

function clean(raw: string): string {
  return String(raw ?? "")
    .replace(/\u001b\[[0-9;]*m/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Pull the first "line N" mentioned by a compiler/runtime message. */
function extractLine(raw: string): number | undefined {
  const m = String(raw).match(/(?:line|:)\s*(\d+)\s*[,:]?/i);
  if (m) return Number(m[1]);
  return undefined;
}

function lastLine(raw: string): string {
  const parts = clean(raw).split("\n").filter((l) => l.trim());
  return parts[parts.length - 1] || raw;
}

export function friendlyError(language: string, raw: string): string {
  const s = clean(raw);
  if (!s) return "Your program stopped before publishing an error. Try running it again.";
  const line = extractLine(s);

  let out: string;
  if (language === "python") out = friendlyPython(s, line);
  else if (language === "java") out = friendlyJava(s, line);
  else if (language === "cpp") out = friendlyCpp(s, line);
  else out = friendlyGeneric(s, line);

  return String(out || "Your program stopped with an error.")
    .replace(/ {2,}/g, " ")
    .replace(/,\s*\./g, ".")
    .replace(/\.\s*,/g, ".");
}

function friendlyPython(s: string, line?: number): string {
  const last = lastLine(s);
  const at = line ? ` around line ${line} of your code` : "";
  const miss = (name?: string) => {
    const n = name ? ` "${name}"` : "";
    return (
      `Python doesn't know${n}${at ? " " + at : " here"}.` +
      `\n\nTip: ${name
        ? `Fix the spelling of "${name}" (capital letters and spaces matter), or create it before you use it.`
        : "Check that every variable and function name is spelled the same every time."}`
    );
  };

  const m = s.match(/NameError:\s*name\s+['"]?([A-Za-z_]\w*)['"]?\s+is not defined/);
  if (m) return miss(m[1]);

  if (/NameError/i.test(last)) return miss(undefined);
  if (/ZeroDivisionError|division by zero/i.test(last))
    return `You tried to divide by zero.${at ? " " + at : ""}` + `\n\nTip: Python cannot divide by 0. Check what value the variable holds before dividing.`;
  if (/IndexError|list index out of range/i.test(s))
    return `You asked for an item of a list that is too far.${at ? " " + at : ""}` + `\n\nTip: a list with N items has indexes from 0 to N-1.`;
  if (/KeyError/i.test(s))
    return `You looked for a key that is not in the dictionary.` + `\n\nTip: check the spelling of the key, or add it first with dict[key] = value.`;
  if (/AttributeError:/i.test(s)) {
    const m2 = s.match(/AttributeError:\s*module\s+'(\w+)' has no attribute '(\w+)'/);
    if (m2)
      return `The module "${m2[1]}" has no function named "${m2[2]}".` + `\n\nTip: check the exact function name — for example math.sqrt(), not math.sqroot().`;
    return `You used something that this object does not have.${at ? " " + at : ""}` + `\n\nTip: check the name and the dots — for example input().strip() is valid, input().stripx is not.`;
  }
  if (/TypeError:/i.test(s))
    return `Python can't combine these two kinds of values.${at ? " " + at : ""}` + `\n\nTip: numbers and text don't mix — convert with str(...) or int(...) first.`;
  if (/ValueError:/i.test(s))
    return `You gave a value that doesn't fit — for example turning "abc" into a number.${at ? " " + at : ""}` + `\n\nTip: check what the user typed before converting it with int() or float().`;
  if (/InputMismatch|EOFError/i.test(s))
    return `Your program ran out of input — it asked for input() but there was no more text to read.${at ? " " + at : ""}` + `\n\nTip: type the answers your input() lines expect (one value per line).`;
  if (/RecursionError/i.test(s))
    return `Your function keeps calling itself forever.` + `\n\nTip: add a condition (base case) that stops the repeated calls.`;
  if (/ModuleNotFoundError|ImportError/i.test(s)) {
    const m2 = s.match(/No module named ['"]?(\w+)['"]?/);
    const mod = m2 ? m2[1] : "a module";
    return `Python can't find the library "${mod}".` + `\n\nTip: make sure the library name is spelled correctly. The built-in libraries (math, random, time, etc.) already work offline.`;
  }
  if (/IndentationError/i.test(s))
    return `Your spaces / indentation are wrong.${at ? " " + at : ""}` + `\n\nTip: lines after a colon ( : ) must be indented together with the SAME number of spaces.`;
  if (/SyntaxError|invalid syntax/i.test(s))
    return `Python found a mistake while reading your code${at ? ", around line " + line : ""}.` + `\n\nTip: check for a missing colon :, a missing parenthesis ), or a missing quote ".`;
  if (/RuntimeError|RuntimeError/i.test(s) && /overflowerror/i.test(s))
    return `A number got too big for Python to handle.`;
  if (/KeyboardInterrupt/i.test(s)) return `You stopped the program while it was running.`;

  const short = s
    .replace(/Traceback[\s\S]*?File "[^"]*", line \d+, in \w+[\s\S]*?\n?/, "")
    .split("\n").slice(-3).join("\n");
  return `Python hit an error${at ? ", around line " + line : ""}.\n\nMessage: ${short}\n\nTip: read the Message above — the real cause is in the last line.`;
}

function friendlyJava(s: string, line?: number): string {
  const at = line ? `around line ${line}` : "";

  // javac compile errors: Main.java:LINE: error: MSG
  const compile = s.match(/Main\.java:\s*(\d+):\s*error:\s*(.+?)(?:\n|$)/i);
  if (compile) {
    const ln = Number(compile[1]);
    const msg = compile[2];
    if (/cannot find symbol/i.test(msg)) {
      const sym = s.match(/symbol:\s*\S+\s+(\w+)/)?.[1];
      return (
        `Java used a name it doesn't know${sym ? `: "${sym}"` : ""}, on line ${ln}.` +
        `\n\nTip: check the spelling, or declare the variable first (for example int age;).`
      );
    }
    if (/expected/i.test(msg))
      return `Java is missing a symbol on line ${ln}.` + `\n\nTip: check what's at the end of the previous line — most statements end with ; and blocks use { and }.`;
    if (/incompatible types/i.test(msg))
      return `You tried to store one kind of value into a different kind of variable, on line ${ln}.` + `\n\nTip: int stores whole numbers, double stores decimals, and String stores text.`;
    if (/illegal start of expression|not a statement/i.test(msg))
      return `There's an extra or missing character on line ${ln}.` + `\n\nTip: check for extra { } ( ) or a missing ;.`;
    if (/unclosed string literal/i.test(msg))
      return `A text (String) is missing its closing quote on line ${ln}.` + `\n\nTip: every " must have a matching " later.`;
    if (/method.*main.*not|main not found/i.test(msg))
      return `Java can't find the main method.` + `\n\nTip: your program needs: public static void main(String[] args) { ... }`;
    if (/should be declared in a file named/i.test(msg))
      return `The class name doesn't match the file name.` + `\n\nTip: keep your class name as "Main" (capital M).`;
    if (/reached end of file while parsing|class, interface, or enum/i.test(msg))
      return `A { bracket is missing its partner.` + `\n\nTip: count your { and } — every open needs a close.`;
    return `Java found a problem on line ${ln}.` + `\n\nMessage: ${msg}\n\nTip: the fix is usually a missing ; or a typo on that line.`;
  }

  // Runtime exceptions: Exception in thread "main" java.lang.Xxx
  if (/Exception in thread/.test(s)) {
    const ex = s.match(/java\.lang\.(\w+Exception:\s*.+)/)?.[1] || lastLine(s);
    if (/NullPointerException/i.test(ex))
      return `You used an object that is empty (null).${at ? ", " + at : ""}` + `\n\nTip: create the object first — for example String name = ""; — before calling methods on it.`;
    if (/ArrayIndexOutOfBoundsException/i.test(ex))
      return `You read an array position that doesn't exist.${at ? ", " + at : ""}` + `\n\nTip: indexes start at 0, so array[n] goes from 0 to length-1.`;
    if (/StringIndexOutOfBoundsException/i.test(ex))
      return `You read past the end of a String.` + `\n\nTip: a 5-letter word has character positions 0 to 4.`;
    if (/ArithmeticException|by zero/i.test(ex))
      return `You tried to divide by zero.` + `\n\nTip: Java cannot divide by 0.`;
    if (/NumberFormatException/i.test(ex))
      return `You tried to turn text into a number, but the text wasn't a number.` + `\n\nTip: make sure the user really typed digits before using Integer.parseInt().`;
    if (/InputMismatchException/i.test(ex))
      return `The value the user typed didn't match what your Scanner expected.` + `\n\nTip: type a whole number for nextInt() and text for nextLine().`;
    if (/FileNotFoundException/i.test(ex))
      return `Java couldn't find the file.` + `\n\nTip: check the file name — capital letters matter.`;
    if (/StackOverflowError/i.test(ex))
      return `A method kept calling itself forever.` + `\n\nTip: add a condition (base case) that stops the recursion.`;
    return `Your Java program stopped with an error.${at ? ", " + at : ""}\n\nMessage: ${ex}\n\nTip: the last lines above tell you which line failed.`;
  }

  if (/error/i.test(s)) {
    const short = s.trim().split("\n").slice(0, 3).join("\n");
    return `Java ran into a problem.${at ? " " + at : ""}\n\nMessage: ${short}`;
  }
  return friendlyGeneric(s, line);
}

function friendlyCpp(s: string, line?: number): string {
  const at = line ? `around line ${line}` : "";

  if (/cannot find library|file not found|no such file or directory/i.test(s)) {
    const lib = s.match(/['"](.+?)['"]/)?.[1];
    return (
      `Your code uses a library${lib ? ` (<${lib}>)` : ""} that needs the full C++ compiler.` +
      `\n\nLight mode only runs tiny programs without real standard libraries.` +
      `\n\nPress Run again while online — Codora will download the offline Clang compiler` +
      ` (≈60 MB, one-time) and run your code with the real standard library` +
      ` (vector, algorithm, iostream, map, string, sort…).`
    );
  }
  if (/was not declared in this scope/i.test(s)) {
    const n = s.match(/['"](.+?)['"] was not declared/)?.[1];
    return (
      `C++ used a name it doesn't know${n ? `: "${n}"` : ""}, ${at || "in your code"}.` +
      `\n\nTip: declare it first (for example int count;), or check the spelling.`
    );
  }
  if (/undeclared identifier/i.test(s)) {
    const n = s.match(/['"](.+?)['"]/)?.[1];
    return (
      `The name${n ? ` "${n}"` : " you used"} was never declared, ${at || ""}.` +
      `\n\nTip: every variable must exist before you use it, and names are case-sensitive (int x vs int X).`
    );
  }
  if (/cannot convert/i.test(s))
    return `C++ got a value of the wrong kind.${at ? " " + at : ""}` + `\n\nTip: int holds whole numbers and double holds decimals — make them match.`;
  if (/expected ['"`]/i.test(s) && /before/i.test(s))
    return `A character is missing before the highlighted part.${at ? " " + at : ""}` + `\n\nTip: check the end of the previous statement — most end with ; and blocks use { }.`;
  if (/expected.*(;|;\))/i.test(s))
    return `A ; (semicolon) is missing, ${at || "somewhere before that point"}.\n\nTip: almost every statement in C++ ends with ;.`;
  if (/no match for.*operator/i.test(s))
    return `C++ can't use this operator ( +, -, <<, etc.) on those values.${at ? " " + at : ""}` + `\n\nTip: both sides must be the same kind of value (numbers with numbers, text with text).`;
  if (/undefined reference/i.test(s))
    return `C++ is missing the definition of a function you called.` + `\n\nTip: if you declared a function, write its full body too.`;

  // Default: clean it up and show just the useful tail.
  const short = s
    .replace(/In (function|member function) .*?:/g, "")
    .split("\n")
    .filter((l) => l && !/^import|^\/|^ *\^|^ *#|^\d+ \|/.test(l.trim()))
    .slice(-4)
    .join("\n");
  return `C++ hit a problem${at ? ", " + at : ""}.\n\nMessage: ${short}\n\nTip: the line with a ^ marker or that the message points to is where to look first.`;
}

function friendlyGeneric(s: string, line?: number): string {
  const at = line ? `around line ${line}` : "somewhere in your code";
  const short = s.split("\n").slice(-2).join("\n").slice(0, 300);
  return (
    `Your program stopped with an error (around ${at}).\n\n` +
    `What happened: ${short}\n\n` +
    `Tip: read the last line of the message — that's usually the real cause. If it mentions a missing ; or , check your last few lines.`
  );
}