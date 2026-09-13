"use strict";

// Codora offline Java runner (TeaVM).
// Compiles Java source to WebAssembly and executes it entirely on the device.
// Uses vendored TeaVM compiler + runtime classlib under /vendor/teavm.
// Never contacts the network.
//
// Message protocol:
//   in : [id, "run", code, input]
//   out: { type: "stdio.write", data }: output chunk
//        { id, err: 0, output }: finished OK
//        { id, err: -1, msg, output? }: failed

const TEAVM_COMPILER_WASM = "/vendor/teavm/compiler.wasm";
const TEAVM_RUNTIME_CLASSLIB = "/vendor/teavm/runtime-classlib-teavm.bin";
const TEAVM_COMPILE_CLASSLIB = "/vendor/teavm/compile-classlib-teavm.bin";
const TEAVM_RUNTIME_JS = "/vendor/teavm/compiler.wasm-runtime.js";

const MAX_RUN_MS = 120000;
const MAX_OUTPUT_CHARS = 1024 * 1024; // 1MB output limit

let compilerInstance = null;
let runtimeWasmModule = null;
let runtimeInitialized = false;

async function loadRuntimeJS() {
  // The runtime JS is already loaded via importScripts in the worker bootstrap
  // This function just ensures the exports are available
  if (typeof self.teavmMath === "undefined") {
    throw new Error("TeaVM runtime JS not loaded");
  }
}

