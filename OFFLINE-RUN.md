# Codora Offline Runtimes — Technical Report

Date: 2026-09-13 · Applies to all channels (installed PWA, desktop app).

## 1. What was built

Codora now compiles and runs **C++ and Python entirely on the user's device**,
with **no internet connection required after one-time setup**, and **never
uploads source code silently**.

| Language | Browser / PWA                | Desktop app                     |
|----------|------------------------------|---------------------------------|
| C++      | Clang 8.0.1 (WASM/WASI)      | system `g++` (falls back to the WASM engine) |
| Python   | Pyodide 0.26.4 · Python 3.12.1 | Pyodide 0.26.4 · Python 3.12.1 (same) |
| Java     | none (no JVM in a browser)   | bundled Temurin JRE + Eclipse ecj |

## 2. The C++ engine (new, this session)

A real Clang toolchain, compiled to WebAssembly, runs in a Web Worker:

```
/vendor/clang/…            clang        — LLVM/Clang 8.0.1 frontend (WASM, 31 MB)
                           lld          — wasm-ld linker (WASM)
                           memfs        — in-memory filesystem for "-" stdin/stdout
                           sysroot.tar  — libc, libc++ headers + objects (9.3 MB)
                           libgcc-shim.o— compiler-rt long-double helpers
                           shared.js    — binji/wcpp materialized API (Apache-2.0)
                           runner.js    — Codora driver (compile → link → run)
                           clang.worker.js — worker bridge
```

Pipeline per run: `clang -x c++ --sysroot=/sysroot -I/sysroot/include -o -` into
the WASI filesystem → `memfs init` (captures stdin) → `lld` links with `crt1.o`
→ the WASM module runs against a WASI-lite import that pipes stdin/stdout
through the worker. `stack-size=1M`, `--export-dynamic`. A 1.4 KB shim object
adds `__truncdfhf2`/`__truncsfhf2` etc. so `long double` code links cleanly.

### Why it works offline
- Every engine file is vendored in `public/vendor/clang/` (git repo, ~60 MB).
- The service worker serves `/vendor/clang/*` from Cache Storage; the
  `codora-runtimes-v1` cache is exempt from SW activation purging.
- The toolchain is **not** force-cached at install. The user explicitly
  downloads it once (Settings → Offline environment) with a byte-progress bar;
  after that it works in airplane mode. Until then C++ falls back to the JSCPP
  interpreter, clearly labelled in the console and Settings.

### JSCPP fallback (light mode)
`/vendor/jscpp/JSCPP.es5.min.js` (MIT) interprets a small C++ subset offline
from the very first run. The console prints "Light in-browser interpreter —
install the full C++ compiler in Settings", so it is never mistaken for real
compilation.

### Verified with the network disabled
`scripts/verify-cpp-offline.mjs` compiles and runs 7 programs using only files
on disk (no server, no CDN):

```
PASS vector + range-for        → "1 2 3"
PASS cin/cout with piped input → "42"
PASS string/map/to_string      → "22"
PASS structs/classes/references → "3416"
PASS queue/stack/algorithm     → "1139"
PASS missing ;        → compile error "test.cc:2:22: error: expected ';'"
PASS undefined name   → compile error "use of undeclared identifier"
```

## 3. The Python engine

Pyodide 0.26.4 (CPython 3.12.1, Emscripten 3.1.58) in `/vendor/pyodide/` is
precached in the service worker, so Python works offline **from the very first
run**. `python_stdlib.zip` ships the full standard library.

### Verified with the network disabled
`scripts/verify-python-offline.mjs` loads the vendored bundle from disk and runs
real Python: `math.sqrt`, `random.randint`, `collections.Counter`,
`re.sub`, and a `sys.version` check → **Python 3.12**, all passed.

## 4. Java honesty (changed this session)

There is no free JVM that runs inside a web browser, so the web/PWA *cannot*
run Java offline. Codora no longer pretends otherwise:

- The editor never uploads Java source silently. Online, running Java shows an
  explicit consent dialog: *"Java uses your internet connection — your source
  code is sent to an online compiler"*, with Cancel and "Use Online Compiler".
  The choice is remembered on-device only (localStorage).
- Offline, Java shows a message explaining the browser has no JVM and pointing
  to the desktop app.
- The desktop app keeps its bundled Temurin JRE + Eclipse ecj: Java runs fully
  offline there.

## 5. Execution engine selection (local-first)

`src/lib/executionBackend.ts` formalizes the backends:

- **BrowserOfflineBackend** — C++/Python always run on-device, **even while
  online**. The online judge is only a fallback (engine reports
  `unsupported`) or the explicitly-consented Java path. Source code is never
  auto-uploaded.
- **DesktopNativeBackend** — native `g++`, Pyodide, bundled JRE.

Settings → **Offline environment** shows per-language engines, versions,
install / clear / update for the Clang toolchain, and current storage usage.

## 6. Honest error messages

Compile/runtime failures show a beginner-friendly explanation first, with an
expandable **"Show technical compiler output"** for the raw Clang/Python
diagnostic. The raw message is used as the machine-readable cause
automatically.

## 7. Limits (stated honestly)

- Clang WASM is Clang 8 (2019 frontend). No official clang-wasm builds exist;
  this is the maintained path used by WATS/wa-sandbox-style systems. It is
  C++17-able and fully offline, and is not represented as GCC 12.
- C++ toolchain is ~60 MB one-time fetch. On very small phones the install can
  take a while; it is resumable and removable.
- The JSCPP light mode covers a subset (no real headers). It is always labelled.
- Python offline I/O is limited to provided stdin (the $ prompt); full
  interactive stdin is exercised in the PWA.
- WASM memory ceilings apply (≥ 2 GB on iOS/older devices).
- Java on the web requires either the user's explicit consent to upload or the
  desktop app. This is a platform constraint, not a missing feature.

## 8. Licenses

| Component | License |
|-----------|---------|
| Clang / LLVM 8, libc++ | Apache-2.0 / LLVM-exception (binaries built from source: Apache-2.0) |
| wasm-ld, compiler-rt | Apache-2.0 |
| binji/wcpp materials + `shared.js` runtime | Apache-2.0 (vendored as compiled artifact) |
| JSCPP | MIT |
| Pyodide | Mozilla Public License 2.0 |
| emsdk / WASI libc | Apache-2.0 / LLVM-exception (WASI-libc, `wasi-sysroot` build) |

All assets accompany their correct license texts in `public/vendor/*`.

## 9. Testing commands

```
node scripts/verify-cpp-offline.mjs    # C++ offline (disk-only, no network)
node scripts/verify-python-offline.mjs # Python offline (disk-only, no network)
npm run lint
npm run build
```

Browser-level offline is exercised by installing the toolchain (Settings →
Offline environment), enabling airplane mode, and running C++ and Python — the
service worker serves every asset from Cache Storage (all engine files are
cacheable GETs; nothing depends on `/api/`).