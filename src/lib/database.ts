import type { Achievement, StudentProgress, UserProfile } from "@/types";
import { getDayKey } from "@/lib/utils";

// Lightweight localStorage-based database for the offline-first PWA.
// - Schema versioned so future migrations can run safely.
// - Every read is defensive: corrupted/missing/old values never crash the app.

export const DATA_VERSION = 2;

const STORAGE_KEYS = {
  VERSION: "codora_data_version",
  USER: "codora_user_profile",
  PROGRESS: "codora_progress",
  ACHIEVEMENTS: "codora_achievements",
  ACTIVITY: "codora_activity",
  SUBMISSIONS: "codora_submissions",
  NOTES: "codora_notes",
  BOOKMARKS: "codora_bookmarks",
  ONBOARDING: "codora_onboarding_completed",
  LANGUAGE: "codora_selected_language",
  SAVED_PROGRAMS: "codora_ide_saved",
  CHALLENGES_SOLVED: "codora_challenges_solved",
} as const;

export const CODORA_PREFIX = "codora_";

export function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === undefined) return fallback;
    const parsed = JSON.parse(item);
    return parsed === undefined || parsed === null ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

export function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — like a normal state-saving failure.
  }
}

export function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

interface PersistableProfile
  extends Omit<UserProfile, "lastActiveDay"> {
  lastActive?: number;
  lastActiveDay?: string;
  id?: string;
  dailyGoalCompleted?: boolean;
}

