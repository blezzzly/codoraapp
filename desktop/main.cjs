"use strict";

// Codora desktop shell (Electron).
//
// Serves the already-built Next.js app from a local server and runs all code
// execution on-device, so the compiler + console work 100% offline:
//   - C++ / Python run in the page via bunded engines (JSCPP / Pyodide).
//   - Java is compiled + run with a locally installed JDK (javac / java).
// No cloud judge (Godbolt) and no internet connection are used at all.

const { app, BrowserWindow, ipcMain } = require("electron");
const { spawn, spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const http = require("http");

const ROOT = path.resolve(__dirname, "..");
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
const PORT = Number(process.env.CODORA_PORT || 43210);

let nextProcess = null;
let mainWindow = null;

async function isPortFree(port) {
  return new Promise((resolve) => {
    const srv = http.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port, "127.0.0.1");
  });
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

async function startNextServer() {
  if (!fs.existsSync(NEXT_BIN)) {
    throw new Error(
      "Next.js server not found. Run `npm run build` first, then `npm run desktop`."
    );
  }
  console.log("[codora] starting local app server...");
  nextProcess = spawn(
    process.execPath,
    [NEXT_BIN, "start", "-p", String(PORT), "-H", "127.0.0.1"],
    {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_ENV: "production",
        ELECTRON_RUN_AS_NODE: "1",
      },
    }
  );
  nextProcess.stdout.on("data", (d) => process.stdout.write("[next] " + d));
  nextProcess.stderr.on("data", (d) => process.stderr.write("[next] " + d));
  nextProcess.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error("[codora] local server exited with code", code);
    }
  });

  const ready = await waitForServer(`http://127.0.0.1:${PORT}`, 60000);
  if (!ready) {
    throw new Error("The local app server did not start in time.");
  }
  return PORT;
}

function runCommand(cmd, args, opts, timeoutMs) {
  const { input, ...spawnOpts } = opts;
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, spawnOpts);
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    if (input) child.stdin.write(input);
    child.stdin.end();
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`Execution timed out after ${timeoutMs}ms`));
        return;
      }
      resolve({ code, stdout, stderr });
    });
  });
}

function javaFriendlyError(err) {
  if (err && err.code === "ENOENT") {
    return (
      "Java (JDK) is not installed, and the bundled runtime is missing. " +
      "Run `npm run desktop:start` once so Codora downloads its free offline Java runtime."
    );
  }
  return String((err && err.message) || err);
}

function hasCommand(cmd) {
  const r = spawnSync(cmd, ["--version"], { stdio: "ignore", timeout: 8000 });
  return !r.error;
}

function javaToolchain() {
  const jreJava =
    process.platform === "win32"
      ? path.join(ROOT, "resources", "jre", "bin", "java.exe")
      : path.join(ROOT, "resources", "jre", "bin", "java");
  const ecjJar = path.join(ROOT, "resources", "ecj", "ecj.jar");
  if (fs.existsSync(jreJava) && fs.existsSync(ecjJar)) {
    return { bundled: true, java: jreJava, ecjJar };
  }
  return { bundled: false, java: "java", javac: "javac" };
}

async function runCpp(code, input) {
  if (!hasCommand("g++")) {
    // The front-end falls back to the bundled JSCPP interpreter when this comes
    // back with engine "unsupported".
    return {
      output: "",
      success: false,
      error: "No g++ compiler found on this computer; the light C++ interpreter is used instead.",
      engine: "unsupported",
    };
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codora-cpp-"));
  try {
    fs.writeFileSync(path.join(dir, "Main.cpp"), String(code || ""));

    const compileResult = await runCommand(
      "g++",
      ["-std=c++17", "-O2", "Main.cpp", "-o", "prog"],
      { cwd: dir },
      25000
    ).catch((err) => ({
      code: 1,
      stdout: "",
      stderr: javaFriendlyError(err),
    }));

    if (compileResult.code !== 0) {
      return {
        output: "",
        success: false,
        error: (compileResult.stderr || "Compilation failed").trim(),
        engine: "local",
      };
    }

    const exe = process.platform === "win32" ? path.join(dir, "prog.exe") : path.join(dir, "prog");
    const runResult = await runCommand(exe, [], { cwd: dir, input }, 8000).catch((err) => ({
      code: 1,
      stdout: "",
      stderr: String((err && err.message) || err),
    }));

    if (runResult.code !== 0) {
      const stderr = runResult.stderr.trim();
      return {
        output: stderr || `Process exited with code ${runResult.code}`,
        success: false,
        error: stderr || `Process exited with code ${runResult.code}`,
        engine: "local",
      };
    }
    return { output: runResult.stdout || "(no output)", success: true, engine: "local" };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function runJava(code, input) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codora-java-"));
  try {
    // Mirror the web behaviour: `public class Main` is normalised to `class Main`.
    const source = String(code).replace(/\bpublic\s+class\b/g, "class");
    fs.writeFileSync(path.join(dir, "Main.java"), source);

    const tc = javaToolchain();
    let compileCmd, compileArgs;
    if (tc.bundled) {
      compileCmd = tc.java;
      compileArgs = [
        "-jar",
        tc.ecjJar,
        "-d",
        dir,
        "-source",
        "17",
        "-target",
        "17",
        "-proc:none",
        path.join(dir, "Main.java"),
      ];
    } else {
      compileCmd = tc.javac || "javac";
      compileArgs = ["Main.java"];
    }

    let compileResult;
    try {
      compileResult = await runCommand(compileCmd, compileArgs, { cwd: dir }, 30000);
    } catch (err) {
      return {
        output: "",
        success: false,
        error: javaFriendlyError(err),
        engine: "local",
      };
    }

    if (compileResult.code !== 0) {
      // ecj prints warning noise (obsolete source/target) on success too; on
      // failure only the error block matters.
      const errText = (compileResult.stderr || "Compilation failed").trim();
      return {
        output: "",
        success: false,
        error: errText || "Compilation failed",
        engine: "local",
      };
    }

    const runCmd = tc.bundled ? tc.java : tc.java;
    const runResult = await runCommand(runCmd, ["-cp", dir, "Main"], { cwd: dir, input }, 10000).catch(
      (err) => ({
        code: -1,
        stdout: "",
        stderr: javaFriendlyError(err),
      })
    );

    if (runResult.code !== 0) {
      const stderr = runResult.stderr.trim();
      return {
        output: stderr || `Process exited with code ${runResult.code}`,
        success: false,
        error: stderr || `Process exited with code ${runResult.code}`,
        engine: "local",
      };
    }
    return {
      output: runResult.stdout || "(no output)",
      success: true,
      engine: "local",
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

ipcMain.handle("java:run", (_event, payload) => {
  return runJava(payload?.code ?? "", payload?.input ?? "");
});

ipcMain.handle("cpp:run", (_event, payload) => {
  return runCpp(payload?.code ?? "", payload?.input ?? "");
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#1d1628",
    autoHideMenuBar: true,
    icon: path.join(ROOT, "public", "codoralogo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
  if (process.env.CODORA_DEVTOOLS === "1") {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    if (!(await isPortFree(PORT))) {
      throw new Error(`Port ${PORT} is already in use. Set CODORA_PORT to a free port and try again.`);
    }
    const usedPort = await startNextServer();
    createWindow(usedPort);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(usedPort);
    });
  } catch (err) {
    console.error("[codora] failed to start:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill();
  }
});