"use strict";

// Codora offline Python runner.
// Loads Pyodide (Python compiled to WebAssembly) from a local vendored copy
// under /vendor/pyodide, so Python works fully offline from the very first run
// with no internet connection or CDN required.
//
// Message protocol (mirrors /vendor/jscpp/JSCPP.es5.min.js worker branch):
//   in : [id, "run", code, input]
//   out: { type: "stdio.write", data }: output chunk
//        { id, err: 0, data }: finished OK
//        { id, err: -1, msg }: failed
//        { type: "loading", msg }: engine is still starting up

const PYODIDE_URL = "/vendor/pyodide/pyodide.js";
const PYODIDE_INDEX = "/vendor/pyodide/";

const MAX_RUN_MS = 8000;

let pyodidePromise = null;

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
    if (typeof self.loadPyodide !== "function") {
      self.postMessage({
        type: "loading",
        msg: "Downloading the Python engine (one time)…",
      });
      importScripts(PYODIDE_URL);
    }

    if (!pyodidePromise) {
      self.postMessage({
        type: "loading",
        msg: "Starting the Python engine…",
      });
      pyodidePromise = self.loadPyodide({ indexURL: PYODIDE_INDEX });
    }

    const pyodide = await pyodidePromise;

    const output = [];
    let cursor = 0;

    pyodide.setStdout({ batched: (s) => output.push(s) });
    pyodide.setStderr({ batched: (s) => output.push(s + "\n") });
    pyodide.setStdin({
      stdin: () => {
        if (cursor >= input.length) return undefined;
        const rest = input.slice(cursor);
        cursor = input.length;
        return rest;
      },
    });

    const started = Date.now();
    let timedOut = false;
    const watchdog = setInterval(() => {
      if (timedOut) return;
      if (Date.now() - started > MAX_RUN_MS) {
        timedOut = true;
        clearInterval(watchdog);
        self.postMessage({
          id,
          err: -1,
          msg: "Execution timeout",
          output: output.join(""),
        });
      }
    }, 250);

    await pyodide.runPythonAsync(code);
    clearInterval(watchdog);
    if (timedOut) return;

    self.postMessage({ id, err: 0, data: null, output: output.join("") });
  } catch (err) {
    const raw = String((err && err.message) || err);
    const msg = raw
      .split("\n")
      .filter((line) => !/^\s*File "<exec>", line \d+$/.test(line))
      .join("\n");
    self.postMessage({ id, err: -1, msg, output: "" });
  }
};