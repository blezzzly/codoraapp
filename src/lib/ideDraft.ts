import { LANGUAGES, LanguageId } from "@/lib/languages";

export interface SavedProgram {
  id: string;
  name: string;
  code: string;
  language: LanguageId;
  updatedAt: number;
}

const SAVED_KEY = "codora_ide_saved";

function langDraftKey(language: string): string {
  return `codora_ide_draft_${language}`;
}

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getDraft(language: string = "cpp"): string {
  if (!language || !(language in LANGUAGES)) {
    language = "cpp";
  }
  const perLang = safeGet<string>(langDraftKey(language), "");
  if (perLang) return perLang;
  return LANGUAGES[language as LanguageId]?.template ?? "";
}

export function setDraft(code: string, language: string = "cpp"): void {
  if (!language || !(language in LANGUAGES)) {
    language = "cpp";
  }
  safeSet(langDraftKey(language), code);
}

export function hasDraftFor(language: string = "cpp"): boolean {
  return safeGet<string>(langDraftKey(language), "") !== "";
}

export function resetDraft(language: string = "cpp"): void {
  safeSet(langDraftKey(language), LANGUAGES[language as LanguageId]?.template ?? "");
}

// ---------------- Per-problem drafts (practice) ----------------

function problemDraftKey(problemId: string, language: string): string {
  return `${langDraftKey(language)}_p_${problemId}`;
}

export function hasProblemDraft(problemId: string, language: string): boolean {
  return safeGet<string>(problemDraftKey(problemId, language), "") !== "";
}

export function getProblemDraft(problemId: string, language: string): string {
  return safeGet<string>(problemDraftKey(problemId, language), "");
}

export function setProblemDraft(problemId: string, language: string, code: string): void {
  safeSet(problemDraftKey(problemId, language), code);
}

export function clearProblemDraft(problemId: string, language: string): void {
  safeSet(problemDraftKey(problemId, language), "");
}

export function getSavedPrograms(): SavedProgram[] {
  const list = safeGet<SavedProgram[]>(SAVED_KEY, []);
  if (!Array.isArray(list)) return [];
  return list
    .filter(
      (p) =>
        p &&
        typeof p === "object" &&
        typeof p.id === "string" &&
        typeof p.name === "string" &&
        typeof p.code === "string"
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      language: p.language && p.language in LANGUAGES ? p.language : "cpp",
      updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : Date.now(),
    }));
}

export function saveProgram(
  name: string,
  code: string,
  language: string = "cpp"
): SavedProgram[] {
  const programs = getSavedPrograms();
  const uid: LanguageId = language in LANGUAGES ? (language as LanguageId) : "cpp";
  const existing = programs.find(
    (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase() && p.language === uid
  );
  const item: SavedProgram = {
    id: existing?.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || (uid === "cpp" ? "My program" : `${LANGUAGES[uid].label} program`),
    code,
    language: uid,
    updatedAt: Date.now(),
  };
  const next = existing
    ? programs.map((p) => (p.id === item.id ? item : p))
    : [...programs, item];
  safeSet(SAVED_KEY, next);
  return next;
}

export function renameProgram(id: string, name: string): SavedProgram[] {
  const next = getSavedPrograms().map((p) =>
    p.id === id ? { ...p, name: name.trim() || p.name } : p
  );
  safeSet(SAVED_KEY, next);
  return next;
}

export function deleteProgram(id: string): SavedProgram[] {
  const next = getSavedPrograms().filter((p) => p.id !== id);
  safeSet(SAVED_KEY, next);
  return next;
}