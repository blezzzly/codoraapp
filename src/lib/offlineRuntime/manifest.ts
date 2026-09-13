import { GENERATED_OFFLINE_MANIFEST } from "./generated-manifest";

export type EngineId = "cpp" | "python" | "java";

export interface RuntimeAsset {
  url: string;
  size: number;
  sha256: string | null;
}

export interface EngineDescriptor {
  id: EngineId;
  label: string;
  version: string;
  bundledWithApp: boolean;
  installable: boolean;
  assets: RuntimeAsset[];
  totalBytes: number;
}

export interface OfflineManifest {
  version: number;
  engines: Record<EngineId, EngineDescriptor>;
}

/**
 * The build-time manifest: sizes and SHA-256 of every vendor asset, computed
 * from the actual files on disk (scripts/generate-offline-manifest.mjs) and
 * bundled into the client. Numbers here are never hardcoded guesswork.
 */
export const OFFLINE_MANIFEST: OfflineManifest = GENERATED_OFFLINE_MANIFEST as OfflineManifest;

export const OFFLINE_MANIFEST_VERSION: number = OFFLINE_MANIFEST.version;

export function allEngines(): EngineDescriptor[] {
  return (Object.keys(OFFLINE_MANIFEST.engines) as EngineId[]).map((id) => ({
    ...OFFLINE_MANIFEST.engines[id],
    id,
  }));
}

export function getEngine(id: EngineId): EngineDescriptor {
  return { ...OFFLINE_MANIFEST.engines[id], id };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "? MB";
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${Math.round(bytes)} B`;
}

export function formatSpeed(bps: number): string {
  if (!Number.isFinite(bps) || bps <= 0) return "—";
  if (bps >= 1048576) return `${(bps / 1048576).toFixed(1)} MB/s`;
  return `${Math.round(bps / 1024)} KB/s`;
}

export function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 1) return "—";
  if (seconds < 10) return `${Math.max(1, Math.round(seconds))} seconds`;
  if (seconds < 120) return `${Math.round(seconds)} seconds`;
  return `${Math.round(seconds / 60)} minutes`;
}