export function migrateProfile(raw: unknown): UserProfile {
  const fallbackDay = getDayKey();
  const base: UserProfile = {
    username: "Learner",
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDay: fallbackDay,
    joinedAt: Date.now(),
    totalProblemsSolved: 0,
    totalSubmissions: 0,
    dailyGoal: 5,
  };

  if (!raw || typeof raw !== "object") return base;

  const p = raw as PersistableProfile;
  const numeric = (v: unknown, fb: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fb;

  return {
    username:
      typeof p.username === "string" && p.username.trim()
        ? p.username.trim()
        : base.username,
    xp: Math.max(0, numeric(p.xp, 0)),
    level: Math.max(1, numeric(p.level, getLevelFromXp(numeric(p.xp, 0)))),
    streak: Math.max(0, numeric(p.streak, 0)),
    lastActiveDay:
      typeof p.lastActiveDay === "string" && p.lastActiveDay.length === 10
        ? p.lastActiveDay
        : getDayKey(numeric(p.lastActive, Date.now())),
    joinedAt: numeric(p.joinedAt, Date.now()),
    totalProblemsSolved: Math.max(0, numeric(p.totalProblemsSolved, 0)),
    totalSubmissions: Math.max(0, numeric(p.totalSubmissions, 0)),
    dailyGoal: [3, 5, 10].includes(p.dailyGoal) ? p.dailyGoal : 5,
  };
}

function getLevelFromXp(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function getUserProfile(): UserProfile {
  return migrateProfile(safeGet<unknown | null>(STORAGE_KEYS.USER, null));
}

export function saveUserProfile(profile: UserProfile): void {
  safeSet(STORAGE_KEYS.VERSION, DATA_VERSION);
  safeSet(STORAGE_KEYS.USER, profile);
}

export function getProgress(): Record<string, StudentProgress> {
  const raw = safeGet<Record<string, StudentProgress> | null>(
    STORAGE_KEYS.PROGRESS,
    null
  );
  if (!raw || typeof raw !== "object") return {};
  const clean: Record<string, StudentProgress> = {};
  for (const [id, entry] of Object.entries(raw)) {
    if (!entry || typeof entry !== "object") continue;
    clean[id] = {
      problemId: id,
      status: entry.status || "available",
      attempts: Math.max(0, entry.attempts || 0),
      bestTime: entry.bestTime,
      completedAt: entry.completedAt,
      lastAttemptCode: entry.lastAttemptCode,
      language: entry.language,
    };
  }
  return clean;
}

export function saveProgress(progress: Record<string, StudentProgress>): void {
  safeSet(STORAGE_KEYS.PROGRESS, progress);
}

export function getAchievements(): Achievement[] {
  return safeGet<Achievement[]>(STORAGE_KEYS.ACHIEVEMENTS, []);
}

export function saveAchievements(achievements: Achievement[]): void {
  safeSet(STORAGE_KEYS.ACHIEVEMENTS, achievements);
}

export interface ActivityEntry {
  id: string;
  type: "solved" | "lesson" | "xp" | "challenge";
  label: string;
  detail?: string;
  at: number;
}

export function getActivity(): ActivityEntry[] {
  const list = safeGet<ActivityEntry[]>(STORAGE_KEYS.ACTIVITY, []);
  return Array.isArray(list)
    ? list.filter((e) => e && typeof e === "object").slice(0, 30)
    : [];
}

export function addActivity(entry: Omit<ActivityEntry, "id" | "at">): void {
  const list = getActivity();
  const next = [
    {
      ...entry,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      at: Date.now(),
    },
    ...list,
  ].slice(0, 30);
  safeSet(STORAGE_KEYS.ACTIVITY, next);
}

export function isOnboardingCompleted(): boolean {
  return safeGet<boolean>(STORAGE_KEYS.ONBOARDING, false) === true;
}

export function setOnboardingCompleted(completed: boolean): void {
  safeSet(STORAGE_KEYS.ONBOARDING, completed);
}

export function getSavedLanguage(): string | null {
  const value = safeGet<string | null>(STORAGE_KEYS.LANGUAGE, null);
  return typeof value === "string" ? value : null;
}

export function saveLanguage(language: string): void {
  safeSet(STORAGE_KEYS.LANGUAGE, language);
}

// ---------------- Notes & bookmarks ----------------

export type NoteKey = string; // e.g. "lesson:introduction" | "problem:problem-001"

export function getNotes(): Record<string, string> {
  const raw = safeGet<Record<string, string> | null>(STORAGE_KEYS.NOTES, null);
  return raw && typeof raw === "object" ? raw : {};
}

export function saveNote(key: NoteKey, text: string): void {
  const notes = getNotes();
  const trimmed = text.trim();
  if (trimmed) {
    notes[key] = trimmed;
  } else {
    delete notes[key];
  }
  safeSet(STORAGE_KEYS.NOTES, notes);
}

export function getBookmarks(): string[] {
  const list = safeGet<string[]>(STORAGE_KEYS.BOOKMARKS, []);
  return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
}

export function toggleBookmark(key: NoteKey): string[] {
  const list = getBookmarks();
  const next = list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
  safeSet(STORAGE_KEYS.BOOKMARKS, next);
  return next;
}

// ---------------- Export / Import ----------------

export interface ExportBundle {
  app: "codora";
  version: number;
  exportedAt: number;
  profile: UserProfile;
  progress: Record<string, StudentProgress>;
  achievements: Achievement[];
  notes: Record<string, string>;
  bookmarks: string[];
  savedPrograms: unknown[];
  solvedChallenges: string[];
  language: string | null;
  onboardingCompleted: boolean;
}

export function exportAllData(): ExportBundle {
  return {
    app: "codora",
    version: DATA_VERSION,
    exportedAt: Date.now(),
    profile: getUserProfile(),
    progress: getProgress(),
    achievements: getAchievements(),
    notes: getNotes(),
    bookmarks: getBookmarks(),
    savedPrograms: safeGet<unknown[]>(STORAGE_KEYS.SAVED_PROGRAMS, []),
    solvedChallenges: getSolvedChallenges(),
    language: getSavedLanguage(),
    onboardingCompleted: isOnboardingCompleted(),
  };
}

export function validateImport(input: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Not a valid Codora backup." };
  }
  const bundle = input as Partial<ExportBundle>;
  if (bundle.app !== "codora") {
    return { valid: false, error: "This file is not a Codora backup." };
  }
  if (typeof bundle.version !== "number") {
    return { valid: false, error: "Backup version is missing." };
  }
  if (!bundle.profile || typeof bundle.profile !== "object") {
    return { valid: false, error: "Backup is missing profile data." };
  }
  return { valid: true };
}

export function importAllData(input: unknown): { ok: boolean; error?: string } {
  const check = validateImport(input);
  if (!check.valid) return { ok: false, error: check.error };
  const bundle = input as ExportBundle;

  saveUserProfile(migrateProfile(bundle.profile));
  saveProgress(
    bundle.progress && typeof bundle.progress === "object" ? bundle.progress : {}
  );
  if (Array.isArray(bundle.achievements)) {
    saveAchievements(bundle.achievements as Achievement[]);
  }
  if (bundle.notes && typeof bundle.notes === "object") {
    safeSet(STORAGE_KEYS.NOTES, bundle.notes);
  }
  if (Array.isArray(bundle.bookmarks)) {
    safeSet(STORAGE_KEYS.BOOKMARKS, bundle.bookmarks);
  }
  if (Array.isArray(bundle.savedPrograms)) {
    safeSet(STORAGE_KEYS.SAVED_PROGRAMS, bundle.savedPrograms);
  }
  if (typeof bundle.language === "string") {
    safeSet(STORAGE_KEYS.LANGUAGE, bundle.language);
  }
  if (Array.isArray(bundle.solvedChallenges)) {
    safeSet(STORAGE_KEYS.CHALLENGES_SOLVED, bundle.solvedChallenges);
  }
  setOnboardingCompleted(bundle.onboardingCompleted === true);
  safeSet(STORAGE_KEYS.VERSION, DATA_VERSION);
  return { ok: true };
}

/** Removes EVERY Codora-owned key. Unrelated app storage is untouched. */
export function clearAllData(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CODORA_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {}
}

export function getStoredKeyNames(): string[] {
  if (typeof window === "undefined") return [];
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CODORA_PREFIX)) keys.push(key);
    }
  } catch {}
  return keys;
}

// ---------------- Challenges ----------------

export function getSolvedChallenges(): string[] {
  const list = safeGet<string[]>(STORAGE_KEYS.CHALLENGES_SOLVED, []);
  return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
}

export function markChallengeSolved(challengeId: string): void {
  const list = getSolvedChallenges();
  if (!list.includes(challengeId)) {
    safeSet(STORAGE_KEYS.CHALLENGES_SOLVED, [...list, challengeId]);
  }
}