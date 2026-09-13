// Codora offline C++ verification.
//
// Compiles and runs real C++ with the Clang-WASM toolchain vendored under
// public/vendor/clang using the SAME runner the browser worker uses
// (public/vendor/clang/runner.js). Everything is read from disk - no network,
// no remote compiler. Run with:  node scripts/verify-cpp-offline.mjs
import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "public", "vendor", "clang");

function bytesOf(name) {
  const b = readFileSync(path.join(DIR, name));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

// shared.js defines `const API` in the shared realm; surface it.
runInThisContext(
  readFileSync(path.join(DIR, "shared.js"), "utf8") + "\n;globalThis.__CPP_API = API;",
  { filename: "shared.js" }
);
globalThis.API = globalThis.__CPP_API;

runInThisContext(readFileSync(path.join(DIR, "runner.js"), "utf8"), {
  filename: "runner.js",
});

const Runner = globalThis.CodoraCppRunner;

const runner = new Runner({
  readBytes: async (name) => bytesOf(name),
  compileModule: async (name) => WebAssembly.compile(bytesOf(name)),
  shimBytes: bytesOf("libgcc-shim.o"),
});

let failCount = 0;

function report(name, pass, detail) {
  console.log((pass ? "PASS" : "FAIL") + "  " + name + (detail ? "  | " + detail : ""));
  if (!pass) failCount++;
}

console.log("C++ offline verification (Clang-WASM, no network)\n");

const t0 = Date.now();

// 1. vector + range-for
{
  const r = await runner.compile(`#include <iostream>
#include <vector>
using namespace std;
int main() { vector<int> nums = {1, 2, 3}; for (int n : nums) cout << n << " "; return 0; }`);
  report("vector + range-for prints '1 2 3 '", r.ok && r.stdout.trim() === "1 2 3", JSON.stringify(r.stdout));
}

// 2. interactive cin/cout
{
  const r = await runner.compile(`#include <iostream>
using namespace std;
int main(){ int a,b; cin >> a >> b; cout << a + b << endl; return 0; }`, "20 22");
  report("cin/cout with input '20 22' prints '42'", r.ok && r.stdout.trim() === "42", JSON.stringify(r.stdout));
}

// 3. string + map + to_string
{
  const r = await runner.compile(`#include <iostream>
#include <string>
#include <map>
using namespace std;
int main(){ map<string,int> m; m["a"]++; m["a"]++; m["b"]++; cout << m["a"] << to_string(m.size()) << endl; }`);
  report("string/map/to_string prints '22'", r.ok && r.stdout.trim() === "22", JSON.stringify(r.stdout));
}

// 4. namespaces, classes, references
{
  const r = await runner.compile(`#include <iostream>
using namespace std;
struct Point { int x, y; };
class Counter { public: int count = 0; void bump(){ ++count; } };
void addOne(int &n){ n++; }
int main(){ Point p{3,4}; Counter c; c.bump(); int v=5; addOne(v);
  cout << p.x << p.y << c.count << v << endl; }`);
  report("structs/classes/references prints '3416'", r.ok && r.stdout.trim() === "3416", JSON.stringify(r.stdout));
}

// 5. STL: queue, stack, algorithm
{
  const r = await runner.compile(`#include <iostream>
#include <queue>
#include <stack>
#include <algorithm>
#include <vector>
using namespace std;
int main(){ queue<int> q; q.push(1); q.push(2); stack<int> s; s.push(9);
  vector<int> v = {3,1,2}; sort(v.begin(), v.end());
  cout << q.front() << v[0] << v[2] << s.top() << endl; }`);
  report(
    "queue/stack/algorithm prints '1139'",
    r.ok && r.stdout.trim() === "1139",
    JSON.stringify(r.stdout) + " diag: " + (r.diag || "").split("\n").slice(0, 2).join(" | ")
  );
}

// 6. syntax error => diagnostics contain error
{
  const r = await runner.compile(`#include <iostream>
int main(){ int x = 1 int y = 2; return 0; }`);
  const diag = r.diag || "";
  report("missing ; detected as compile error", !r.ok && /error/i.test(diag), diag.split("\n").slice(0, 1).join(" | "));
}

// 7. undefined name
{
  const r = await runner.compile(`#include <iostream>
int main(){ std::cout << missing_name; }`);
  const diag = r.diag || "";
  report("undefined name detected as compile error", !r.ok && /error/i.test(diag), diag.split("\n").slice(0, 1).join(" | "));
}

console.log("\nTotal time: " + Math.round((Date.now() - t0) / 1000) + "s");
console.log(failCount === 0 ? "\nALL C++ OFFLINE TESTS PASSED" : "\n" + failCount + " TEST(S) FAILED");
process.exit(failCount === 0 ? 0 : 1);