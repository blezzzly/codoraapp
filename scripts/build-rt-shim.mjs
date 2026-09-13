// Compiles scripts/cpp-rt-shim.c with the vendored Clang-WASM toolchain and
// writes public/vendor/clang/libgcc-shim.o. Pure offline (no network).
// Run: node scripts/build-rt-shim.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "public", "vendor", "clang");

function bytesOf(name) {
  const b = readFileSync(path.join(DIR, name));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

runInThisContext(
  readFileSync(path.join(DIR, "shared.js"), "utf8") + "\n;globalThis.__CPP_API = API;",
  { filename: "shared.js" }
);
globalThis.API = globalThis.__CPP_API;

const API = globalThis.API;
const api = new API({
  readBuffer: async (name) => {
    if (name === "sysroot.tar") return bytesOf("sysroot.tar");
    throw new Error("unexpected " + name);
  },
  compileStreaming: async (name) => WebAssembly.compile(bytesOf(name)),
  hostWrite: () => {},
});

await api.ready;
api.memfs.addFile("shim.c", readFileSync(path.join(ROOT, "scripts", "cpp-rt-shim.c"), "utf8"));

const clang = await api.getModule("clang");
await api.run(
  clang,
  "clang",
  "-cc1",
  "-emit-obj",
  ...api.clangCommonArgs,
  "-x",
  "c",
  "-O2",
  "-o",
  "shim.o",
  "shim.c"
);

const out = new Uint8Array(api.memfs.getFileContents("shim.o"));
writeFileSync(path.join(DIR, "libgcc-shim.o"), Buffer.from(out));
console.log("built libgcc-shim.o:", out.length, "bytes");