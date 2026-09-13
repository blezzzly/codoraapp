// Downloads the free offline runtimes the Codora desktop app needs:
//   - Eclipse JDT compiler (ecj.jar) — a full Java compiler that runs anywhere.
//   - Eclipse Temurin JRE 17 — lets Java run without a JDK installed.
// Everything lands in ./resources (gitignored). g++ is used if present on the
// system, otherwise C++ falls back to the bundled JSCPP interpreter.

import { createWriteStream } from "node:fs";
import { mkdir, rm, access, rename, readdir, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RES = path.join(ROOT, "resources");
const ECJ_JAR = path.join(RES, "ecj", "ecj.jar");
const JRE_DIR = path.join(RES, "jre");
const FORCE = process.argv.includes("--force");

const ECJ_URL = "https://repo1.maven.org/maven2/org/eclipse/jdt/ecj/3.41.0/ecj-3.41.0.jar";

function platform() {
  const osMap = { win32: "windows", darwin: "mac", linux: "linux" };
  const archMap = { x64: "x64", arm64: "aarch64" };
  return {
    os: osMap[process.platform] || "linux",
    arch: archMap[process.arch] || "x64",
  };
}
const JRE_URL = `https://api.adoptium.net/v3/binary/latest/17/ga/${platform().os}/${platform().arch}/jre/hotspot/normal/eclipse?project=jdk`;
const JAVA_EXE = process.platform === "win32" ? "java.exe" : "java";

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function download(url, dest) {
  console.log(`[runtime] downloading ${url}`);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`download failed: ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
  console.log(`[runtime] saved ${dest}`);
}

function extractWith(cmd, args, label) {
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.error || r.status !== 0) {
    throw new Error(`${label} failed: ${r.error?.message || `exit ${r.status}`}`);
  }
}

async function extractZip(zipPath, dest, platformName) {
  await mkdir(dest, { recursive: true });
  if (platformName.startsWith("win")) {
    extractWith("tar", ["-xf", zipPath, "-C", dest], "tar unzip");
  } else if (platformName === "linux") {
    // GNU tar can't open zips; prefer unzip.
    extractWith("unzip", ["-q", zipPath, "-d", dest], "unzip");
  } else {
    extractWith("unzip", ["-q", zipPath, "-d", dest], "unzip");
  }
}

async function findJreRoot() {
  const work = path.join(RES, "jre-work");
  const entries = await readdir(work);
  for (const entry of entries) {
    const p = path.join(work, entry);
    if ((await stat(p)).isDirectory()) {
      const bin = path.join(p, "bin", JAVA_EXE);
      if (await exists(bin)) return p;
    }
  }
  throw new Error("could not locate the unpacked JRE");
}

async function main() {
  await mkdir(RES, { recursive: true });

  const haveEcj = await exists(ECJ_JAR);
  const haveJre = await exists(path.join(JRE_DIR, "bin", JAVA_EXE));

  if (haveEcj && haveJre && !FORCE) {
    console.log("[runtime] offline runtimes already prepared. Use --force to redownload.");
    return;
  }

  if (!haveEcj || FORCE) {
    await mkdir(path.dirname(ECJ_JAR), { recursive: true });
    if (haveEcj) await rm(ECJ_JAR, { force: true });
    await download(ECJ_URL, ECJ_JAR);
  }

  if (!haveJre || FORCE) {
    await rm(JRE_DIR, { recursive: true, force: true });
    await rm(path.join(RES, "jre-work"), { recursive: true, force: true });
    const zip = path.join(RES, "jre-archive.zip");
    await download(JRE_URL, zip);
    await extractZip(zip, path.join(RES, "jre-work"), process.platform);
    const root = await findJreRoot();
    await rename(root, JRE_DIR);
    await rm(path.join(RES, "jre-work"), { recursive: true, force: true });
    await rm(zip, { force: true });
  }

  console.log("[runtime] offline runtimes ready in ./resources");
}

main().catch((err) => {
  console.error("[runtime] failed to prepare offline runtimes:", err.message);
  process.exit(1);
});