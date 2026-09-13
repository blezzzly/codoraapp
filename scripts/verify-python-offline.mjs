// Codora offline Python verification.
//
// Loads the vendored Pyodide 0.26.4 bundle (public/vendor/pyodide) purely from
// disk and runs real Python through it. No network, no CDN. This exercises the
// same runtime the app's pyodide.worker.js uses.
// Run with: node scripts/verify-python-offline.mjs
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VENDOR = path.join(ROOT, "public", "vendor", "pyodide");
const require = createRequire(import.meta.url);

let failures = 0;
function check(name, ok, detail = "") {
  console.log((ok ? "PASS" : "FAIL") + "  " + name + (detail ? "  | " + detail : ""));
  if (!ok) failures++;
}

const needed = ["pyodide.js", "pyodide.asm.js", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];
for (const f of needed) {
  const ok = (() => {
    try {
      return statSync(path.join(VENDOR, f)).size > 0;
    } catch {
      return false;
    }
  })();
  check(`vendored file present: ${f}`, ok);
}

try {
  const bundle = require(path.join(VENDOR, "pyodide.js"));
  const loadPyodide = bundle && (bundle.loadPyodide || bundle.default);
  if (typeof loadPyodide !== "function") {
    check("loadPyodide is exposed", false, "bundle did not export loadPyodide");
  } else {
    const captured = [];
    const py = await loadPyodide({
      indexURL: VENDOR.replace(/\\/g, "/"),
      stdout: (s) => captured.push(String(s)),
      stderr: (s) => captured.push(String(s)),
    });

    py.runPython(`
import math, random, re
from collections import Counter
print(math.sqrt(25))
print(1 <= random.randint(1, 10) <= 10)
print(Counter([1,2,2,3,3,3]))
print(re.sub(r"[0-9]+", "N", "abc123"))
`);
    const lines = captured.slice(0, 4);
    check("sqrt(25) == 5.0", lines[0] === "5.0", lines[0]);
    check("random works", /True/.test(lines[1] || ""), lines[1]);
    check("Counter works", /Counter\(\{3: 3, 2: 2, 1: 1\}\)/.test(lines[2] || ""), lines[2]);
    check("regex works", lines[3] === "abcN", lines[3]);
    check("dialect is Python 3.12", String(py.runPython("import sys; sys.version.split(' ')[0]")).startsWith("3.12"));
  }
} catch (err) {
  check("load Pyodide from disk", false, String((err && err.stack) || err).slice(0, 200));
}

console.log(failures === 0 ? "\nALL PYTHON OFFLINE CHECKS PASSED" : "\n" + failures + " CHECK(S) FAILED");
process.exit(failures === 0 ? 0 : 1);