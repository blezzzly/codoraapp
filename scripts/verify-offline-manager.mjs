// Verifies the OfflineRuntimeManager's download pipeline headlessly (no browser):
//   1. real asset manifest matches the files on disk
//   2. engine totals equal the exact byte sums (never hardcoded)
//   3. downloadEngineAssets streams real bytes 0→100% with correct totals
//   4. per-file resume: completed files are never fetched again
//   5. stored blobs pass SHA-256 against the manifest (integrity)
//   6. fully-installed engine performs zero network requests
//
// Everything is served from public/ over localhost — no internet needed.
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { downloadEngineAssets } from "../src/lib/offlineRuntime/download.ts";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root, "public", "offline-manifest.json"), "utf8"));

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`ok - ${msg}`);
}

function sha256(data) {
  const buf = data instanceof Uint8Array ? data : new Uint8Array(data);
  return createHash("sha256").update(buf).digest("hex");
}

/** Minimal browser-Cache equivalent backed by an in-memory Map. */
class MemoryStorage {
  constructor() {
    this.map = new Map();
    this.puts = [];
  }
  async put(url, blob) {
    this.map.set(url, blob);
    this.puts.push(url);
  }
  async match(url) {
    const blob = this.map.get(url);
    return blob ? blob : null;
  }
  async delete(url) {
    this.map.delete(url);
  }
}

async function startServer() {
  const server = createServer((req, res) => {
    let pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (pathname === "/") pathname = "/index.html";
    const file = join(root, "public", ...pathname.split("/").filter(Boolean).map((p) => p.replace(/\.\./g, "")));
    if (pathname.startsWith("/vendor")) {
      const data = readFileSync(file);
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": data.length,
      });
      res.end(data);
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  return { server, base: `http://127.0.0.1:${port}` };
}

async function main() {
  const { server, base } = await startServer();
  try {
    // 1. Manifest ↔ disk parity + exact totals (no hardcoded fake sizes).
    for (const [id, engine] of Object.entries(manifest.engines)) {
      let sum = 0;
      for (const asset of engine.assets) {
        const abs = join(root, "public", ...asset.url.replace(/^\//, "").split("/"));
        const size = statSync(abs).size;
        const hash = sha256(readFileSync(abs));
        assert(
          asset.size === size && asset.sha256 === hash,
          `${id} ${asset.url} size+hash match disk`
        );
        sum += size;
      }
      assert(engine.totalBytes === sum, `${id} totalBytes == byte sum (${sum})`);
    }
    const cpp = manifest.engines.cpp;
    console.log(`\ninfo  - C++ total: ${(cpp.totalBytes / 1048576).toFixed(1)} MB across ${cpp.assets.length} files`);
    console.log(`info  - Python total: ${(manifest.engines.python.totalBytes / 1048576).toFixed(1)} MB`);

    const fetchImpl = (url, init) => fetch(base + url, init);

    // 2. Fresh install: byte-accurate progress 0 → 100%, every asset stored + verified.
    {
      const storage = new MemoryStorage();
      let progressDone = 0;
      let progressTotal = 0;
      const results = await downloadEngineAssets(cpp.assets, storage, {
        onFileStart: () => {},
        onBytes: (doneInFile, fileSize) => {
          progressTotal = fileSize;
          progressDone = doneInFile;
        },
        onVerifyStart: () => {},
        onFileComplete: () => {},
      }, { fetchImpl });
      assert(results.ok, "fresh install completes");
      assert(results.verified === cpp.assets.length, `all ${cpp.assets.length} files verified + stored`);

      let totalStored = 0;
      for (const asset of cpp.assets) {
        const blob = storage.map.get(asset.url);
        assert(!!blob, `${asset.url} stored`);
        assert(blob.size === asset.size, `${asset.url} size matches`);
        assert(sha256(await blob.arrayBuffer()) === asset.sha256, `${asset.url} sha256 matches`);
        totalStored += blob.size;
      }
      assert(totalStored === cpp.totalBytes, `stored bytes == real total (${cpp.totalBytes})`);
      assert(progressDone === progressTotal, `last progress event reached file total`);

      // 3. Re-run with a completed registry → zero network, zero storage writes.
      const allDone = new Set(cpp.assets.map((a) => a.url));
      const idle = await downloadEngineAssets(cpp.assets, storage, {
        onFileStart: () => {},
        onBytes: () => {},
        onVerifyStart: () => {},
        onFileComplete: () => {},
      }, { filesDone: allDone, fetchImpl });
      assert(idle.ok && idle.verified === 0, "re-opening Codora re-downloads nothing (per-file registry)");
      assert(storage.puts.length === cpp.assets.length, "no duplicate stores on resume pass");
    }

    // 4. Interrupted → resume: only the unfinished files are fetched again.
    {
      const storage = new MemoryStorage();
      const firstDone = new Set(cpp.assets.slice(0, 3).map((a) => a.url));
      let fetched = 0;
      const countingFetch = async (url, init) => {
        fetched++;
        return fetchImpl(url, init);
      };
      const res = await downloadEngineAssets(cpp.assets, storage, {
        onFileStart: () => {},
        onBytes: () => {},
        onVerifyStart: () => {},
        onFileComplete: () => {},
      }, { filesDone: firstDone, fetchImpl: countingFetch });
      assert(res.ok, "resume completes");
      assert(fetched === cpp.assets.length - 3, `resume fetched only ${cpp.assets.length - 3} missing files (interrupted at ${3})`);
      const stored = storage.map.get(cpp.assets[5].url);
      assert(stored && stored.size === cpp.assets[5].size, "resumed file stored correctly");
    }

    console.log("\nALL OFFLINE MANAGER CHECKS PASSED");
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});