async function compileWasmModule() {
  const response = await fetch(TEAVM_COMPILER_WASM, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Failed to fetch compiler WASM: ${response.status}`);
  const bytes = await response.arrayBuffer();
  return await WebAssembly.compile(bytes);
}

async function instantiateCompiler(wasmModule) {
  const imports = {
    "wasm:js-string": {
      fromCharCode: (e) => String.fromCharCode(e),
      fromCharCodeArray: () => { throw new Error("Not supported"); },
      intoCharCodeArray: () => { throw new Error("Not supported"); },
      concat: (e, t) => e + t,
      charCodeAt: (e, t) => e.charCodeAt(t),
      length: (e) => e.length,
      substring: (e, t, n) => e.substring(t, n),
    },
    teavmDate: {
      currentTimeMillis: () => Date.now(),
      dateToString: (e) => new Date(e).toString(),
      getYear: (e) => new Date(e).getFullYear(),
      setYear: (e, t) => { const n = new Date(e); n.setFullYear(t); return n.getTime(); },
      getMonth: (e) => new Date(e).getMonth(),
      setMonth: (e, t) => { const n = new Date(e); n.setMonth(t); return n.getTime(); },
      getDate: (e) => new Date(e).getDate(),
      setDate: (e, t) => { const n = new Date(e); n.setDate(t); return n.getTime(); },
      create: (e, t, n, r, o, a) => new Date(e, t, n, r, o, a).getTime(),
      createFromUTC: (e, t, n, r, o, a) => Date.UTC(e, t, n, r, o, a),
    },
    teavmMath: Math,
    teavmConsole: {
      putcharStderr: (e) => { /* handled by runtime */ },
      putcharStdout: (e) => { /* handled by runtime */ },
    },
  };

  const instance = await WebAssembly.instantiate(wasmModule, imports);
  return instance.exports;
}

async function loadClasslib(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return await response.arrayBuffer();
}

async function initializeCompiler() {
  if (compilerInstance) return compilerInstance;

  self.postMessage({ type: "loading", msg: "Loading TeaVM compiler…" });

  // Load runtime JS first
  importScripts(TEAVM_RUNTIME_JS);
  await loadRuntimeJS();

  // Compile and instantiate the compiler WASM
  const wasmModule = await compileWasmModule();
  const exports = await instantiateCompiler(wasmModule);

  self.postMessage({ type: "loading", msg: "Loading Java class libraries…" });

  // Load runtime and compile-time classlibs
  const [runtimeClasslib, compileClasslib] = await Promise.all([
    loadClasslib(TEAVM_RUNTIME_CLASSLIB),
    loadClasslib(TEAVM_COMPILE_CLASSLIB),
  ]);

  // Initialize the TeaVM compiler
  // The compiler expects: runtimeClasslib, compileClasslib, and options
  const compiler = exports.teavmCreateCompiler(runtimeClasslib, compileClasslib, {
    target: "wasm",
    optimizationLevel: 1,
    debugInformationGenerated: false,
    minify: false,
    strict: true,
  });

  if (!compiler) {
    throw new Error("Failed to create TeaVM compiler instance");
  }

  compilerInstance = {
    exports,
    compiler,
    compile: (source, className) => {
      return compiler.compile(source, className);
    },
  };

  self.postMessage({ type: "loading", msg: "TeaVM compiler ready" });
  return compilerInstance;
}

async function initializeRuntime() {
  if (runtimeInitialized) return;

  // The runtime is initialized when we first run compiled code
  // We need to instantiate the runtime WASM with the classlib
  const runtimeResponse = await fetch("/vendor/teavm/runtime.wasm", { cache: "no-cache" });
  if (!runtimeResponse.ok) {
    // Runtime WASM might be embedded in the compiler output
    // For now, we'll compile the user code which includes the runtime
    runtimeInitialized = true;
    return;
  }
  
  const runtimeBytes = await runtimeResponse.arrayBuffer();
  const runtimeImports = {
    "wasm:js-string": {
      fromCharCode: (e) => String.fromCharCode(e),
      fromCharCodeArray: () => { throw new Error("Not supported"); },
      intoCharCodeArray: () => { throw new Error("Not supported"); },
      concat: (e, t) => e + t,
      charCodeAt: (e, t) => e.charCodeAt(t),
      length: (e) => e.length,
      substring: (e, t, n) => e.substring(t, n),
    },
    teavmDate: {
      currentTimeMillis: () => Date.now(),
      dateToString: (e) => new Date(e).toString(),
      getYear: (e) => new Date(e).getFullYear(),
      setYear: (e, t) => { const n = new Date(e); n.setFullYear(t); return n.getTime(); },
      getMonth: (e) => new Date(e).getMonth(),
      setMonth: (e, t) => { const n = new Date(e); n.setMonth(t); return n.getTime(); },
      getDate: (e) => new Date(e).getDate(),
      setDate: (e, t) => { const n = new Date(e); n.setDate(t); return n.getTime(); },
      create: (e, t, n, r, o, a) => new Date(e, t, n, r, o, a).getTime(),
      createFromUTC: (e, t, n, r, o, a) => Date.UTC(e, t, n, r, o, a),
    },
    teavmMath: Math,
    teavmConsole: {
      putcharStderr: (e) => { /* handled by our output capture */ },
      putcharStdout: (e) => { /* handled by our output capture */ },
    },
  };
  
  runtimeWasmModule = await WebAssembly.instantiate(runtimeBytes, runtimeImports);
  runtimeInitialized = true;
}

function extractMainClass(source) {
  // Find the public class with main method
  const mainMatch = source.match(/public\s+class\s+(\w+)\s*\{[\s\S]*?public\s+static\s+void\s+main\s*\(\s*String\s*\[\]\s+\w+\s*\)/);
  if (mainMatch) return mainMatch[1];
  
  // Fallback: find any public class
  const classMatch = source.match(/public\s+class\s+(\w+)/);
  if (classMatch) return classMatch[1];
  
  // Fallback: first class
  const anyClassMatch = source.match(/class\s+(\w+)/);
  if (anyClassMatch) return anyClassMatch[1];
  
  return "Main";
}

async function compileAndRun(source, input, id) {
  const compiler = await initializeCompiler();
  const mainClass = extractMainClass(source);

  self.postMessage({ type: "loading", msg: `Compiling ${mainClass}.java…` });

  let wasmBytes;
  try {
    wasmBytes = compiler.compile(source, mainClass);
  } catch (err) {
    const msg = String(err?.message ?? err);
    self.postMessage({ id, err: -1, msg: `Compilation failed:\n${msg}`, output: "" });
    return;
  }

  if (!wasmBytes || wasmBytes.byteLength === 0) {
    self.postMessage({ id, err: -1, msg: "Compilation produced empty output", output: "" });
    return;
  }

  self.postMessage({ type: "loading", msg: "Preparing runtime…" });

  // Create runtime imports with output capture
  let stdoutBuffer = "";
  let stderrBuffer = "";
  let inputCursor = 0;

  const runtimeImports = {
    "wasm:js-string": {
      fromCharCode: (e) => String.fromCharCode(e),
      fromCharCodeArray: () => { throw new Error("Not supported"); },
      intoCharCodeArray: () => { throw new Error("Not supported"); },
      concat: (e, t) => e + t,
      charCodeAt: (e, t) => e.charCodeAt(t),
      length: (e) => e.length,
      substring: (e, t, n) => e.substring(t, n),
    },
    teavmDate: {
      currentTimeMillis: () => Date.now(),
      dateToString: (e) => new Date(e).toString(),
      getYear: (e) => new Date(e).getFullYear(),
      setYear: (e, t) => { const n = new Date(e); n.setFullYear(t); return n.getTime(); },
      getMonth: (e) => new Date(e).getMonth(),
      setMonth: (e, t) => { const n = new Date(e); n.setMonth(t); return n.getTime(); },
      getDate: (e) => new Date(e).getDate(),
      setDate: (e, t) => { const n = new Date(e); n.setDate(t); return n.getTime(); },
      create: (e, t, n, r, o, a) => new Date(e, t, n, r, o, a).getTime(),
      createFromUTC: (e, t, n, r, o, a) => Date.UTC(e, t, n, r, o, a),
    },
    teavmMath: Math,
    teavmConsole: {
      putcharStderr: (e) => {
        if (e === 10) {
          if (stderrBuffer.length < MAX_OUTPUT_CHARS) {
            self.postMessage({ type: "stdio.write", data: stderrBuffer + "\n" });
          }
          stderrBuffer = "";
        } else {
          stderrBuffer += String.fromCharCode(e);
          if (stderrBuffer.length > MAX_OUTPUT_CHARS) {
            stderrBuffer = stderrBuffer.slice(-MAX_OUTPUT_CHARS);
          }
        }
      },
      putcharStdout: (e) => {
        if (e === 10) {
          if (stdoutBuffer.length < MAX_OUTPUT_CHARS) {
            self.postMessage({ type: "stdio.write", data: stdoutBuffer + "\n" });
          }
          stdoutBuffer = "";
        } else {
          stdoutBuffer += String.fromCharCode(e);
          if (stdoutBuffer.length > MAX_OUTPUT_CHARS) {
            stdoutBuffer = stdoutBuffer.slice(-MAX_OUTPUT_CHARS);
          }
        }
      },
    },
    teavmStdin: {
      readChar: () => {
        if (inputCursor >= input.length) return -1;
        return input.charCodeAt(inputCursor++);
      },
      readLine: () => {
        if (inputCursor >= input.length) return null;
        const rest = input.slice(inputCursor);
        const nl = rest.indexOf("\n");
        if (nl >= 0) {
          inputCursor += nl + 1;
          return rest.slice(0, nl);
        } else {
          inputCursor = input.length;
          return rest;
        }
      },
    },
  };

  self.postMessage({ type: "loading", msg: "Running Java program…" });

  let timedOut = false;
  let finished = false;
  let output = "";

  const watchdog = setTimeout(() => {
    timedOut = true;
    if (!finished) {
      self.postMessage({
        id,
        err: -1,
        msg: "Execution timed out (120s limit)",
        output: stdoutBuffer + stderrBuffer,
      });
    }
  }, MAX_RUN_MS);

  try {
    // Instantiate the compiled WASM
    const module = await WebAssembly.compile(wasmBytes);
    const instance = await WebAssembly.instantiate(module, runtimeImports);

    // Call the main method
    const main = instance.exports["teavm.main"];
    if (typeof main !== "function") {
      throw new Error("Entry point 'teavm.main' not found in compiled module");
    }

    const result = main();
    
    finished = true;
    clearTimeout(watchdog);
    
    if (timedOut) return;

    // Flush any remaining output
    if (stdoutBuffer) {
      self.postMessage({ type: "stdio.write", data: stdoutBuffer });
      output += stdoutBuffer;
    }
    if (stderrBuffer) {
      self.postMessage({ type: "stdio.write", data: stderrBuffer });
      output += stderrBuffer;
    }

    self.postMessage({ id, err: 0, output });
  } catch (err) {
    finished = true;
    clearTimeout(watchdog);
    if (timedOut) return;

    const msg = String(err?.message ?? err);
    self.postMessage({ id, err: -1, msg: `Runtime error:\n${msg}`, output: stdoutBuffer + stderrBuffer });
  }
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
    await compileAndRun(code, input, id);
  } catch (err) {
    const msg = String(err?.message ?? err);
    self.postMessage({ id, err: -1, msg, output: "" });
  }
};