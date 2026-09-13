import {
  allEngines,
  getEngine,
  formatBytes,
  OFFLINE_MANIFEST_VERSION,
  type EngineDescriptor,
  type EngineId,
} from "./manifest";
import {
  availableBytes,
  runtimeStorage,
  requestPersistentStorage,
  storageStatus,
  type RuntimeStorage,
} from "./storage";
import {
  getEngineRecord,
  getUsedBytes,
  getPrefs,
  setEngineRecord,
  setPref,
  setUsedBytes,
  type EngineRecord,
} from "./registry";
import { downloadEngineAssets } from "./download";

export interface EngineInstallState {
  id: EngineId;
  label: string;
  version: string;
  installed: boolean;
  /** Some files present but engine not yet usable (resume possible). */
  partial: boolean;
  installedBytes: number;
  totalBytes: number;
  percent: number;
  stale: boolean;
  installable: boolean;
  bundledWithApp: boolean;
}

export type RuntimeInstallPhase = "downloading" | "verifying" | "ready" | "interrupted" | "error";

export interface InstallProgress {
  phase: RuntimeInstallPhase;
  engineId: EngineId | null;
  engineDownloadedBytes: number;
  engineTotalBytes: number;
  overallDownloadedBytes: number;
  overallTotalBytes: number;
  overallPercent: number;
  fileUrl?: string;
  fileName?: string;
  speedBytesPerSec?: number;
  etaSeconds?: number;
  ok?: boolean;
  error?: string;
}

export interface InstallOutcome {
  ok: boolean;
  canceled?: boolean;
  error?: string;
  errorKind?: "storage" | "network" | "verify" | "unknown";
}

export interface RuntimeSnapshot {
  persisted: boolean;
  quota?: number;
  usage?: number;
  runtimeUsedBytes: number;
  bundledUsedBytes: number;
  available: number | null;
}

export interface VerifyOutcome {
  ok: boolean;
  mismatches: string[];
}

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function filesDoneBytes(filesDone: Set<string>, desc: EngineDescriptor): number {
  return desc.assets
    .filter((a) => filesDone.has(a.url))
    .reduce((sum, a) => sum + a.size, 0);
}

class OfflineRuntimeManager {
  private readonly storage: RuntimeStorage;
  private bundledRegistered = false;

  constructor(storage: RuntimeStorage = runtimeStorage()) {
    this.storage = storage;
  }

  descriptors(): EngineDescriptor[] {
    return allEngines();
  }

  async ensureBundledRegistered(): Promise<void> {
    if (this.bundledRegistered) return;
    this.bundledRegistered = true;
    for (const desc of allEngines()) {
      if (!desc.bundledWithApp) continue;
      const existing = await getEngineRecord(desc.id);
      if (!existing) {
        await setEngineRecord({
          id: desc.id,
          manifestVersion: OFFLINE_MANIFEST_VERSION,
          version: desc.version,
          installed: true,
          filesDone: desc.assets.map((a) => a.url),
          installedAt: Date.now(),
        });
      }
    }
  }

  async engineState(id: EngineId): Promise<EngineInstallState> {
    const desc = getEngine(id);
    const record = await getEngineRecord(id);
    const filesDone = new Set(record?.filesDone ?? []);
    const installedBytes = desc.assets
      .filter((a) => filesDone.has(a.url))
      .reduce((sum, a) => sum + a.size, 0);
    const complete = desc.assets.every((a) => filesDone.has(a.url));
    return {
      id,
      label: desc.label,
      version: record?.version ?? desc.version,
      installed: !!record?.installed && complete,
      partial: filesDone.size > 0 && !(record?.installed && complete),
      installedBytes,
      totalBytes: desc.totalBytes,
      percent: desc.totalBytes ? Math.round((installedBytes / desc.totalBytes) * 100) : 0,
      stale: !!record && record.manifestVersion < OFFLINE_MANIFEST_VERSION,
      installable: desc.installable,
      bundledWithApp: desc.bundledWithApp,
    };
  }

  async snapshot(): Promise<RuntimeSnapshot> {
    const estimate = await storageStatus();
    const runtimeUsed = await getUsedBytes();
    const bundled = allEngines()
      .filter((e) => e.bundledWithApp)
      .reduce((sum, e) => sum + e.totalBytes, 0);
    let persisted = estimate.persisted;
    if (!persisted) {
      persisted = await requestPersistentStorage();
    }
    return {
      persisted,
      quota: estimate.quota,
      usage: estimate.usage,
      runtimeUsedBytes: runtimeUsed,
      bundledUsedBytes: bundled,
      available: availableBytes(estimate.usage, estimate.quota),
    };
  }

  async requestPersistence(): Promise<boolean> {
    return requestPersistentStorage();
  }

