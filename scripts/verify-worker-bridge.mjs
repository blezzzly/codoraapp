// Codora offline worker-bridge verification.
//
// Exercises public/vendor/clang.worker.js EXACTLY as a browser would: the
// worker script is parsed, importScripts loads shared.js + runner.js in the
// same realm, getRunner() fetches the wasm toolchain over HTTP, and the
// standard [id,"run",code,input] message protocol is driven end to end.
//
// This catches worker-bridge bugs (syntax errors, wrong realm bindings) that
// the runner-level tests in verify-cpp-offline.mjs cannot see. Run with:
//   node scripts/verify-worker-bridge.mjs
import { readFileSync, createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir = join(root, "public");

const MIME = {
  ".js": "text/javascript",
  ".wasm": "application/wasm",
  ".tar": "application/octet-stream",
  ".o": "application/octet-stream",
  default: "text/plain",
};

const server = createServer((req, res) => {
  try {
    const stat = statSync(join(publicDir, req.url));
    res.writeHead(200, {
      "Content-Type": MIME[extname(req.url)] ?? MIME.default,
      "Content-Length": stat.size,
    });
    createReadStream(join(publicDir, req.url)).pipe(res);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const messages = [];
const saved = {
  fetch: globalThis.fetch,
  postMessage: globalThis.postMessage,
  onmessage: globalThis.onmessage,
  importScripts: globalThis.importScripts,
  self: globalThis.self,
};

let failCount = 0;
function report(name, pass, detail) {
  console.log((pass ? "PASS" : "FAIL") + "  " + name + (detail ? "  | " + detail : ""));
  if (!pass) failCount++;
}

try {
  globalThis.self = globalThis;
  globalThis.postMessage = (m) => messages.push(m);
  const realFetch = globalThis.fetch;
  globalThis.fetch = (input) =>
    realFetch(
      new URL(String(input).startsWith("/") ? base + String(input).slice(1) : String(input))
    );
  globalThis.importScripts = (...paths) => {
    for (const p of paths) {
      runInThisContext(readFileSync(join(publicDir, p.replace(/^\//, "")), "utf8"), {
        filename: p,
      });
    }
  };

  runInThisContext(readFileSync(join(publicDir, "vendor", "clang.worker.js"), "utf8"), {
    filename: "/vendor/clang.worker.js",
  });

  console.log("C++ worker-bridge verification (Clang-WASM, browser protocol)\n");

  await globalThis.onmessage({
    data: [1, "run", '#include <iostream>\nint main(){ std::cout << "worker-ok\\n"; }', ""],
  });
  const out = messages.filter((m) => m && m.type === "stdio.write").map((m) => m.data).join("");
  const fin = messages.find((m) => m && Number.isFinite(m.err) && m.id === 1 && m.type !== "loading");
  report("output run prints 'worker-ok'", out.includes("worker-ok"), JSON.stringify(out));
  report("output run finishes with err 0", !!(fin && fin.err === 0), JSON.stringify(fin));

  messages.length = 0;
  await globalThis.onmessage({
    data: [2, "run", "#include <iostream>\nint main(){ int a,b; std::cin >> a >> b; std::cout << (a+b) << \"\\n\"; }", "20 22"],
  });
  const out2 = messages.filter((m) => m && m.type === "stdio.write").map((m) => m.data).join("");
  const fin2 = messages.find((m) => m && Number.isFinite(m.err) && m.id === 2 && m.type !== "loading");
  report("stdin run prints '42'", out2.includes("42"), JSON.stringify(out2));
  report("stdin run finishes with err 0", !!(fin2 && fin2.err === 0), JSON.stringify(fin2));

  messages.length = 0;
  await globalThis.onmessage({ data: [3, "run", "int main(){ missing_name\n", ""] });
  const fin3 = messages.find((m) => m && Number.isFinite(m.err) && m.id === 3 && m.type !== "loading");
  report("compile error reports err -1", !!(fin3 && fin3.err === -1), JSON.stringify(fin3));
  report("compile diagnostics included", /undeclared identifier/.test(fin3 && fin3.msg ? fin3.msg : ""));
} finally {
  globalThis.postMessage = saved.postMessage;
  globalThis.fetch = saved.fetch;
  globalThis.importScripts = saved.importScripts;
  globalThis.onmessage = saved.onmessage;
  globalThis.self = saved.self;
  await new Promise((r) => server.close(r));
}

if (failCount > 0) {
  console.error(`\n${failCount} worker-bridge check(s) FAILED`);
  process.exit(1);
}
console.log("\nALL WORKER-BRIDGE CHECKS PASSED");
process.exit(0);