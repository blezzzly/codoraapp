import type { RuntimeAsset } from "./manifest";
import type { RuntimeStorage } from "./storage";

export interface DownloadCallbacks {
  onFileStart: (url: string, size: number) => void;
  /** Scoped to the current file: (downloadedWithinFile, fileSize). */
  onBytes: (doneInFile: number, fileSize: number, url: string) => void;
  onVerifyStart: (url: string) => void;
  /** Persisted bookkeeping after the file is stored and verified. */
  onFileComplete: (url: string) => void | Promise<void>;
}

export interface DownloadOptions {
  /** URLs already integrity-complete; skipped without a network request. */
  filesDone?: Set<string>;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

export interface DownloadResult {
  ok: boolean;
  error?: string;
  stoppedAtUrl?: string;
  verified: number;
}

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Stream a runtime's assets into persistent storage (never the Downloads
 * folder), verifying each file's SHA-256 against the build-time manifest
 * before it is stored. Files already completed are skipped (per-file resume).
 */
export async function downloadEngineAssets(
  assets: RuntimeAsset[],
  storage: RuntimeStorage,
  callbacks: DownloadCallbacks,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const { signal } = options;
  const fetchImpl = options.fetchImpl ?? fetch;
  const filesDone = options.filesDone ?? new Set<string>();
  let verified = 0;

  for (const asset of assets) {
    if (filesDone.has(asset.url)) continue;
    if (signal?.aborted) {
      return { ok: false, stoppedAtUrl: asset.url, verified, error: "Interrupted" };
    }

    callbacks.onFileStart(asset.url, asset.size);

    let response: Response;
    try {
      response = await fetchImpl(asset.url, { cache: "no-cache", signal });
    } catch {
      return {
        ok: false,
        stoppedAtUrl: asset.url,
        verified,
        error: `Could not download ${asset.url}`,
      };
    }
    if (!response.ok || !response.body) {
      return {
        ok: false,
        stoppedAtUrl: asset.url,
        verified,
        error: `Server error while downloading ${asset.url}`,
      };
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let doneInFile = 0;
    for (;;) {
      if (signal?.aborted) {
        await reader.cancel().catch(() => {});
        return { ok: false, stoppedAtUrl: asset.url, verified, error: "Interrupted" };
      }
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      doneInFile += value.length;
      callbacks.onBytes(doneInFile, asset.size, asset.url);
    }

    // Integrity check against the manifest hash BEFORE anything is stored.
    callbacks.onVerifyStart(asset.url);
    const blob = new Blob(chunks as unknown as BlobPart[]);
    if (asset.sha256) {
      const actual = await sha256Hex(await blob.arrayBuffer());
      if (actual !== asset.sha256) {
        return {
          ok: false,
          stoppedAtUrl: asset.url,
          verified,
          error: `Verification failed for ${asset.url}: the downloaded file is corrupted.`,
        };
      }
    }

    try {
      await storage.put(asset.url, blob);
    } catch {
      return {
        ok: false,
        stoppedAtUrl: asset.url,
        verified,
        error: `Could not store ${asset.url} in persistent browser storage.`,
      };
    }

    await callbacks.onFileComplete(asset.url);
    verified++;
  }

  return { ok: true, verified };
}