  /**
   * Install the given engines into persistent browser storage. Skips anything
   * already present (per engine and per file) so nothing is re-downloaded.
   * Progress events reflect actual bytes read from the network.
   */
  async install(
    engineIds: EngineId[],
    onProgress: (p: InstallProgress) => void,
    opts?: { signal?: AbortSignal; fetchImpl?: typeof fetch }
  ): Promise<InstallOutcome> {
    await this.ensureBundledRegistered();
    const signal = opts?.signal;

    const states: EngineInstallState[] = [];
    for (const id of engineIds) {
      if (!getEngine(id).installable) continue;
      states.push(await this.engineState(id));
    }
    const toInstall = states.filter((s) => !s.installed);
    if (toInstall.length === 0) {
      onProgress({ phase: "ready", engineId: null, engineDownloadedBytes: 0, engineTotalBytes: 0, overallDownloadedBytes: 1, overallTotalBytes: 1, overallPercent: 100, ok: true });
      return { ok: true };
    }

    const overallTotal = toInstall.reduce((sum, s) => sum + s.totalBytes, 0);
    const overallInitial = toInstall.reduce((sum, s) => sum + s.installedBytes, 0);
    let finishedBefore = 0; // bytes completed by engines finished during this run

    // Refuse a clearly-impossible install before downloading anything.
    const snapshot = await this.snapshot();
    const remaining = overallTotal - overallInitial;
    if (snapshot.available !== null && remaining > snapshot.available) {
      return {
        ok: false,
        errorKind: "storage",
        error: `Not enough browser storage. Codora needs ${formatBytes(remaining)}; only ${formatBytes(snapshot.available)} is available. Free up space and try again.`,
      };
    }

    for (const st of toInstall) {
      const desc = getEngine(st.id);
      const record = (await getEngineRecord(st.id)) as EngineRecord | undefined;
      const filesDone = new Set(record?.filesDone ?? []);
      const engineStartAt = filesDoneBytes(filesDone, desc);

      let engineCompleted = engineStartAt; // grows as files finish
      let currentFileDone = 0; // bytes read from the in-flight file
      let rate = 0;
      let lastSample: { at: number; bytes: number } | null = null;
      let lastEmitAt = 0;

      const engineDoneNow = () => engineCompleted + currentFileDone;
      const emit = (
        phase: RuntimeInstallPhase,
        fileUrl?: string,
        ok?: boolean,
        error?: string
      ) => {
        const overallDone = overallInitial + finishedBefore + (engineDoneNow() - engineStartAt);
        onProgress({
          phase,
          engineId: st.id,
          engineDownloadedBytes: engineDoneNow(),
          engineTotalBytes: desc.totalBytes,
          overallDownloadedBytes: overallDone,
          overallTotalBytes: overallTotal,
          overallPercent: overallTotal ? (overallDone / overallTotal) * 100 : 0,
          fileUrl,
          fileName: fileUrl?.split("/").pop(),
          speedBytesPerSec: rate,
          etaSeconds:
            rate > 0 ? Math.max(0, (desc.totalBytes - engineDoneNow()) / rate) : undefined,
          ok,
          error,
        });
      };
      const throttledEmit = (phase: RuntimeInstallPhase, fileUrl?: string) => {
        const t = Date.now();
        if (t - lastEmitAt < 120) return;
        lastEmitAt = t;
        emit(phase, fileUrl);
      };

      const result = await downloadEngineAssets(desc.assets, this.storage, {
        onFileStart: (url) => {
          currentFileDone = 0;
          rate = 0;
          lastSample = null;
          emit("downloading", url);
        },
        onBytes: (doneInFile, _fileSize, fileUrl) => {
          currentFileDone = doneInFile;
          const t = Date.now();
          if (lastSample) {
            const dt = (t - lastSample.at) / 1000;
            const dbytes = doneInFile - lastSample.bytes;
            if (dt > 0 && dbytes > 0) {
              const inst = dbytes / dt;
              rate = rate === 0 ? inst : rate * 0.6 + inst * 0.4;
            }
          }
          lastSample = { at: t, bytes: doneInFile };
          throttledEmit("downloading", fileUrl);
        },
        onVerifyStart: (url) => emit("verifying", url),
        onFileComplete: async (url) => {
          const size = desc.assets.find((a) => a.url === url)!.size;
          filesDone.add(url);
          engineCompleted += size;
          currentFileDone = 0;
          lastSample = null;
          await setUsedBytes((await getUsedBytes()) + size);
          await setEngineRecord({
            id: st.id,
            manifestVersion: OFFLINE_MANIFEST_VERSION,
            version: desc.version,
            installed: false,
            filesDone: [...filesDone],
            installedAt: null,
          });
          emit("downloading", url);
        },
      }, { filesDone, signal, fetchImpl: opts?.fetchImpl });

      if (signal?.aborted) {
        return {
          ok: false,
          canceled: true,
          errorKind: "network",
          error: "Installation was interrupted. Your progress is saved — tap Resume to continue.",
        };
      }
      if (!result.ok) {
        const err = (result.error ?? "").toLowerCase();
        return {
          ok: false,
          canceled: false,
          errorKind: err.includes("verification")
            ? "verify"
            : err.includes("storage")
              ? "storage"
              : "network",
          error: result.error,
        };
      }

      await setEngineRecord({
        id: st.id,
        manifestVersion: OFFLINE_MANIFEST_VERSION,
        version: desc.version,
        installed: true,
        filesDone: desc.assets.map((a) => a.url),
        installedAt: Date.now(),
      });
      await this.onEngineInstalled(st.id);
      finishedBefore += desc.totalBytes - engineStartAt;
      engineCompleted = desc.totalBytes;
      emit("ready", undefined, true);
    }

    onProgress({
      phase: "ready",
      engineId: null,
      engineDownloadedBytes: 0,
      engineTotalBytes: 0,
      overallDownloadedBytes: overallTotal,
      overallTotalBytes: overallTotal,
      overallPercent: 100,
      ok: true,
    });
    return { ok: true };
  }

