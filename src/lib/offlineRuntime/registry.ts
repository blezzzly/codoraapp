import { openDB, type IDBPDatabase, type DBSchema } from "idb";
import type { EngineId } from "./manifest";

/**
 * Persistent runtime registry (IndexedDB).
 *
 * This is the source of truth for "is this engine installed?" — not
 * `navigator.onLine`. Records survive PWA restarts. Completed files are
 * tracked per-engine so an interrupted install can resume without re-downloading
 * finished assets.
 */

interface EngineRecord {
  id: EngineId;
  manifestVersion: number;
  version: string | null;
  installed: boolean;
  filesDone: string[];
  installedAt: number | null;
}

interface Prefs {
  cppEngine: "clang" | "jscpp";
  setupDismissed: boolean;
}

interface RegistryDB extends DBSchema {
  engines: { key: EngineId; value: EngineRecord };
  kv: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = "codora-runtime-registry";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<RegistryDB>> | null = null;

function openRegistry(): Promise<IDBPDatabase<RegistryDB>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available"));
  }
  if (!dbPromise) {
    dbPromise = openDB<RegistryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("engines")) {
          db.createObjectStore("engines", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("kv")) {
          db.createObjectStore("kv");
        }
      },
    });
  }
  return dbPromise;
}

async function readKV<T>(key: string): Promise<T | undefined> {
  const db = await openRegistry();
  return db.get("kv", key) as Promise<T | undefined>;
}

async function writeKV(key: string, value: unknown): Promise<void> {
  const db = await openRegistry();
  await db.put("kv", value, key);
}

export async function getEngineRecord(id: EngineId): Promise<EngineRecord | undefined> {
  const db = await openRegistry();
  return db.get("engines", id);
}

export async function setEngineRecord(record: EngineRecord): Promise<void> {
  const db = await openRegistry();
  await db.put("engines", record);
}

export async function getPrefs(): Promise<Prefs> {
  const prefs = await readKV<Prefs>("prefs");
  return prefs ?? { cppEngine: "jscpp", setupDismissed: false };
}

export async function setPref(patch: Partial<Prefs>): Promise<void> {
  const prefs = await getPrefs();
  await writeKV("prefs", { ...prefs, ...patch });
}

export async function getUsedBytes(): Promise<number> {
  const value = await readKV<number>("usedBytes");
  return value ?? 0;
}

export async function setUsedBytes(bytes: number): Promise<void> {
  await writeKV("usedBytes", bytes);
}

export type { EngineRecord };