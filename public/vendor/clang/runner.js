/*
 * Codora offline C++ runner.
 *
 * Drives the vendored Clang-WASM toolchain (clang + lld + memfs + sysroot.tar
 * from binji/wasm-clang, Apache-2.0) entirely on-device:
 *
 *   test.cc --clang--> test.o --wasm-ld--> test.wasm --execute--> stdout
 *
 * No network is ever contacted. This file is shared verbatim by the browser
 * worker (/vendor/clang.worker.js) and the Node verification script
 * (scripts/verify-cpp-offline.mjs) so the same code is tested offline.
 */
(function (global) {
  "use strict";

  const ESUCCESS_SENTINEL = null;

  function stripAnsi(s) {
    return String(s || "").replace(/\u001b\[[0-9;]*m/g, "");
  }

  function cleanDiag(s) {
    return stripAnsi(s)
      .split("\n")
      .filter(function (line) {
        return !/^\s*>\s/.test(line.trim()) && !/Fetching and compiling/.test(line);
      })
      .join("\n")
      .trim();
  }

  function cleanStdout(s) {
    return stripAnsi(s)
      .split("\n")
      .filter(function (line) {
        return !/^\s*>\s/.test(line.trim());
      })
      .join("\n")
      .replace(/\n{2,}/g, "\n");
  }

  /**
   * options = {
   *   readBytes: async (name) => ArrayBuffer,
   *   compileModule: async (name) => WebAssembly.Module,
   * }
   */
  class CodoraCppRunner {
    constructor(options) {
      this.readBytes = options.readBytes;
      this.compileModule = options.compileModule;
      this.shimBytes = options.shimBytes || null;
      this.buffers = { compile: "", link: "", run: "" };
      this.phase = "boot";

      const self = this;
      this.sysrootBuffer = null;

      this.api = new global.API({
        readBuffer: async function (name) {
          if (name === "sysroot.tar") {
            if (!self.sysrootBuffer) {
              self.sysrootBuffer = await self.readBytes(name);
            }
            return self.sysrootBuffer;
          }
          throw new Error("unexpected buffer: " + name);
        },
        compileStreaming: async function (name) {
          if (name === "sysroot.tar") throw new Error("not a module");
          return self.compileModule(name);
        },
        hostWrite: function (s) {
          self.buffers[self.phase] += s;
        },
      });

      this.ready = this.api.ready;

      // Override binji's link() so it 1) skips the optional g2d canvas library
      // and 2) links the compiler-rt shim that provides long-double helpers
      // (execution/IO-only programs never touch the canvas imports).
      const origReady = this.ready;
      this.api.link = (obj, wasm) =>
        (async () => {
          await origReady;
          const lld = await this.api.getModule("lld");
          const libdir = "lib/wasm32-wasi";
          const args = [
            "--no-threads",
            "--export-dynamic",
            "-z",
            "stack-size=1048576",
            "-L" + libdir,
            libdir + "/crt1.o",
          ];
          if (this.shimBytes) args.push(libdir + "/libgcc-shim.o");
          args.push(obj, "-lc", "-lc++", "-lc++abi", "-o", wasm);
          return this.api.run(lld, "wasm-ld", ...args);
        })();
    }

    async compile(code, input) {
      const api = this.api;
      await this.ready;
      this.buffers = { compile: "", link: "", run: "" };
      this.phase = "boot";
      api.memfs.addFile("test.cc", code);
      api.memfs.stdinStr = input || "";
      api.memfs.stdinStrPos = 0;

      this.phase = "compile";
      try {
        await api.compile({ input: "test.cc", contents: code, obj: "test.o" });
      } catch (e) {
        return {
          ok: false,
          kind: "compile",
          diag: cleanDiag(this.buffers.compile) || String((e && e.message) || e),
        };
      }

      this.phase = "link";
      if (this.shimBytes) {
        api.memfs.addFile("lib/wasm32-wasi/libgcc-shim.o", this.shimBytes);
      }
      try {
        await api.link("test.o", "test.wasm");
      } catch (e) {
        return {
          ok: false,
          kind: "link",
          diag: cleanDiag(this.buffers.link) || String((e && e.message) || e),
        };
      }

      let wasmModule;
      try {
        wasmModule = await global.WebAssembly.compile(
          api.memfs.getFileContents("test.wasm")
        );
      } catch (e) {
        return {
          ok: false,
          kind: "link",
          diag: "Could not load the compiled program: " + String((e && e.message) || e),
        };
      }

      this.phase = "run";
      let exitCode = 0;
      try {
        await api.run(wasmModule, "test.wasm");
      } catch (e) {
        exitCode = e && e.code != null ? e.code : -2;
      }

      return {
        ok: exitCode === 0,
        kind: "run",
        exitCode,
        stdout: cleanStdout(this.buffers.run),
        stdoutRaw: this.buffers.run,
        diag: exitCode === 0 ? "" : cleanDiag(this.buffers.run) || "Program exited with code " + exitCode,
      };
    }
  }

  global.CodoraCppRunner = CodoraCppRunner;
})(typeof self !== "undefined" ? self : globalThis);