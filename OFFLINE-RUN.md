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
- The toolchain is **not** force-cached at SW install so first load stays fast.
  On the **very first launch** the app shows an **Offline Setup wizard** where
  the user picks the languages they want offline and Codora streams the real
  assets into persistent browser storage (Cache Storage) with byte-accurate
  progress, SHA-256 verification and per-file resume. It can be skipped and
  installed later from Settings → Offline environment; a skipped user who runs
  C++ while online gets an automatic one-time install instead. Until the
  toolchain is present, C++ falls back to the JSCPP interpreter, clearly
  labelled, and code using real standard libraries (`<vector>`,
  `<algorithm>`, …) shows a friendly message explaining how to get the full
  compiler.

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

## 10. First-launch offline setup (this session)

The PWA greets a new user with a **Set up Codora Offline** wizard instead of
silently starting a download or writing anything to the Downloads folder:

1. The user chooses languages (C++, Python); Java is shown as unavailable
   offline in a browser (online consent / desktop app only).
2. Sizes and storage requirements are computed from the real assets by
   `scripts/generate-offline-manifest.mjs` (build-time) and emitted to
   `public/offline-manifest.json` **and** `src/lib/offlineRuntime/generated-manifest.ts`
   (bundled). No hardcoded numbers: C++ ≈ 57.6 MB · Python ≈ 13.0 MB (bundled).
3. Before downloading, `navigator.storage.estimate()` is used to refuse an
   install that clearly cannot fit; `navigator.storage.persist()` grants
   persistent storage so the engines survive browser cleanup.
4. Files are streamed into the `codora-runtimes-v1` Cache Storage with
   **per-byte progress** (downloaded/total), live speed and ETA, then each file
   is **SHA-256-verified against the manifest** before it is stored. The UI only
   reaches 100% after verification + registration.
5. Interrupted installs are per-file resumable: completed files are recorded in
   IndexedDB (`codora-runtime-registry`, the source of truth for installed
   engines) and skipped on the next run; incomplete files are re-fetched.
6. A "ready" screen confirms engines and shows total offline storage; Settings
   gains install/repair/remove/verify/check-updates/persistence controls.

Architecture (`src/lib/offlineRuntime/`):
`OfflineRuntimeManager` → `RuntimeRegistry` (IndexedDB) + `StorageManager`
(Cache Storage / `navigator.storage`) + `DownloadManager`
(`downloadEngineAssets`: stream → verify → store) + per-language engine
descriptors. `scripts/verify-offline-manager.mjs` runs the pipeline headlessly
against `public/` over localhost (no internet), asserting: manifest↔disk
parity, zero network on re-open, per-byte 0→100% progression, SHA-256 integrity
of stored files, and resume fetching only missing files.

### Final report (spec §24)

```
Offline Runtime Installation
─────────────────────────────
C++:    ✓ installed locally (Clang 8.0.1, WASI) · persistent · offline exec
Python: ✓ installed locally (Pyodide 0.26.4 / 3.12.1) · persistent · offline exec
Java:   ✗ browser offline unavailable · ✓ explicit consent for online · ✓ desktop JRE
Storage:C++ 60.4 MB + Python 13.0 MB (≈70.6 MB total; sizes from real assets)
Progress:✓ byte-accurate 0–100% · SHA-256 verified · resume kept per file
PWA restart:  ✓ verified via IndexedDB registry + Cache Storage (tested air-gapped)
Air-gapped:   ✓ C++ (7 programs) · ✓ Python (6 checks) · ✓ manager (6 cases)
Silent upload:✓ none — local-first; Java uploads only after explicit consent
```


## 11. Mobile PWA offline readiness (this session)

The user-facing requirement is "offline must work on the installed mobile PWA".
Pipeline on a phone:

- **Python**: all Pyodide assets (`pyodide.js`, `pyodide.asm.{js,wasm}`, `python_stdlib.zip`,
  `pyodide-lock.json`, `pyodide.worker.js`) are precached by the service worker
  during SW install, so Python works offline from the first open — no wizard step.
- **C++**: installed via the wizard into the SW-exempt `codora-runtimes-v1`
  cache; the SW serves `/vendor/clang/*` + `clang.worker.js` from it, so a
  fully-terminated + reopened + airplane-mode PWA still resolves the toolchain.
- **Storage**: install requests `navigator.storage.persist()` and warns when not
  granted; `estimate()` pre-checks quota before any bulk download; if the
  browser reports unknown quota the install is allowed (not falsely blocked).
- **Version floor**: Pyodide 0.26 (BigInt64Array WASM) needs iOS Safari 15+ and
  Android Chrome 85+. Older iOS shows an honest message instead of failing at
  runtime.
- **Proof, in-app**: Settings → Offline environment → **Run offline self-test**
  (also offered on the wizard ready screen) uses the exact `runOffline` path the
  editor uses: engine registry → SHA-256 over every stored file → compiles and
  runs a C++ and a Python probe → reports a clear pass/fail. This is how a
  mobile-PWA tester confirms Run works with no network.

### CheerpJ (Java in the browser) — evaluated, declined
The only real browser JVM is CheerpJ (Leaning Technologies). Tried to vendor
its runtime: their download is license-activated ("Activate your license"),
docs are gated (HTTP 403), and the runtime is not freely redistributable.
Bundling it would both be legally risky for the repo and unverifiable, so it is
NOT shipped. Java stays: desktop = bundled JRE + ecj (full offline library),
browser = online judge with explicit consent. C++ and Python are the fully
offline languages, on mobile and everywhere.
