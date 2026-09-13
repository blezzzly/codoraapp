"use strict";

// Codora offline C++ runner (Clang-WASM).
// Compiles and executes real C++ entirely on the device using the vendored
// Clang WASM toolchain under /vendor/clang. Never contacts the network.
//
// Message protocol (same as /vendor/jscpp/JSCPP.es5.min.js worker branch):
//   in : [id, "run", code, input]
//   out: { err: 0, type: "stdio.write", data: output chunk }
//        { id, err: 0, output }: finished OK
//        { id, err: -1, msg }: failed (diagnostics are streamed first)

const TOOLCHAIN = "/vendor/clang/";

self.importScripts(TOOLCHAIN + "shared.js", TOOLCHAIN + "runner.js");

let runner = null;

function getRunner() {
  if (runner) return runner;
  const shimPromise = fetch(TOOLCHAIN + "libgcc-shim.o").then((res) =>
    res.ok ? res.arrayBuffer() : null
  );
  runner = new self.CodoraCppRunner({
    readBytes: async (name) => {
      const res = await fetch(TOOLCHAIN + name);
      return res.arrayBuffer();
    },
    compileModule: async (name) => {
      const res = await fetch(TOOLCHAIN + name);
      return WebAssembly.compile(await res.arrayBuffer());
    },
    shimBytes: await shimPromise,
  });
  return runner;
}

self.onmessage = async (event) => {
  const data = event.data || [];
  const id = data[0];
  const method = data[1];

  if (method !== "run") {
    self.postMessage({ id, err: 1, msg: "Unsupported method" });
    return;
  }

  const code = typeof data[2] === "string" ? data[2] : "";
  const input = typeof data[3] === "string" ? data[3] : "";

  try {
    self.postMessage({ id, err: 0, type: "loading", msg: "Compiling with Clang WASM (offline)…" });

    const result = await getRunner().compile(code, input);

    if (!result.ok) {
      const diag =
        result.diag ||
        (result.kind === "run" && result.exitCode
          ? "Program exited with code " + result.exitCode
          : "Compilation failed");
      self.postMessage({ err: 0, type: "stdio.write", data: diag });
      self.postMessage({ id, err: -1, msg: diag });
      return;
    }

    if (result.stdout) {
      self.postMessage({ err: 0, type: "stdio.write", data: result.stdout });
    }
    self.postMessage({ id, err: 0, output: result.stdout || "" });
  } catch (err) {
    self.postMessage({
      id,
      err: -1,
      msg: "The C++ compiler could not start. " +
        "Make sure the Clang toolchain is installed in Settings, then reload the app.\n" +
        String((err && err.message) || err),
    });
  }
};