  /** Verify every stored asset of an engine against the manifest hashes. */
  async verify(id: EngineId): Promise<VerifyOutcome> {
    const desc = getEngine(id);
    const mismatches: string[] = [];
    for (const asset of desc.assets) {
      try {
        const blob = await this.storage.match(asset.url);
        if (!blob) {
          mismatches.push(asset.url);
          continue;
        }
        if (!asset.sha256) continue;
        const actual = await sha256Hex(await blob.arrayBuffer());
        if (actual !== asset.sha256) mismatches.push(asset.url);
      } catch {
        mismatches.push(asset.url);
      }
    }
    return { ok: mismatches.length === 0, mismatches };
  }

  /**
   * Re-download only the corrupt/missing files of an engine (repair). Deletes
   * the bad assets, keeps the good ones, then resumes the install.
   */
  async repair(
    id: EngineId,
    onProgress: (p: InstallProgress) => void,
    opts?: { signal?: AbortSignal; fetchImpl?: typeof fetch }
  ): Promise<InstallOutcome> {
    const desc = getEngine(id);
    const outcome = await this.verify(id);
    if (outcome.ok) {
      onProgress(this.done());
      return { ok: true };
    }
    const bad = new Set(outcome.mismatches);
    for (const asset of desc.assets) {
      if (bad.has(asset.url)) await this.storage.delete(asset.url);
    }
    const goodFiles = desc.assets
      .filter((a) => !bad.has(a.url))
      .map((a) => a.url);
    const goodBytes = desc.assets
      .filter((a) => goodFiles.includes(a.url))
      .reduce((sum, a) => sum + a.size, 0);
    await setEngineRecord({
      id,
      manifestVersion: OFFLINE_MANIFEST_VERSION,
      version: desc.version,
      installed: false,
      filesDone: goodFiles,
      installedAt: null,
    });
    await setUsedBytes(goodBytes);
    return this.install([id], onProgress, opts);
  }

  async remove(id: EngineId): Promise<void> {
    const desc = getEngine(id);
    const record = await getEngineRecord(id);
    const done = new Set(record?.filesDone ?? []);
    let removed = 0;
    for (const asset of desc.assets) {
      await this.storage.delete(asset.url);
      if (done.has(asset.url)) removed += asset.size;
    }
    await setEngineRecord({
      id,
      manifestVersion: OFFLINE_MANIFEST_VERSION,
      version: null,
      installed: false,
      filesDone: [],
      installedAt: null,
    });
    await setUsedBytes(Math.max(0, (await getUsedBytes()) - removed));
    if (id === "cpp") {
      const prefs = await getPrefs();
      await setPref({ ...prefs, cppEngine: "jscpp" });
    }
  }

  async checkForUpdates(): Promise<EngineId[]> {
    const stale: EngineId[] = [];
    for (const desc of allEngines()) {
      if (!desc.installable) continue;
      const record = await getEngineRecord(desc.id);
      if (!record) continue;
      if (record.manifestVersion < OFFLINE_MANIFEST_VERSION) stale.push(desc.id);
      const have = new Set(record.filesDone ?? []);
      if (!desc.assets.every((a) => have.has(a.url))) stale.push(desc.id);
    }
    return stale;
  }

  private async onEngineInstalled(id: EngineId): Promise<void> {
    if (id === "cpp") {
      const prefs = await getPrefs();
      await setPref({ ...prefs, cppEngine: "clang" });
    }
  }

  private done(): InstallProgress {
    return {
      phase: "ready",
      engineId: null,
      engineDownloadedBytes: 0,
      engineTotalBytes: 0,
      overallDownloadedBytes: 1,
      overallTotalBytes: 1,
      overallPercent: 100,
      ok: true,
    };
  }
}

export const offlineRuntime = new OfflineRuntimeManager();