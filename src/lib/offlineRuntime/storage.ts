/**
 * Persistent-storage helpers. Runtime files live in Cache Storage
 * (`codora-runtimes-v1`); `navigator.storage.persist()` protects them from
 * automatic eviction where the browser supports it.
 */

export const RUNTIME_CACHE = "codora-runtimes-v1";

/** An abstraction over browser Cache Storage so logic is testable in Node. */
export interface RuntimeStorage {
  put(url: string, blob: Blob): Promise<void>;
  match(url: string): Promise<Blob | null>;
  delete(url: string): Promise<void>;
}

/**
 * Pick a MIME type that browsers actually require for the asset.
 *
 * The runtime cache serves these files straight to Worker/importScripts and
 * WebAssembly compilation, and browsers strictly enforce that script files have
 * a JavaScript MIME type (application/octet-stream makes worker scripts refuse
 * to load — "the offline code engine could not start").
 */
export function contentTypeForUrl(url: string): string {
  if (url.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (url.endsWith(".wasm")) return "application/wasm";
  if (url.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

export class BrowserRuntimeStorage implements RuntimeStorage {
  async open(): Promise<Cache> {
    return caches.open(RUNTIME_CACHE);
  }

  async put(url: string, blob: Blob): Promise<void> {
    const cache = await this.open();
    await cache.put(
      url,
      new Response(blob, { headers: { "Content-Type": contentTypeForUrl(url) } })
    );
  }

  async match(url: string): Promise<Blob | null> {
    const cache = await this.open();
    const res = await cache.match(url);
    return res ? await res.blob() : null;
  }

  async delete(url: string): Promise<void> {
    const cache = await this.open();
    await cache.delete(url);
  }
}

export function runtimeStorage(): RuntimeStorage {
  return new BrowserRuntimeStorage();
}

export interface StorageStatus {
  /** true when the StorageManager has been persisted (or the browser says so). */
  persisted: boolean;
  /** navigator.storage.estimate() quota (bytes), when available. */
  quota?: number;
  /** navigator.storage.estimate() usage (bytes), when available. */
  usage?: number;
}

export async function storageStatus(): Promise<StorageStatus> {
  const out: StorageStatus = { persisted: false };
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.persisted) {
      out.persisted = await navigator.storage.persisted();
    }
  } catch {
    /* ignore */
  }
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      if (est && typeof est.quota === "number") {
        out.quota = est.quota;
        out.usage = typeof est.usage === "number" ? est.usage : 0;
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

/** Ask the browser to grant persistent storage so the runtimes are never swapped. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.persist) {
      return await navigator.storage.persist();
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Bytes currently reachable from existing navigator.storage (for the pre-check). */
export function availableBytes(usage: number | undefined, quota: number | undefined): number | null {
  if (typeof quota !== "number" || typeof usage !== "number") return null;
  return Math.max(0, quota - usage);
}